import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { BrandProject, CaseStudyImage } from '../data/brandIdentityManifest'
import { useStore } from '../store'
import { isMobileDevice } from '../utils/device'

export interface CaseStudyViewerProps {
  project: BrandProject
  isOpen: boolean
  onClose: () => void
}

const EASE = [0.22, 1, 0.36, 1]

interface ImageCardProps {
  image: CaseStudyImage
  index: number
  scale: number
  isMobile: boolean
  onVisible: (pageNumber: number, ratio: number) => void
}

const CaseStudyImageCard = React.memo(function CaseStudyImageCard({
  image,
  index,
  scale,
  isMobile,
  onVisible,
}: ImageCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Intersection observer to track current active page indicator
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        onVisible(image.pageNumber, entry.intersectionRatio)
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [image.pageNumber, onVisible])

  // Safely encode URI for paths containing spaces (e.g. "funky frames webp")
  const encodedSrc = encodeURI(image.src)

  return (
    <div
      ref={containerRef}
      data-page-number={image.pageNumber}
      className="case-study-page-card pdf-page-card"
      style={{
        width: `${scale * 100}%`,
        maxWidth: isMobile ? '100%' : '1400px',
        transition: 'width 0.15s ease-out',
      }}
    >
      {/* Skeleton placeholder while loading image */}
      {!isLoaded && !hasError && (
        <div className="pdf-page-placeholder case-study-page-placeholder" aria-hidden="true">
          <div className="pdf-page-skeleton-spinner" />
          <span className="pdf-page-skeleton-text">
            PAGE {String(image.pageNumber).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Error state if an image fails to load */}
      {hasError && (
        <div className="case-study-image-error">
          <span>Failed to load page {image.pageNumber}</span>
        </div>
      )}

      <img
        src={encodedSrc}
        alt={image.alt}
        loading={index < 2 ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className={`case-study-image ${isLoaded ? 'is-loaded' : 'is-loading'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  )
})

export default function CaseStudyViewer({
  project,
  isOpen,
  onClose,
}: CaseStudyViewerProps) {
  const setIsModalOpen = useStore((s) => s.setIsModalOpen)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [visiblePage, setVisiblePage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)

  const isMobile = typeof window !== 'undefined' ? isMobileDevice() : false
  const images = project.images || []
  const totalPages = images.length

  // Track visibility ratios of each image card to compute active page number
  const pageRatiosRef = useRef<Map<number, number>>(new Map())

  // Synchronize modal state & body scroll lock
  useEffect(() => {
    if (!isOpen) return
    setIsModalOpen(true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      setIsModalOpen(false)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, setIsModalOpen])

  // Reset page indicator and zoom when project changes or reopens
  useEffect(() => {
    setVisiblePage(1)
    setScale(1.0)
    pageRatiosRef.current.clear()
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [project, isOpen])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), isMobile ? 1.6 : 2.0))
  }, [isMobile])

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.5))
  }, [])

  const handleFitWidth = useCallback(() => {
    setScale(1.0)
  }, [])

  // Page jump navigation (Previous / Next page)
  const scrollToPage = useCallback((targetPage: number) => {
    if (!scrollContainerRef.current) return
    const clampedPage = Math.max(1, Math.min(targetPage, totalPages))
    const pageEl = scrollContainerRef.current.querySelector(
      `[data-page-number="${clampedPage}"]`
    ) as HTMLElement | null

    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setVisiblePage(clampedPage)
    }
  }, [totalPages])

  const handlePrevPage = useCallback(() => {
    scrollToPage(visiblePage - 1)
  }, [scrollToPage, visiblePage])

  const handleNextPage = useCallback(() => {
    scrollToPage(visiblePage + 1)
  }, [scrollToPage, visiblePage])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        handleNextPage()
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        handlePrevPage()
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn()
      } else if (e.key === '-') {
        handleZoomOut()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleNextPage, handlePrevPage, handleZoomIn, handleZoomOut])

  // Active visible page determination via intersection ratios
  const handlePageVisible = useCallback((pageNumber: number, ratio: number) => {
    pageRatiosRef.current.set(pageNumber, ratio)

    let maxRatio = 0
    let bestPage = visiblePage

    pageRatiosRef.current.forEach((r, pageNo) => {
      if (r > maxRatio) {
        maxRatio = r
        bestPage = pageNo
      }
    })

    if (maxRatio > 0.15 && bestPage !== visiblePage) {
      setVisiblePage(bestPage)
    }
  }, [visiblePage])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="wk-viewer-root pdf-popup-root case-study-viewer-root"
          role="dialog"
          aria-modal="true"
          aria-label={`Case Study: ${project.title}`}
        >
          {/* Dark Semi-transparent Cinematic Overlay */}
          <motion.div
            className="wk-viewer-dark-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Close Button in Upper-Right Corner */}
          <motion.button
            type="button"
            className="wk-viewer-close-btn"
            onClick={onClose}
            aria-label="Close viewer"
            title="Close (Esc)"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
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

          {/* Main Continuous Vertical Container */}
          <div
            className="wk-viewer-container pdf-popup-continuous-container case-study-continuous-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Continuous Vertical Scroll Viewport */}
            <div
              ref={scrollContainerRef}
              className="pdf-popup-scroll-viewport case-study-scroll-viewport"
              tabIndex={0}
              aria-label="Continuous document viewer"
            >
              <div className="pdf-popup-pages-stack case-study-pages-stack">
                {images.map((img, idx) => (
                  <CaseStudyImageCard
                    key={`${project.id}-${img.src}`}
                    image={img}
                    index={idx}
                    scale={scale}
                    isMobile={isMobile}
                    onVisible={handlePageVisible}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Minimalist Floating Control Bar */}
            {totalPages > 0 && (
              <div className="pdf-popup-controls-row">
                {/* Previous Page Button */}
                <button
                  type="button"
                  className="pdf-popup-tool-btn"
                  onClick={handlePrevPage}
                  disabled={visiblePage <= 1}
                  aria-label="Previous Page"
                  title="Previous Page (↑)"
                  style={{ opacity: visiblePage <= 1 ? 0.4 : 1 }}
                >
                  ‹
                </button>

                {/* Dynamic Page Indicator */}
                <div className="pdf-popup-page-indicator" title="Current visible page">
                  <span className="pdf-curr-page">{String(visiblePage).padStart(2, '0')}</span>
                  <span className="pdf-slash">/</span>
                  <span className="pdf-total-page">{String(totalPages).padStart(2, '0')}</span>
                </div>

                {/* Next Page Button */}
                <button
                  type="button"
                  className="pdf-popup-tool-btn"
                  onClick={handleNextPage}
                  disabled={visiblePage >= totalPages}
                  aria-label="Next Page"
                  title="Next Page (↓)"
                  style={{ opacity: visiblePage >= totalPages ? 0.4 : 1 }}
                >
                  ›
                </button>

                {/* Subtle Divider */}
                <span className="pdf-popup-ctrl-divider" aria-hidden="true" />

                {/* Zoom Controls */}
                <button
                  type="button"
                  className="pdf-popup-tool-btn"
                  onClick={handleZoomOut}
                  aria-label="Zoom Out"
                  title="Zoom Out (−)"
                >
                  −
                </button>
                <span className="pdf-popup-zoom-text">{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  className="pdf-popup-tool-btn"
                  onClick={handleZoomIn}
                  aria-label="Zoom In"
                  title="Zoom In (+)"
                >
                  +
                </button>

                {/* Fit to Width Button */}
                <button
                  type="button"
                  className="pdf-popup-tool-btn fit-btn"
                  onClick={handleFitWidth}
                  aria-label="Fit to width"
                  title="Fit to Width"
                >
                  FIT
                </button>
              </div>
            )}

            {/* Document Title Caption */}
            <div className="wk-viewer-caption">
              <span className="wk-viewer-title">{project.title}</span>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
