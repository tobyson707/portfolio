import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  STURVS_ARTWORKS,
  STURVS_CANVAS_CONFIG,
  STURVS_TILE_CONFIG,
  type SturvsArtwork,
} from '../data/sturvsManifest'
import { useStore } from '../store'

export interface SturvsCanvasProps {
  onClose: () => void
}

// Memoized individual Artwork Card component to eliminate re-renders during canvas navigation
interface ArtworkCardProps {
  artwork: SturvsArtwork
  isSelected: boolean
  onSelect: (artwork: SturvsArtwork) => void
  onImageLoaded: (id: string, ratio: string) => void
  customRatio?: string
}

const ArtworkCard = React.memo(function ArtworkCard({
  artwork,
  isSelected,
  onSelect,
  onImageLoaded,
  customRatio,
}: ArtworkCardProps) {
  const currentRatio = customRatio || artwork.aspectRatio
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const isTouchTapRef = useRef<boolean>(false)

  const handleCardPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleCardPointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return
    const dx = e.clientX - pointerStartRef.current.x
    const dy = e.clientY - pointerStartRef.current.y
    const dist = Math.hypot(dx, dy)
    pointerStartRef.current = null

    // Touch tap: instant trigger on finger release if movement <= 8px
    if (dist <= 8 && e.pointerType === 'touch') {
      isTouchTapRef.current = true
      setTimeout(() => {
        isTouchTapRef.current = false
      }, 400)
      onSelect(artwork)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isTouchTapRef.current) return
    onSelect(artwork)
  }

  return (
    <div
      className={`sturvs-artwork-item ${isSelected ? 'is-selected' : ''}`}
      style={{
        left: artwork.x,
        top: artwork.y,
        width: artwork.width,
        transform: artwork.rotation ? `rotate(${artwork.rotation}deg)` : undefined,
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${artwork.title || 'Artwork'}`}
      onPointerDown={handleCardPointerDown}
      onPointerUp={handleCardPointerUp}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          onSelect(artwork)
        }
      }}
    >
      <div className="sturvs-artwork-frame" style={{ aspectRatio: currentRatio }}>
        <img
          src={artwork.src}
          alt={artwork.title || 'Artwork'}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="sturvs-artwork-img"
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth && img.naturalHeight) {
              onImageLoaded(artwork.id, `${img.naturalWidth} / ${img.naturalHeight}`)
            }
          }}
        />
      </div>
    </div>
  )
})

export default function SturvsCanvas({ onClose }: SturvsCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const lastFocusedTriggerRef = useRef<HTMLElement | null>(null)
  const setIsModalOpen = useStore((s) => s.setIsModalOpen)
  const shouldReduceMotion = useReducedMotion()

  // Selected Artwork Presentation state (one authoritative state)
  const [selectedArtwork, setSelectedArtwork] = useState<SturvsArtwork | null>(null)
  const [loadedRatios, setLoadedRatios] = useState<Record<string, string>>({})
  const [displayedZoom, setDisplayedZoom] = useState<number>(100)
  const [hasInteracted, setHasInteracted] = useState<boolean>(false)
  const [isDraggingState, setIsDraggingState] = useState<boolean>(false)

  // Dynamic image aspect ratio detection on load
  const handleImageLoaded = useCallback((id: string, ratio: string) => {
    setLoadedRatios((prev) => (prev[id] === ratio ? prev : { ...prev, [id]: ratio }))
  }, [])

  // Focus management: move focus to close button when opened
  useEffect(() => {
    if (selectedArtwork) {
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [selectedArtwork])

  // Initial Camera values
  const getInitialZoom = () => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    return vw < 640
      ? STURVS_CANVAS_CONFIG.defaultZoomMobile
      : vw < 1024
      ? STURVS_CANVAS_CONFIG.defaultZoomTablet
      : STURVS_CANVAS_CONFIG.defaultZoomDesktop
  }

  const initialZoom = getInitialZoom()
  const initialPan = {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 - STURVS_CANVAS_CONFIG.initialCenter.x * initialZoom : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 - STURVS_CANVAS_CONFIG.initialCenter.y * initialZoom : 0,
  }

  // Camera mutable references for 60-120fps direct hardware manipulation
  const panRef = useRef<{ x: number; y: number }>({ ...initialPan })
  const zoomRef = useRef<number>(initialZoom)
  const isDraggingRef = useRef<boolean>(false)
  const isAnimatingRef = useRef<boolean>(false)
  const rafIdRef = useRef<number | null>(null)

  // Smooth zoom animation target
  const targetZoomRef = useRef<number>(initialZoom)
  const zoomAnchorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Momentum & Velocity tracking with moving average filter
  const velocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 })
  const lastPointerRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 })

  // Separate click from pan with a strict 7px movement threshold
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const isPointerDownRef = useRef<boolean>(false)
  const hasMovedPastThresholdRef = useRef<boolean>(false)
  const justDraggedUntilRef = useRef<number>(0)
  const dragDistanceRef = useRef<number>(0)
  const activePointerIdRef = useRef<number | null>(null)

  // Multi-touch pinch tracking
  const pinchStartDistRef = useRef<number | null>(null)
  const pinchStartZoomRef = useRef<number>(initialZoom)
  const pinchMidpointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Toroidal Grid Sector State — only updates when crossing sector boundaries
  const [sector, setSector] = useState<{ x: number; y: number }>({
    x: Math.floor((-initialPan.x / initialZoom) / STURVS_TILE_CONFIG.periodWidth),
    y: Math.floor((-initialPan.y / initialZoom) / STURVS_TILE_CONFIG.periodHeight),
  })
  const lastSectorRef = useRef<{ x: number; y: number }>({ ...sector })

  // Synchronize DOM transform directly without React reconciler overhead
  const applyTransform = useCallback(() => {
    const x = panRef.current.x
    const y = panRef.current.y
    const z = zoomRef.current

    if (worldRef.current) {
      worldRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`
    }
    if (viewportRef.current) {
      viewportRef.current.style.backgroundPosition = `${x}px ${y}px`
      viewportRef.current.style.backgroundSize = `${48 * z}px ${48 * z}px`
    }

    // Check if sector changed for infinite toroidal wrapping
    const secX = Math.floor((-x / z) / STURVS_TILE_CONFIG.periodWidth)
    const secY = Math.floor((-y / z) / STURVS_TILE_CONFIG.periodHeight)
    if (secX !== lastSectorRef.current.x || secY !== lastSectorRef.current.y) {
      lastSectorRef.current = { x: secX, y: secY }
      setSector({ x: secX, y: secY })
    }
  }, [])

  // High-performance continuous animation / inertia loop
  const runAnimationLoop = useCallback(() => {
    if (isAnimatingRef.current) return
    isAnimatingRef.current = true

    let lastTime = performance.now()

    const loop = (currentTime: number) => {
      const dt = Math.min(32, Math.max(1, currentTime - lastTime))
      lastTime = currentTime
      const frameScale = dt / 16.666

      let isMoving = false

      // 1. Smooth Zoom Interpolation
      const zoomDiff = targetZoomRef.current - zoomRef.current
      if (Math.abs(zoomDiff) > 0.001) {
        const zoomStep = zoomDiff * Math.min(1, 0.22 * frameScale)
        const oldZoom = zoomRef.current
        const newZoom = oldZoom + zoomStep
        const scaleRatio = newZoom / oldZoom

        const focalX = zoomAnchorRef.current.x
        const focalY = zoomAnchorRef.current.y

        panRef.current.x = focalX - (focalX - panRef.current.x) * scaleRatio
        panRef.current.y = focalY - (focalY - panRef.current.y) * scaleRatio
        zoomRef.current = newZoom
        setDisplayedZoom(Math.round(newZoom * 100))
        isMoving = true
      } else if (zoomRef.current !== targetZoomRef.current) {
        zoomRef.current = targetZoomRef.current
        setDisplayedZoom(Math.round(targetZoomRef.current * 100))
      }

      // 2. Inertial Momentum Gliding (when not dragging)
      if (!isDraggingRef.current) {
        const { vx, vy } = velocityRef.current
        const speed = Math.hypot(vx, vy)

        if (speed > 0.01) {
          panRef.current.x += vx * 16 * frameScale
          panRef.current.y += vy * 16 * frameScale

          // Natural exponential friction deceleration
          const friction = Math.pow(0.935, frameScale)
          velocityRef.current.vx *= friction
          velocityRef.current.vy *= friction
          isMoving = true
        } else {
          velocityRef.current = { vx: 0, vy: 0 }
        }
      }

      applyTransform()

      if (isMoving || isDraggingRef.current) {
        rafIdRef.current = requestAnimationFrame(loop)
      } else {
        isAnimatingRef.current = false
        rafIdRef.current = null
      }
    }

    rafIdRef.current = requestAnimationFrame(loop)
  }, [applyTransform])

  // Trigger frame update whenever state requires animation
  const requestFrame = useCallback(() => {
    if (!isAnimatingRef.current) {
      runAnimationLoop()
    }
  }, [runAnimationLoop])

  // Initial mount setup & transform synchronization
  useEffect(() => {
    applyTransform()
    setDisplayedZoom(Math.round(zoomRef.current * 100))
  }, [applyTransform])

  // Set modal open state to unmount global navigation menu and activate SUBMERGED audio
  useEffect(() => {
    setIsModalOpen(true)
    useStore.getState().setSelectedCategory('STURVS')
    return () => {
      setIsModalOpen(false)
    }
  }, [setIsModalOpen])

  // Artwork selection: transition into focused fullscreen exhibit
  const handleArtworkClick = useCallback((artwork: SturvsArtwork) => {
    if (hasMovedPastThresholdRef.current || performance.now() < justDraggedUntilRef.current) {
      return // Dragged, avoid accidental click
    }
    console.log(`STURVS artwork clicked: ${artwork.src}`)
    lastFocusedTriggerRef.current = (document.activeElement as HTMLElement) || null
    setSelectedArtwork(artwork)
    console.log('STURVS viewer opened')
  }, [])

  const handleCloseViewer = useCallback(() => {
    setSelectedArtwork(null)
    console.log('STURVS viewer closed')
    if (lastFocusedTriggerRef.current) {
      setTimeout(() => {
        lastFocusedTriggerRef.current?.focus()
      }, 50)
    }
  }, [])

  // Lock body overflow and handle browser history
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handlePopState = () => {
      if (selectedArtwork) {
        setSelectedArtwork(null)
      } else {
        onClose()
      }
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('popstate', handlePopState)
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [onClose, selectedArtwork])

  // Smooth Zoom-at-Point
  const zoomAtPoint = useCallback(
    (targetZ: number, focalX: number, focalY: number, immediate = false) => {
      if (selectedArtwork) return
      const clampedZoom = Math.min(
        STURVS_CANVAS_CONFIG.maxZoom,
        Math.max(STURVS_CANVAS_CONFIG.minZoom, targetZ)
      )

      zoomAnchorRef.current = { x: focalX, y: focalY }

      if (immediate) {
        const oldZoom = zoomRef.current
        const scaleRatio = clampedZoom / oldZoom
        panRef.current.x = focalX - (focalX - panRef.current.x) * scaleRatio
        panRef.current.y = focalY - (focalY - panRef.current.y) * scaleRatio
        zoomRef.current = clampedZoom
        targetZoomRef.current = clampedZoom
        setDisplayedZoom(Math.round(clampedZoom * 100))
        applyTransform()
      } else {
        targetZoomRef.current = clampedZoom
        requestFrame()
      }
    },
    [selectedArtwork, applyTransform, requestFrame]
  )

  // Step zoom for toolbar buttons (+ and -)
  const handleZoomStep = useCallback(
    (factor: number) => {
      if (selectedArtwork) return
      setHasInteracted(true)
      const vw = viewportRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200)
      const vh = viewportRef.current?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 800)
      zoomAtPoint(zoomRef.current * factor, vw / 2, vh / 2)
    },
    [zoomAtPoint, selectedArtwork]
  )

  // Fit all artworks neatly into current viewport / Reset to initial cluster
  const fitAllToView = useCallback(() => {
    if (selectedArtwork || typeof window === 'undefined') return
    const vw = viewportRef.current?.clientWidth || window.innerWidth
    const vh = viewportRef.current?.clientHeight || window.innerHeight

    const targetZ =
      vw < 640
        ? STURVS_CANVAS_CONFIG.defaultZoomMobile
        : vw < 1024
        ? STURVS_CANVAS_CONFIG.defaultZoomTablet
        : STURVS_CANVAS_CONFIG.defaultZoomDesktop

    const centerX = STURVS_CANVAS_CONFIG.initialCenter.x
    const centerY = STURVS_CANVAS_CONFIG.initialCenter.y

    panRef.current = {
      x: vw / 2 - centerX * targetZ,
      y: vh / 2 - centerY * targetZ,
    }
    zoomRef.current = targetZ
    targetZoomRef.current = targetZ
    velocityRef.current = { vx: 0, vy: 0 }
    setDisplayedZoom(Math.round(targetZ * 100))
    applyTransform()
  }, [applyTransform, selectedArtwork])

  // Keyboard navigation & Shortcuts (ESC, +, -, 0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (selectedArtwork) {
          handleCloseViewer()
        } else {
          onClose()
        }
      } else if (!selectedArtwork) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault()
          handleZoomStep(1.2)
        } else if (e.key === '-') {
          e.preventDefault()
          handleZoomStep(0.833)
        } else if (e.key === '0') {
          e.preventDefault()
          fitAllToView()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, selectedArtwork, handleCloseViewer, handleZoomStep, fitAllToView])

  // Trackpad 2-finger pan and Ctrl/Meta zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (selectedArtwork) return
    setHasInteracted(true)

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
      zoomAtPoint(zoomRef.current * zoomFactor, e.clientX, e.clientY, true)
    } else {
      panRef.current.x -= e.deltaX * 1.0
      panRef.current.y -= e.deltaY * 1.0
      velocityRef.current = { vx: -e.deltaX * 0.1, vy: -e.deltaY * 0.1 }
      applyTransform()
      requestFrame()
    }
  }

  // Pointer drag event handlers with proper separation between CLICK and PAN
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selectedArtwork || e.button !== 0) return

    // Stop ongoing inertia instantly on grab
    velocityRef.current = { vx: 0, vy: 0 }

    isPointerDownRef.current = true
    hasMovedPastThresholdRef.current = false
    dragDistanceRef.current = 0

    const now = performance.now()
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY }
    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now }
    activePointerIdRef.current = e.pointerId

    // Note: Do NOT capture pointer here on pointerdown so child clicks/taps can bubble normally
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current || selectedArtwork) return
    const now = performance.now()

    const startX = pointerStartPosRef.current?.x ?? e.clientX
    const startY = pointerStartPosRef.current?.y ?? e.clientY
    const totalDist = Math.hypot(e.clientX - startX, e.clientY - startY)
    dragDistanceRef.current = totalDist

    // If movement is within 7px threshold, do not engage drag yet
    if (!hasMovedPastThresholdRef.current) {
      if (totalDist > 7) {
        hasMovedPastThresholdRef.current = true
        isDraggingRef.current = true
        setIsDraggingState(true)
        setHasInteracted(true)

        // Capture pointer now that genuine drag has commenced
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // ignore
        }
      } else {
        return
      }
    }

    const dt = Math.max(1, now - lastPointerRef.current.time)
    const dx = e.clientX - lastPointerRef.current.x
    const dy = e.clientY - lastPointerRef.current.y

    // Direct sub-pixel pan update
    panRef.current.x += dx
    panRef.current.y += dy

    // Filtered velocity calculation (exponential moving average)
    const instantVx = dx / dt
    const instantVy = dy / dt
    velocityRef.current = {
      vx: velocityRef.current.vx * 0.4 + instantVx * 0.6,
      vy: velocityRef.current.vy * 0.4 + instantVy * 0.6,
    }

    lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now }
    applyTransform()
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return
    isPointerDownRef.current = false

    const wasDragging = hasMovedPastThresholdRef.current

    if (activePointerIdRef.current !== null) {
      try {
        if (e.currentTarget.hasPointerCapture(activePointerIdRef.current)) {
          e.currentTarget.releasePointerCapture(activePointerIdRef.current)
        }
      } catch {
        // Ignore
      }
      activePointerIdRef.current = null
    }

    isDraggingRef.current = false
    setIsDraggingState(false)

    if (wasDragging) {
      // Discard trailing synthetic click
      justDraggedUntilRef.current = performance.now() + 180

      // Engage smooth momentum if released with velocity
      const speed = Math.hypot(velocityRef.current.vx, velocityRef.current.vy)
      if (speed > 0.08) {
        requestFrame()
      } else {
        velocityRef.current = { vx: 0, vy: 0 }
      }
    } else {
      velocityRef.current = { vx: 0, vy: 0 }
    }
  }

  // Touch handlers for multi-touch pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (selectedArtwork) return
    if (e.touches.length === 2) {
      isDraggingRef.current = false
      setIsDraggingState(false)
      hasMovedPastThresholdRef.current = true
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      pinchStartDistRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      pinchStartZoomRef.current = zoomRef.current
      pinchMidpointRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (selectedArtwork) return
    if (e.touches.length === 2 && pinchStartDistRef.current) {
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const factor = currentDist / pinchStartDistRef.current

      const midX = (t1.clientX + t2.clientX) / 2
      const midY = (t1.clientY + t2.clientY) / 2

      zoomAtPoint(pinchStartZoomRef.current * factor, midX, midY, true)
    }
  }

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null
  }

  // Render 3x3 surrounding toroidal tiles around the current sector
  const tileOffsets = useMemo(() => {
    const offsets: { tx: number; ty: number; key: string }[] = []
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tx = sector.x + dx
        const ty = sector.y + dy
        offsets.push({ tx, ty, key: `${tx}_${ty}` })
      }
    }
    return offsets
  }, [sector.x, sector.y])

  return (
    <>
      <motion.div
        className={`sturvs-canvas-overlay ${selectedArtwork ? 'has-focused-work' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="STURVS Interactive Creative Canvas"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top Header Bar */}
        <header className="sturvs-header-bar">
          <div className="sturvs-brand-cluster">
            <h2 className="sturvs-brand-name">STURVS</h2>
            <span className="sturvs-brand-dot" aria-hidden="true">·</span>
            <span className="sturvs-brand-meta">A SPACE FOR EVERYTHING ELSE</span>
          </div>

          <button
            type="button"
            className="sturvs-return-btn"
            onClick={onClose}
            aria-label="Back to Works"
            title="Back to Works (Esc)"
          >
            <span className="sturvs-return-icon" aria-hidden="true">
              ✕
            </span>
            <span className="sturvs-return-label">WORKS</span>
          </button>
        </header>

        {/* Interactive Freeform Viewport with Infinite Seamless Ambient Dots */}
        <div
          ref={viewportRef}
          className={`sturvs-viewport ${isDraggingState ? 'is-dragging' : ''} ${selectedArtwork ? 'is-focus-mode' : ''}`}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Infinite Toroidal World Plane */}
          <div ref={worldRef} className="sturvs-world">
            {tileOffsets.map(({ tx, ty, key }) => (
              <div
                key={key}
                className="sturvs-grid-tile"
                style={{
                  width: STURVS_TILE_CONFIG.periodWidth,
                  height: STURVS_TILE_CONFIG.periodHeight,
                  transform: `translate3d(${tx * STURVS_TILE_CONFIG.periodWidth}px, ${ty * STURVS_TILE_CONFIG.periodHeight}px, 0)`,
                }}
              >
                {STURVS_ARTWORKS.map((artwork) => (
                  <ArtworkCard
                    key={`${key}-${artwork.id}`}
                    artwork={artwork}
                    isSelected={selectedArtwork?.id === artwork.id}
                    onSelect={handleArtworkClick}
                    onImageLoaded={handleImageLoaded}
                    customRatio={loadedRatios[artwork.id]}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Floating Discreet Navigation & Zoom Toolbar (Canvas Exploration State) */}
        {!selectedArtwork && (
          <nav className="sturvs-floating-toolbar" aria-label="Canvas Zoom Controls">
            <button
              type="button"
              className="sturvs-btn-tool"
              onClick={() => handleZoomStep(0.833)}
              aria-label="Zoom Out"
              title="Zoom Out (−)"
            >
              −
            </button>

            <span className="sturvs-zoom-percentage">{displayedZoom}%</span>

            <button
              type="button"
              className="sturvs-btn-tool"
              onClick={() => handleZoomStep(1.2)}
              aria-label="Zoom In"
              title="Zoom In (+)"
            >
              +
            </button>

            <span className="sturvs-tool-divider" aria-hidden="true" />

            <button
              type="button"
              className="sturvs-btn-tool reset-fit"
              onClick={fitAllToView}
              aria-label="Reset to Fit All"
              title="Reset to Fit All (0)"
            >
              RESET
            </button>
          </nav>
        )}

        {/* First-time Interaction Guidance Pill */}
        {!hasInteracted && !selectedArtwork && (
          <div className="sturvs-guidance-pill" aria-hidden="true">
            <span>DRAG TO EXPLORE · CLICK TO FOCUS</span>
          </div>
        )}
      </motion.div>

      {/* FULLSCREEN FOCUSED ARTWORK VIEWER (Rendered via root portal to guarantee no ancestor clipping) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {selectedArtwork && (
              <motion.div
                className="sturvs-artwork-viewer sturvs-focus-stage"
                role="dialog"
                aria-modal="true"
                aria-label={selectedArtwork.title ? `Artwork: ${selectedArtwork.title}` : 'Selected Artwork Viewer'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0.2 : 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {/* Dark Viewport-Level Overlay (Clicking closes viewer) */}
                <div
                  className="sturvs-viewer-overlay"
                  onClick={handleCloseViewer}
                  aria-hidden="true"
                />

                {/* Minimal Upper-Right Close Button */}
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="sturvs-viewer-close sturvs-focus-close-btn"
                  onClick={handleCloseViewer}
                  aria-label="Close artwork viewer (Esc)"
                  title="Close (Esc)"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Focused Artwork Content - Centered, Responsive, Natural Proportions */}
                <motion.div
                  className="sturvs-viewer-content sturvs-focus-artwork-container"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: shouldReduceMotion ? 0.2 : 0.35,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={selectedArtwork.src}
                    alt={selectedArtwork.title || 'Artwork'}
                    className="sturvs-viewer-img sturvs-focus-img"
                    draggable={false}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
