import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  STURVS_ARTWORKS,
  STURVS_CANVAS_CONFIG,
  STURVS_TILE_CONFIG,
  type SturvsArtwork,
} from '../data/sturvsManifest'

/**
 * Phone version of the STURVS infinite canvas.
 *
 * The desktop canvas scales one huge "world" element holding 9 copies of every
 * artwork (~17,000 x 9,000px), which runs iPhone Safari out of memory. Here there
 * is no big layer at all: the camera lives in a ref, and only the artworks that
 * are actually on screen (plus a margin) are mounted, each positioned directly in
 * screen pixels. Wrapping the world in both directions keeps it infinite.
 */

interface Props {
  onSelect: (artwork: SturvsArtwork) => void
  getSrc: (src: string) => string
  onImageError: (img: HTMLImageElement, originalSrc: string) => void
}

type Camera = { x: number; y: number; z: number }

const PERIOD_W = STURVS_TILE_CONFIG.periodWidth
const PERIOD_H = STURVS_TILE_CONFIG.periodHeight
const MIN_Z = STURVS_CANVAS_CONFIG.minZoom
const MAX_Z = STURVS_CANVAS_CONFIG.maxZoom
const MARGIN = 160 // px beyond the screen edge to keep mounted
const TAP_SLOP = 8 // px of movement still counted as a tap
const FRICTION = 0.92

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export default function SturvsPhoneCanvas({ onSelect, getSrc, onImageError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef({ w: typeof window !== 'undefined' ? window.innerWidth : 390, h: typeof window !== 'undefined' ? window.innerHeight : 844 })

  const camRef = useRef<Camera>({ x: 0, y: 0, z: STURVS_CANVAS_CONFIG.defaultZoomMobile })
  const [, setFrame] = useState(0)
  const rafRef = useRef<number | null>(null)

  // Gesture state
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const startRef = useRef<{ x: number; y: number; moved: number; time: number; artId?: string } | null>(null)
  const lastMoveRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const velocityRef = useRef({ vx: 0, vy: 0 })
  const pinchRef = useRef<{ dist: number; z: number } | null>(null)
  const momentumRef = useRef<number | null>(null)

  const render = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const el = containerRef.current
      if (el) {
        const { x, y, z } = camRef.current
        el.style.backgroundPosition = `${x}px ${y}px`
        el.style.backgroundSize = `${48 * z}px ${48 * z}px`
      }
      setFrame((f) => (f + 1) % 1_000_000)
    })
  }, [])

  // Measure and centre the camera on first mount; keep size current on resize
  useLayoutEffect(() => {
    const el = containerRef.current
    const measure = () => {
      if (!el) return
      sizeRef.current = { w: el.clientWidth || window.innerWidth, h: el.clientHeight || window.innerHeight }
    }
    measure()
    const z = camRef.current.z
    camRef.current = {
      z,
      x: sizeRef.current.w / 2 - STURVS_CANVAS_CONFIG.initialCenter.x * z,
      y: sizeRef.current.h / 2 - STURVS_CANVAS_CONFIG.initialCenter.y * z,
    }
    render()
    const onResize = () => {
      measure()
      render()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [render])

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (momentumRef.current !== null) cancelAnimationFrame(momentumRef.current)
    },
    []
  )

  const stopMomentum = () => {
    if (momentumRef.current !== null) {
      cancelAnimationFrame(momentumRef.current)
      momentumRef.current = null
    }
  }

  const startMomentum = () => {
    stopMomentum()
    const step = () => {
      const v = velocityRef.current
      if (Math.abs(v.vx) < 0.2 && Math.abs(v.vy) < 0.2) {
        momentumRef.current = null
        return
      }
      camRef.current.x += v.vx
      camRef.current.y += v.vy
      v.vx *= FRICTION
      v.vy *= FRICTION
      render()
      momentumRef.current = requestAnimationFrame(step)
    }
    momentumRef.current = requestAnimationFrame(step)
  }

  const zoomAt = (newZ: number, px: number, py: number) => {
    const cam = camRef.current
    const z = clamp(newZ, MIN_Z, MAX_Z)
    const ratio = z / cam.z
    cam.x = px - (px - cam.x) * ratio
    cam.y = py - (py - cam.y) * ratio
    cam.z = z
  }

  const localPoint = (e: { clientX: number; clientY: number }) => {
    const rect = containerRef.current?.getBoundingClientRect()
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    stopMomentum()
    try {
      containerRef.current?.setPointerCapture?.(e.pointerId)
    } catch {
      // pointer capture is optional
    }
    const p = localPoint(e)
    pointersRef.current.set(e.pointerId, p)
    if (pointersRef.current.size === 1) {
      // Remember what was under the finger now: once the pointer is captured,
      // later events report the container as their target
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-art-id]')
      startRef.current = { x: p.x, y: p.y, moved: 0, time: performance.now(), artId: card?.dataset.artId }
      lastMoveRef.current = { x: p.x, y: p.y, t: performance.now() }
      velocityRef.current = { vx: 0, vy: 0 }
    } else if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()]
      pinchRef.current = { dist: Math.hypot(b.x - a.x, b.y - a.y), z: camRef.current.z }
      if (startRef.current) startRef.current.moved = Infinity // a pinch is never a tap
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointersRef.current.get(e.pointerId)
    if (!prev) return
    const p = localPoint(e)
    pointersRef.current.set(e.pointerId, p)

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()]
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      // Pan with the midpoint as well as zooming around it
      const dx = (p.x - prev.x) / 2
      const dy = (p.y - prev.y) / 2
      camRef.current.x += dx
      camRef.current.y += dy
      zoomAt(pinchRef.current.z * (dist / pinchRef.current.dist), midX, midY)
      render()
      return
    }

    const dx = p.x - prev.x
    const dy = p.y - prev.y
    camRef.current.x += dx
    camRef.current.y += dy
    if (startRef.current) startRef.current.moved += Math.hypot(dx, dy)

    const now = performance.now()
    const last = lastMoveRef.current
    if (last) {
      const dt = Math.max(1, now - last.t)
      // Smoothed velocity in px per frame (~16ms)
      velocityRef.current = {
        vx: velocityRef.current.vx * 0.6 + ((p.x - last.x) / dt) * 16 * 0.4,
        vy: velocityRef.current.vy * 0.6 + ((p.y - last.y) / dt) * 16 * 0.4,
      }
    }
    lastMoveRef.current = { x: p.x, y: p.y, t: now }
    render()
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const had = pointersRef.current.delete(e.pointerId)
    if (!had) return

    if (pointersRef.current.size === 1) {
      // Pinch ended with one finger still down: continue as a pan from here
      pinchRef.current = null
      const [p] = [...pointersRef.current.values()]
      lastMoveRef.current = { x: p.x, y: p.y, t: performance.now() }
      velocityRef.current = { vx: 0, vy: 0 }
      return
    }
    if (pointersRef.current.size > 0) return

    pinchRef.current = null
    const start = startRef.current
    startRef.current = null

    const isTap = start && start.moved <= TAP_SLOP && performance.now() - start.time < 500
    if (isTap && e.type === 'pointerup') {
      const artwork = start.artId ? STURVS_ARTWORKS.find((a) => a.id === start.artId) : undefined
      if (artwork) onSelect(artwork)
      return
    }

    // Only fling if the finger was still moving when it lifted
    const last = lastMoveRef.current
    if (last && performance.now() - last.t < 80) startMomentum()
  }

  // Work out which artwork copies are on screen
  const { x: camX, y: camY, z } = camRef.current
  const { w: vw, h: vh } = sizeRef.current
  const pw = PERIOD_W * z
  const ph = PERIOD_H * z
  const visible: { art: SturvsArtwork; key: string; sx: number; sy: number }[] = []

  for (const art of STURVS_ARTWORKS) {
    const ax = art.x * z + camX
    const ay = art.y * z + camY
    const w = art.width * z
    const h = art.height * z
    const kx0 = Math.ceil((-MARGIN - w - ax) / pw)
    const ky0 = Math.ceil((-MARGIN - h - ay) / ph)
    for (let kx = kx0; ax + kx * pw < vw + MARGIN; kx++) {
      for (let ky = ky0; ay + ky * ph < vh + MARGIN; ky++) {
        visible.push({ art, key: `${art.id}:${kx}:${ky}`, sx: ax + kx * pw, sy: ay + ky * ph })
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="sturvs-viewport sturvs-phone-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {visible.map(({ art, key, sx, sy }) => (
        <div
          key={key}
          data-art-id={art.id}
          className="sturvs-phone-card"
          role="button"
          aria-label={`View ${art.title || 'Artwork'}`}
          style={{
            width: art.width * z,
            height: art.height * z,
            transform: `translate3d(${sx}px, ${sy}px, 0) rotate(${art.rotation || 0}deg)`,
          }}
        >
          <img
            src={getSrc(art.src)}
            onError={(e) => onImageError(e.currentTarget, art.src)}
            alt={art.title || 'Artwork'}
            decoding="async"
            draggable={false}
          />
        </div>
      ))}
    </div>
  )
}
