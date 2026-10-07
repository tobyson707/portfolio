import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import * as pdfjsLib from 'pdfjs-dist'
import type { BrandProject } from '../data/brandIdentityManifest'
import { SAMPLE_VERIFICATION_PDF } from '../data/brandIdentityManifest'
import { useStore } from '../store'

// Configure PDF.js Worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`
  } catch {
    // fallback
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
// Tightly wraps the canvas with exact dimensions from PDF.js page viewport.
// ---------------------------------------------------------------------------
interface PdfPageItemProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  pageNumber: number
  scale: number
  dpr: number
  onPageDimensionsLoaded?: (pageNumber: number, dims: PageDimensions) => void
  onPageVisible: (pageNumber: number, intersectionRatio: number) => void
}

const PdfPageItem = React.memo(function PdfPageItem({
  pdfDoc,
  pageNumber,
  scale,
  dpr,
  onPageDimensionsLoaded,
  onPageVisible,
}: PdfPageItemProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [baseDimensions, setBaseDimensions] = useState<PageDimensions | null>(null)
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false)
  const [isRendered, setIsRendered] = useState<boolean>(false)
  const renderTaskRef = useRef<any>(null)

  // Fetch each page's own authentic base viewport dimensions
  useEffect(() => {
    let isCancelled = false
    pdfDoc.getPage(pageNumber).then((page) => {
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
    }).catch((err) => {
      console.warn(`Error fetching dimensions for page ${pageNumber}:`, err)
    })

    return () => {
      isCancelled = true
    }
  }, [pdfDoc, pageNumber, onPageDimensionsLoaded])

  // Observe intersection for lazy rendering and page tracking
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const lazyObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          setIsIntersecting(true)
        }
      },
      {
        rootMargin: '400px 0px 400px 0px',
        threshold: 0.01,
      }
    )

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        onPageVisible(pageNumber, entry.intersectionRatio)
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    )

    lazyObserver.observe(el)
    visibilityObserver.observe(el)

    return () => {
      lazyObserver.disconnect()
      visibilityObserver.disconnect()
    }
  }, [pageNumber, onPageVisible])

  // Render authentic PDF page to canvas matching viewport dimensions exactly
  useEffect(() => {
    if (!isIntersecting || !baseDimensions) return

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

        // Compute exact viewport for display and for high-DPI rendering
        const displayViewport = page.getViewport({ scale })
        const renderViewport = page.getViewport({ scale: scale * dpr })

        const targetW = Math.floor(displayViewport.width)
        const targetH = Math.floor(displayViewport.height)

        canvas.width = Math.floor(renderViewport.width)
        canvas.height = Math.floor(renderViewport.height)
        canvas.style.width = `${targetW}px`
        canvas.style.height = `${targetH}px`

        const renderContext = {
          canvasContext: ctx,
          viewport: renderViewport,
        }

        const task = page.render(renderContext)
        renderTaskRef.current = task

        await task.promise
        if (!isCancelled) {
          setIsRendered(true)
          renderTaskRef.current = null
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`Page ${pageNumber} render notice:`, err)
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
  }, [pdfDoc, pageNumber, scale, dpr, isIntersecting, baseDimensions])

  // Exact wrapper dimensions calculated directly from PDF viewport at current zoom
  const currentWidth = baseDimensions ? Math.floor(baseDimensions.width * scale) : 0
  const currentHeight = baseDimensions ? Math.floor(baseDimensions.height * scale) : 0

  return (
    <div
      ref={containerRef}
      className={`pdf-page-card ${isRendered ? 'is-rendered' : 'is-loading'}`}
      data-page-number={pageNumber}
      style={{
        width: currentWidth > 0 ? `${currentWidth}px` : '100%',
        height: currentHeight > 0 ? `${currentHeight}px` : 'auto',
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
      {!isRendered && currentHeight > 0 && (
        <div
          className="pdf-page-placeholder"
          aria-hidden="true"
          style={{ width: `${currentWidth}px`, height: `${currentHeight}px` }}
        >
          <div className="pdf-page-skeleton-spinner" />
          <span className="pdf-page-skeleton-text">PAGE {String(pageNumber).padStart(2, '0')}</span>
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

  // Map of page dimensions
  const pageDimensionsMapRef = useRef<Map<number, PageDimensions>>(new Map())
  const [firstPageDimensions, setFirstPageDimensions] = useState<PageDimensions | null>(null)

  // Track visibility ratios of each page to determine current active page indicator
  const pageRatiosRef = useRef<Map<number, number>>(new Map())

  // Device pixel ratio for crisp rendering
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

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

  // Load PDF Document
  useEffect(() => {
    if (!isOpen || !activePdfPath) return

    let isCancelled = false
    setIsLoading(true)
    setLoadError(null)
    setPdfDoc(null)
    pageDimensionsMapRef.current.clear()
    pageRatiosRef.current.clear()

    const loadingTask = pdfjsLib.getDocument({
      url: activePdfPath,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/cmaps/`,
      cMapPacked: true,
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
          }
        } catch {
          // ignore
        }

        setIsLoading(false)
      })
      .catch((err) => {
        if (isCancelled) return
        console.warn('PDF load notice:', err?.message || err)
        setLoadError(
          err?.message ||
            'The PDF case study for this project has not yet been uploaded.'
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
  }, [isOpen, activePdfPath])

  // Fit to Width Handler — calculates optimal scale from authentic PDF page dimensions
  const handleFitToWidth = useCallback(() => {
    const container = scrollContainerRef.current
    const viewportWidth = container ? container.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200)

    const horizontalPadding = typeof window !== 'undefined' && window.innerWidth < 640 ? 24 : 64
    const availableWidth = Math.max(300, Math.min(viewportWidth - horizontalPadding, 1100))

    const referenceWidth = firstPageDimensions ? firstPageDimensions.width : 800
    const calculatedScale = availableWidth / referenceWidth
    const clampedScale = parseFloat(Math.max(0.25, Math.min(2.5, calculatedScale)).toFixed(2))
    setScale(clampedScale)
  }, [firstPageDimensions])

  // Auto-fit on initial document load
  useEffect(() => {
    if (firstPageDimensions && !isLoading) {
      handleFitToWidth()
    }
  }, [firstPageDimensions, isLoading, handleFitToWidth])

  // Zoom In / Out Handlers
  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(2.5, parseFloat((s + 0.15).toFixed(2))))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(0.25, parseFloat((s - 0.15).toFixed(2))))
  }, [])

  // Callback when a page's intersection ratio changes to update active page number
  const handlePageVisible = useCallback((pageNumber: number, ratio: number) => {
    pageRatiosRef.current.set(pageNumber, ratio)

    let bestPage = 1
    let maxRatio = -1

    pageRatiosRef.current.forEach((r, p) => {
      if (r > maxRatio && r > 0.05) {
        maxRatio = r
        bestPage = p
      }
    })

    if (maxRatio > 0.05) {
      setVisiblePage(bestPage)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        handleZoomIn()
      } else if (e.key === '-') {
        e.preventDefault()
        handleZoomOut()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleZoomIn, handleZoomOut])

  if (typeof document === 'undefined') return null

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1)

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

            {/* Unavailable / File Waiting State */}
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
                  {project.description}
                </p>
                <p className="pdf-fallback-note">
                  PDF document ({project.pdfPath.split('/').pop()}) will be available as soon as it is uploaded to the portfolio.
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
                    <span>PREVIEW VIEWER WITH SAMPLE PDF</span>
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

            {/* Continuous Vertical Scroll Container Rendering All Pages Stacked Vertically */}
            {!isLoading && !loadError && pdfDoc && (
              <div
                ref={scrollContainerRef}
                className="pdf-popup-scroll-viewport"
                tabIndex={0}
                aria-label="Continuous document viewer"
              >
                <div className="pdf-popup-pages-stack">
                  {pageNumbers.map((pageNo) => (
                    <PdfPageItem
                      key={`${activePdfPath}-page-${pageNo}`}
                      pdfDoc={pdfDoc}
                      pageNumber={pageNo}
                      scale={scale}
                      dpr={dpr}
                      onPageDimensionsLoaded={handlePageDimensionsLoaded}
                      onPageVisible={handlePageVisible}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Minimalist Floating Control Bar */}
            {!isLoading && !loadError && pdfDoc && (
              <div className="pdf-popup-controls-row">
                {/* Dynamic Page Indicator updating on vertical scroll */}
                <div className="pdf-popup-page-indicator" title="Current visible page">
                  <span className="pdf-curr-page">{String(visiblePage).padStart(2, '0')}</span>
                  <span className="pdf-slash">/</span>
                  <span className="pdf-total-page">{String(numPages).padStart(2, '0')}</span>
                </div>

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
                  onClick={handleFitToWidth}
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
