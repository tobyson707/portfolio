import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

/**
 * BackToTop — TOBI XP
 * Floating button that smoothly scrolls back to the top of the homepage or About page
 * when the user has scrolled down > 450px.
 *
 * Automatically hides whenever any Works subcategory, project viewer, lightbox,
 * popup, or canvas is open/active.
 */
export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const isAboutOpen = useStore((state) => state.isAboutOpen)
  const isModalOpen = useStore((state) => state.isModalOpen)
  const currentView = useStore((state) => state.currentView)

  const checkScroll = useCallback(() => {
    if (typeof window === 'undefined') return

    // Immediately hide if any modal, lightbox, popup, or subcategory is open
    if (isModalOpen) {
      setIsVisible(false)
      return
    }

    // Additional DOM-level safeguard for any active Works overlays
    const hasActiveOverlay = Boolean(
      document.querySelector('.wk-detail') ||
        document.querySelector('.wk-detail-backdrop') ||
        document.querySelector('.wk-viewer-root') ||
        document.querySelector('.sturvs-canvas-overlay') ||
        document.querySelector('.pdf-viewer-overlay') ||
        document.querySelector('.pdf-popup-root')
    )

    if (hasActiveOverlay) {
      setIsVisible(false)
      return
    }

    let maxScroll = window.scrollY || document.documentElement.scrollTop || 0

    // Check About overlay scroll containers if active
    const aboutWrapper = document.querySelector('.about-overlay-wrapper')
    if (aboutWrapper && aboutWrapper.scrollTop > maxScroll) {
      maxScroll = aboutWrapper.scrollTop
    }

    const aboutCol = document.querySelector('.about-info-col')
    if (aboutCol && aboutCol.scrollTop > maxScroll) {
      maxScroll = aboutCol.scrollTop
    }

    const shouldShow = maxScroll > 450
    setIsVisible((prev) => (prev !== shouldShow ? shouldShow : prev))
  }, [isModalOpen])

  useEffect(() => {
    checkScroll()

    // Capture true to catch scroll events from any nested scrollable container as well as window
    window.addEventListener('scroll', checkScroll, { passive: true, capture: true })
    window.addEventListener('resize', checkScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', checkScroll, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll, isAboutOpen, isModalOpen, currentView])

  const scrollToTop = useCallback(() => {
    if (typeof window === 'undefined') return

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth'

    // 1. Scroll window / document root
    window.scrollTo({ top: 0, left: 0, behavior })

    // 2. Scroll About overlay containers if open
    const aboutWrapper = document.querySelector('.about-overlay-wrapper')
    if (aboutWrapper) {
      aboutWrapper.scrollTo({ top: 0, left: 0, behavior })
    }

    const aboutCol = document.querySelector('.about-info-col')
    if (aboutCol) {
      aboutCol.scrollTo({ top: 0, left: 0, behavior })
    }
  }, [])

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

  return (
    <AnimatePresence>
      {!isModalOpen && isVisible && (
        <motion.div
          className="back-to-top-wrapper"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.92 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.92 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.12 }
              : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
          }
        >
          <button
            type="button"
            className="back-to-top-btn"
            onClick={scrollToTop}
            aria-label="Back to top"
            title="Back to top"
          >
            <svg
              className="back-to-top-icon"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            <span className="back-to-top-label">TOP</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
