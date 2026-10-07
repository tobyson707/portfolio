import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { WorkListItem } from '../data/works'
import {
  type CategoryPersonality,
  getCategoryDisplayLabel,
} from '../data/categoryPersonality'

interface CategoryRowProps {
  item: WorkListItem
  onOpen: (item: WorkListItem) => void
  onHover: (item: WorkListItem | null) => void
}

export const CategoryRow = React.memo(function CategoryRow({
  item,
  onOpen,
  onHover,
}: CategoryRowProps) {
  const displayLabel = getCategoryDisplayLabel(item)

  return (
    <li className="wk-cat-row">
      <button
        type="button"
        className="wk-cat-btn"
        onClick={() => onOpen(item)}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'touch') {
            onHover(item)
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== 'touch') {
            onHover(null)
          }
        }}
        onFocus={() => onHover(item)}
        onBlur={() => onHover(null)}
        aria-label={displayLabel}
      >
        <span className="wk-cat-name">{displayLabel}</span>
        <span className="wk-cat-arrow-wrap" aria-hidden="true">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="wk-cat-arrow-icon"
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </span>
      </button>
    </li>
  )
})

interface CategoryListProps {
  items: WorkListItem[]
  onOpen: (item: WorkListItem) => void
  onHover: (item: WorkListItem | null) => void
}

export function CategoryList({ items, onOpen, onHover }: CategoryListProps) {
  return (
    <ul className="wk-cat-list" role="list">
      {items.map((it, idx) => (
        <CategoryRow
          key={it.id || it.slug || idx}
          item={it}
          onOpen={onOpen}
          onHover={onHover}
        />
      ))}
    </ul>
  )
}

export interface FloatingCategoryCardProps {
  personality: CategoryPersonality | null
}

export function FloatingCategoryCard({ personality }: FloatingCategoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [displayedPersonality, setDisplayedPersonality] = useState<CategoryPersonality | null>(null)
  const isVisible = Boolean(personality)

  // Current & target coordinates for 60-120fps hardware-accelerated interpolation
  const currentPosRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 })
  const targetPosRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 })
  const hasPositionRef = useRef(false)
  const isPointerInsideRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (personality) {
      setDisplayedPersonality(personality)
      isPointerInsideRef.current = true
    } else {
      isPointerInsideRef.current = false
    }
  }, [personality])

  const updateCardPosition = useCallback((clientX: number, clientY: number) => {
    const CARD_WIDTH = 220
    const CARD_HEIGHT = 44
    const OFFSET_X = 20
    const OFFSET_Y = 16

    let nextX = clientX + OFFSET_X
    let nextY = clientY + OFFSET_Y

    // Viewport right edge collision flip
    if (nextX + CARD_WIDTH > window.innerWidth - 14) {
      nextX = clientX - CARD_WIDTH - OFFSET_X
    }

    // Viewport bottom edge collision flip
    if (nextY + CARD_HEIGHT > window.innerHeight - 14) {
      nextY = clientY - CARD_HEIGHT - OFFSET_Y
    }

    // Clamping strictly within visible viewport
    nextX = Math.max(12, Math.min(window.innerWidth - CARD_WIDTH - 12, nextX))
    nextY = Math.max(12, Math.min(window.innerHeight - CARD_HEIGHT - 12, nextY))

    targetPosRef.current = { x: nextX, y: nextY }

    if (!hasPositionRef.current) {
      currentPosRef.current = { x: nextX, y: nextY }
      hasPositionRef.current = true
      if (cardRef.current) {
        cardRef.current.style.transform = `translate3d(${Math.round(nextX)}px, ${Math.round(nextY)}px, 0)`
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    if (isCoarse) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      updateCardPosition(e.clientX, e.clientY)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })

    const tick = () => {
      if (hasPositionRef.current && cardRef.current) {
        const factor = prefersReducedMotion ? 1 : 0.22
        const cur = currentPosRef.current
        const tgt = targetPosRef.current

        cur.x += (tgt.x - cur.x) * factor
        cur.y += (tgt.y - cur.y) * factor

        cardRef.current.style.transform = `translate3d(${Math.round(cur.x)}px, ${Math.round(cur.y)}px, 0)`
      }
      rafIdRef.current = requestAnimationFrame(tick)
    }

    rafIdRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [updateCardPosition])

  if (!mounted || typeof document === 'undefined' || !displayedPersonality) {
    return null
  }

  return createPortal(
    <aside
      ref={cardRef}
      className={`wk-floating-card ${isVisible ? 'is-visible' : ''}`}
      aria-hidden="true"
      style={{
        transform: `translate3d(${Math.round(currentPosRef.current.x)}px, ${Math.round(currentPosRef.current.y)}px, 0)`,
      }}
    >
      <span className="wk-floating-card-text">
        {displayedPersonality.text || displayedPersonality.title}
      </span>
    </aside>,
    document.body
  )
}
