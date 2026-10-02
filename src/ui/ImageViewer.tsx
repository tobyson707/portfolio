import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { reportMissingImage, type IllustrationImage } from '../data/worksManifest'
import { useStore } from '../store'

export interface ImageViewerProps {
  images: IllustrationImage[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
}

const EASE = [0.22, 1, 0.36, 1]

export default function ImageViewer({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: ImageViewerProps) {
  const currentImage = images[currentIndex] || null
  const total = images.length

  const handlePrev = useCallback(() => {
    if (total <= 1) return
    onNavigate((currentIndex - 1 + total) % total)
  }, [total, currentIndex, onNavigate])

  const handleNext = useCallback(() => {
    if (total <= 1) return
    onNavigate((currentIndex + 1) % total)
  }, [total, currentIndex, onNavigate])

  const setIsModalOpen = useStore((s) => s.setIsModalOpen)

  // Sync global modal open state to prevent menu overlap
  useEffect(() => {
    setIsModalOpen(isOpen)
    return () => {
      setIsModalOpen(false)
    }
  }, [isOpen, setIsModalOpen])

  // Prevent background scrolling while viewer is open
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  // Keyboard navigation: ArrowLeft, ArrowRight, Escape
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, handlePrev, handleNext])

  // Touch swipe gesture handling
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const diffX = Math.abs(e.touches[0].clientX - touchStartX.current)
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (diffX > diffY && diffX > 10) {
      if (e.cancelable) e.preventDefault()
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diffX = touchEndX - touchStartX.current
    const SWIPE_THRESHOLD = 40

    if (diffX > SWIPE_THRESHOLD) {
      handlePrev()
    } else if (diffX < -SWIPE_THRESHOLD) {
      handleNext()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  if (typeof document === 'undefined') return null

  // Check user reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return createPortal(
    <AnimatePresence>
      {isOpen && currentImage && (
        <div
          className="wk-viewer-root"
          role="dialog"
          aria-modal="true"
          aria-label={`Image viewer: ${currentImage.title}`}
        >
          {/* 
            Dark full-viewport cinematic overlay (rgba(0, 0, 0, 0.82) with subtle blur).
            Dims the underlying portfolio, bringing full focus to the artwork.
            Clicking outside the image closes the viewer.
          */}
          <motion.div
            className="wk-viewer-dark-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: EASE }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Close button in the upper-right area */}
          <motion.button
            type="button"
            className="wk-viewer-close-btn"
            onClick={onClose}
            aria-label="Close image viewer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>

          {/* Navigation Arrow: Previous */}
          {total > 1 && (
            <motion.button
              type="button"
              className="wk-viewer-nav-btn wk-viewer-nav-prev"
              onClick={(e) => {
                e.stopPropagation()
                handlePrev()
              }}
              aria-label="Previous image"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </motion.button>
          )}

          {/* Centered Image Presentation */}
          <div
            className="wk-viewer-container"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage.src}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="wk-viewer-media-wrapper"
              >
                <img
                  src={encodeURI(currentImage.src)}
                  alt={currentImage.title}
                  className="wk-viewer-img"
                  draggable={false}
                  loading="eager"
                  onError={() => {
                    reportMissingImage(currentImage.src, currentImage.category || 'Viewer')
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrow: Next */}
          {total > 1 && (
            <motion.button
              type="button"
              className="wk-viewer-nav-btn wk-viewer-nav-next"
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              aria-label="Next image"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </motion.button>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
