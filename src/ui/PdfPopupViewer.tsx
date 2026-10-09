import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as pdfjsLib from 'pdfjs-dist'
import type { BrandProject } from '../data/brandIdentityManifest'
import { SAMPLE_VERIFICATION_PDF } from '../data/brandIdentityManifest'
import { useStore } from '../store'
import { isMobileDevice } from '../utils/device'

// ---------------------------------------------------------------------------
// Configure PDF.js Worker — 100% same-origin, offline-capable, and CSP-compliant
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${cleanBase}pdf.worker.min.mjs`
  } catch (err) {
    console.warn('[PDF] Failed to set worker source:', err)
  }
}

export interface PdfPopupViewerProps {
  project: BrandProject
  isOpen: boolean
  onClose: () => void
}

const EASE = [0.22, 1, 0.36, 1]

interface PageDimensions {
  width: number
  height: number
}

// ---------------------------------------------------------------------------
// Individual PDF Page Item Component
// Uses bounded canvas allocations and active windowing to protect mobile Safari
// from out-of-memory crashes on multi-page, high-resolution PDFs.
// ---------------------------------------------------------------------------
interface PdfPageItemProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  pageNumber: number
  scale: number
  dpr: number
  isMobile: boolean
  isWithinRenderWindow: boolean
  onPageDimensionsLoaded?: (pageNumber: number, dims: PageDimensions) => void
  onPageVisible: (pageNumber: number, intersectionRatio: number) => void
}

const PdfPageItem = React.memo(function PdfPageItem({
  pdfDoc,
  pageNumber,
  scale,
  dpr,
  isMobile,
  isWithinRenderWindow,
  onPageDimensionsLoaded,
  onPageVisible,
}: PdfPageItemProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [baseDimensions, setBaseDimensions] = useState<PageDimensions | null>(null)
  const [isRendered, setIsRendered] = useState<boolean>(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const renderTaskRef = useRef<any>(null)

  // Fetch authentic base viewport dimensions for this page
  useEffect(() => {
    let isCancelled = false
    pdfDoc
      .getPage(pageNumber)
      .then((page) => {
        if (isCancelled) return
        const vp = page.getViewport({ scale: 1.0 })
        const dims: PageDimensions = {
          width: vp.width,
          height: vp.height,
        }
        setBaseDimensions(dims)
        if (onPageDimensionsLoaded) {
          onPageDimensionsLoaded(pageNumber, dims)
        }
      })
      .catch((err) => {
        console.warn(`[PDF] Error fetching dimensions for page ${pageNumber}:`, err)
        setRenderError('Could not read page dimensions.')
      })

    return () => {
      isCancelled = true
    }
  }, [pdfDoc, pageNumber, onPageDimensionsLoaded])

  // Observe visibility for tracking currently visible page indicator
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        onPageVisible(pageNumber, entry.intersectionRatio)
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    )

    visibilityObserver.observe(el)

    return () => {
      visibilityObserver.disconnect()
    }
  }, [pageNumber, onPageVisible])

  // Render or clean up canvas depending on whether page is inside active render window
  useEffect(() => {
    // If outside the active render window, clean up canvas bitmap to immediately reclaim mobile memory
    if (!isWithinRenderWindow || !baseDimensions) {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          // ignore
        }
        renderTaskRef.current = null
      }
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = 0
        canvas.height = 0
      }
      setIsRendered(false)
      return
    }

    let isCancelled = false

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel()
      } catch {
        // ignore
      }
      renderTaskRef.current = null
    }

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber)
        if (isCancelled) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return

        // Compute display dimensions at requested scale
        const displayViewport = page.getViewport({ scale })
        const targetW = Math.max(1, Math.floor(displayViewport.width))
        const targetH = Math.max(1, Math.floor(displayViewport.height))

        // Device-appropriate canvas resolution safeguards:
        // Clamps canvas pixel dimensions so 4K PDF pages (e.g. 4096x2341 in funky-frames.pdf)
        // do not allocate multi-megapixel framebuffers that crash mobile Safari
        const maxCanvasWidth = isMobile ? 1600 : 2800
        const rawRenderWidth = Math.floor(targetW * dpr)
        const renderWidth = Math.min(rawRenderWidth, maxCanvasWidth)
        const renderScaleMultiplier = renderWidth / targetW
        const renderViewport = page.getViewport({ scale: scale * renderScaleMultiplier })

        canvas.width = Math.max(1, Math.floor(renderViewport.width))
        canvas.height = Math.max(1, Math.floor(renderViewport.height))
        canvas.style.width = `${targetW}px`
        canvas.style.height = `${targetH}px`

        const renderContext = {
          canvasContext: ctx,
          viewport: renderViewport,
          canvas: canvas,
        }

        const task = page.render(renderContext)
        renderTaskRef.current = task

        await task.promise
        if (!isCancelled) {
          setIsRendered(true)
          setRenderError(null)
          renderTaskRef.current = null
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !isCancelled) {
          console.warn(`[PDF] Page ${pageNumber} render notice:`, err)
          setRenderError('Page rendering interrupted.')
        }
      }
    }

    renderPage()

    return () => {
      isCancelled = true
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          // ignore
        }
        renderTaskRef.current = null
      }
    }
  }, [pdfDoc, pageNumber, scale, dpr, isMobile, isWithinRenderWindow, baseDimensions])

  // Exact wrapper dimensions calculated directly from authentic PDF viewport at current zoom
  const currentWidth = baseDimensions ? Math.max(1, Math.floor(baseDimensions.width * scale)) : 0
  const currentHeight = baseDimensions ? Math.max(1, Math.floor(baseDimensions.height * scale)) : 0

  return (
    <div
      ref={containerRef}
      className={`pdf-page-card ${isRendered ? 'is-rendered' : 'is-loading'}`}
      data-page-number={pageNumber}
      style={{
        width: currentWidth > 0 ? `${currentWidth}px` : '100%',
        minHeight: currentHeight > 0 ? `${currentHeight}px` : '240px',
      }}
    >
      <canvas
        ref={canvasRef}
        className="pdf-page-canvas"
        style={{
          display: isRendered ? 'block' : 'none',
          width: currentWidth > 0 ? `${currentWidth}px` : 'auto',
          height: currentHeight > 0 ? `${currentHeight}px` : 'auto',
        }}
      />
      {!isRendered && (
        <div
          className="pdf-page-placeholder"
          aria-hidden="true"
          style={{
            width: currentWidth > 0 ? `${currentWidth}px` : '100%',
            height: currentHeight > 0 ? `${currentHeight}px` : '240px',
          }}
        >
          {renderError ? (
            <span className="pdf-page-skeleton-text">{renderError}</span>
          ) : (
            <>
              <div className="pdf-page-skeleton-spinner" />
              <span className="pdf-page-skeleton-text">PAGE {String(pageNumber).padStart(2, '0')}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
})

// ---------------------------------------------------------------------------
// Main Continuous Vertical PDF Viewer Component
// ---------------------------------------------------------------------------
export default function PdfPopupViewer({
  project,
  isOpen,
  onClose,
}: PdfPopupViewerProps) {
  const setIsModalOpen = useStore((s) => s.setIsModalOpen)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [visiblePage, setVisiblePage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activePdfPath, setActivePdfPath] = useState<string>(project.pdfPath)
  const [isUsingSample, setIsUsingSample] = useState<boolean>(false)

  const isMobile = typeof window !== 'undefined' ? isMobileDevice() : false

  // Map of page dimensions
  const pageDimensionsMapRef = useRef<Map<number, PageDimensions>>(new Map())
  const [firstPageDimensions, setFirstPageDimensions] = useState<PageDimensions | null>(null)

  // Track visibility ratios of each page to determine current active page indicator
  const pageRatiosRef = useRef<Map<number, number>>(new Map())

  // Memory-safe device pixel ratio:
  // Mobile capped at 1.25x to ensure sharp vector rendering without exceeding Safari GPU limits
  const dpr = typeof window !== 'undefined' ? (isMobile ? 1.25 : Math.min(window.devicePixelRatio || 1, 2)) : 1

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

  // Reset state when project changes
  useEffect(() => {
    setActivePdfPath(project.pdfPath)
    setIsUsingSample(false)
    setVisiblePage(1)
    setScale(1.0)
    pageDimensionsMapRef.current.clear()
    pageRatiosRef.current.clear()
    setFirstPageDimensions(null)
  }, [project])

  // Track page dimensions as each page loads
  const handlePageDimensionsLoaded = useCallback((pageNumber: number, dims: PageDimensions) => {
    pageDimensionsMapRef.current.set(pageNumber, dims)
    if (pageNumber === 1) {
      setFirstPageDimensions(dims)
    }
  }, [])

  // Auto-fit to width on initial load or orientation change
  const fitWidthToContainer = useCallback((dims?: PageDimensions | null) => {
    const targetDims = dims || firstPageDimensions || pageDimensionsMapRef.current.get(1)
    if (!targetDims) return

    const container = scrollContainerRef.current
    const viewportWidth = container?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800)
    // Horizontal padding inside viewer
    const horizontalPadding = isMobile ? 24 : 64
    const availableWidth = Math.max(280, viewportWidth - horizontalPadding)
    const fitScale = availableWidth / targetDims.width

    // Clamp scale to readable range
    const clampedScale = Math.max(0.2, Math.min(fitScale, isMobile ? 1.2 : 1.5))
    setScale(Number(clampedScale.toFixed(2)))
  }, [firstPageDimensions, isMobile])

  // Load PDF Document with local, same-origin cMap support
  useEffect(() => {
    if (!isOpen || !activePdfPath) return

    let isCancelled = false
    setIsLoading(true)
    setLoadError(null)
    setPdfDoc(null)
    pageDimensionsMapRef.current.clear()
    pageRatiosRef.current.clear()

    const baseUrl = import.meta.env.BASE_URL || '/'
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

    const loadingTask = pdfjsLib.getDocument({
      url: activePdfPath,
      cMapUrl: `${cleanBase}cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${cleanBase}standard_fonts/`,
    })

    loadingTask.promise
      .then(async (doc) => {
        if (isCancelled) return
        setPdfDoc(doc)
        setNumPages(doc.numPages)

        // Read first page to get base dimensions for initial FIT scale
        try {
          const firstPage = await doc.getPage(1)
          const vp = firstPage.getViewport({ scale: 1.0 })
          if (!isCancelled) {
            const dims: PageDimensions = { width: vp.width, height: vp.height }
            pageDimensionsMapRef.current.set(1, dims)
            setFirstPageDimensions(dims)
            fitWidthToContainer(dims)
          }
        } catch {
          // ignore
        }

        setIsLoading(false)
      })
      .catch((err) => {
        if (isCancelled) return
        console.warn('[PDF] Document load error:', err?.message || err)
        setLoadError(
          err?.message ||
            'The PDF case study for this project could not be opened.'
        )
        setIsLoading(false)
      })

    return () => {
      isCancelled = true
      try {
        loadingTask.destroy()
      } catch {
        // ignore
      }
    }
  }, [isOpen, activePdfPath, fitWidthToContainer])

  // Handle window resize or orientation change
  useEffect(() => {
    const handleResize = () => {
      if (firstPageDimensions) {
        fitWidthToContainer(firstPageDimensions)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [firstPageDimensions, fitWidthToContainer])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), isMobile ? 2.0 : 3.0))
  }, [isMobile])

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.25))
  }, [])

  // Page jump navigation (Previous / Next page)
  const scrollToPage = useCallback((targetPage: number) => {
    if (!scrollContainerRef.current) return
    const clampedPage = Math.max(1, Math.min(targetPage, numPages))
    const pageEl = scrollContainerRef.current.querySelector(`[data-page-number="${clampedPage}"]`) as HTMLElement | null
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setVisiblePage(clampedPage)
    }
  }, [numPages])

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

  // Page visibility ratio update to highlight active visible page
  const handlePageVisible = useCallback((pageNumber: number, intersectionRatio: number) => {
    pageRatiosRef.current.set(pageNumber, intersectionRatio)

    let maxRatio = 0
    let bestPage = visiblePage

    pageRatiosRef.current.forEach((ratio, pageNo) => {
      if (ratio > maxRatio) {
        maxRatio = ratio
        bestPage = pageNo
      }
    })

    if (maxRatio > 0.15 && bestPage !== visiblePage) {
      setVisiblePage(bestPage)
    }
  }, [visiblePage])

  if (typeof document === 'undefined') return null

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1)

  // Mobile active rendering window:
  // Renders the visible page + 1 adjacent page on mobile, or 2 on desktop,
  // preventing out-of-memory crashes on 34-page documents
  const renderWindowRadius = isMobile ? 1 : 2

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="wk-viewer-root pdf-popup-root"
          role="dialog"
          aria-modal="true"
          aria-label={`PDF Case Study: ${project.title}`}
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
            aria-label="Close PDF viewer"
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
            className="wk-viewer-container pdf-popup-continuous-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading State */}
            {isLoading && (
              <div className="pdf-popup-loading">
                <div className="pdf-loading-spinner" aria-hidden="true" />
                <p className="pdf-popup-loading-text">LOADING PDF CASE STUDY...</p>
              </div>
            )}

            {/* Error or Missing File Fallback State */}
            {!isLoading && loadError && (
              <motion.div
                className="pdf-popup-fallback-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <div className="pdf-fallback-glyph" aria-hidden="true">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="pdf-fallback-kicker">BRAND IDENTITY CASE STUDY</div>
                <h3 className="pdf-fallback-title">{project.title}</h3>
                <p className="pdf-fallback-desc">
                  {loadError}
                </p>
                <div className="pdf-fallback-actions">
                  <button
                    type="button"
                    className="pdf-fallback-btn sample-btn"
                    onClick={() => {
                      setActivePdfPath(SAMPLE_VERIFICATION_PDF)
                      setIsUsingSample(true)
                    }}
                  >
                    <span>PREVIEW WITH SAMPLE PDF</span>
                    <span aria-hidden="true">→</span>
                  </button>
                  <button
                    type="button"
                    className="pdf-fallback-btn close-btn"
                    onClick={onClose}
                  >
                    RETURN TO LIST
                  </button>
                </div>
              </motion.div>
            )}

            {/* Continuous Vertical Scroll Container with Virtualized Page Canvases */}
            {!isLoading && !loadError && pdfDoc && (
              <div
                ref={scrollContainerRef}
                className="pdf-popup-scroll-viewport"
                tabIndex={0}
                aria-label="Continuous document viewer"
              >
                <div className="pdf-popup-pages-stack">
                  {pageNumbers.map((pageNo) => {
                    const isWithinWindow = Math.abs(pageNo - visiblePage) <= renderWindowRadius
                    return (
                      <PdfPageItem
                        key={`${activePdfPath}-page-${pageNo}`}
                        pdfDoc={pdfDoc}
                        pageNumber={pageNo}
                        scale={scale}
                        dpr={dpr}
                        isMobile={isMobile}
                        isWithinRenderWindow={isWithinWindow}
                        onPageDimensionsLoaded={handlePageDimensionsLoaded}
                        onPageVisible={handlePageVisible}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bottom Minimalist Floating Control Bar */}
            {!isLoading && !loadError && pdfDoc && (
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
                  <span className="pdf-total-page">{String(numPages).padStart(2, '0')}</span>
                </div>

                {/* Next Page Button */}
                <button
                  type="button"
                  className="pdf-popup-tool-btn"
                  onClick={handleNextPage}
                  disabled={visiblePage >= numPages}
                  aria-label="Next Page"
                  title="Next Page (↓)"
                  style={{ opacity: visiblePage >= numPages ? 0.4 : 1 }}
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
                  onClick={() => fitWidthToContainer(firstPageDimensions)}
                  aria-label="Fit to width"
                  title="Fit to Width"
                >
                  FIT
                </button>
              </div>
            )}

            {/* Document Title Caption */}
            <div className="wk-viewer-caption">
              <span className="wk-viewer-title">
                {project.title}
                {isUsingSample ? ' (Sample Preview)' : ''}
              </span>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
