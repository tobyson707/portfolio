import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as pdfjsLib from 'pdfjs-dist'
import type { BrandCaseStudy } from '../data/brandIdentityManifest'
import { useStore } from '../store'

// Configure PDF.js Worker
if (typeof window !== 'undefined') {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${cleanBase}pdf.worker.min.mjs`
  } catch {
    // fallback
  }
}

export interface PdfCaseStudyViewerProps {
  caseStudy: BrandCaseStudy
  isOpen: boolean
  onClose: () => void
}

type ViewMode = 'single' | 'continuous'

export default function PdfCaseStudyViewer({
  caseStudy,
  isOpen,
  onClose,
}: PdfCaseStudyViewerProps) {
  const setIsModalOpen = useStore((s) => s.setIsModalOpen)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [viewMode, setViewMode] = useState<ViewMode>('continuous')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [, setPageRendering] = useState<boolean>(false)

  // Canvas refs for pages
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const activeRenderTasks = useRef<Map<number, any>>(new Map())

  // Synchronize global modal state to dismiss global navigation and lock scroll
  useEffect(() => {
    if (isOpen) {
      setIsModalOpen(true)
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'

      const handlePopState = () => {
        onClose()
      }
      window.addEventListener('popstate', handlePopState)

      return () => {
        setIsModalOpen(false)
        document.body.style.overflow = prevOverflow
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [isOpen, onClose, setIsModalOpen])

  // Load PDF Document
  useEffect(() => {
    if (!isOpen || !caseStudy.pdfPath) return

    let isCancelled = false
    setIsLoading(true)
    setLoadError(null)
    setPdfDoc(null)
    setCurrentPage(1)

    const loadingTask = pdfjsLib.getDocument({
      url: caseStudy.pdfPath,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/cmaps/`,
      cMapPacked: true,
    })

    loadingTask.promise
      .then((doc) => {
        if (isCancelled) return
        setPdfDoc(doc)
        setNumPages(doc.numPages)
        setIsLoading(false)
      })
      .catch((err) => {
        if (isCancelled) return
        console.error('Failed to load PDF document:', err)
        setLoadError(
          err?.message ||
            'Unable to load the case study document. Please ensure the file path is accessible.'
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
  }, [isOpen, caseStudy.pdfPath])

  // Render a specific page onto its corresponding canvas with high-DPI scaling
  const renderPage = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement) => {
      if (!pdfDoc) return

      // Cancel any ongoing render task for this page
      if (activeRenderTasks.current.has(pageNum)) {
        try {
          activeRenderTasks.current.get(pageNum).cancel()
        } catch {
          // ignore
        }
        activeRenderTasks.current.delete(pageNum)
      }

      try {
        setPageRendering(true)
        const page = await pdfDoc.getPage(pageNum)
        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return

        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
        const standardViewport = page.getViewport({ scale })

        // Container-aware auto-scaling calculation if in 'fit-width'
        const baseWidth = standardViewport.width
        const baseHeight = standardViewport.height

        canvas.width = Math.floor(baseWidth * dpr)
        canvas.height = Math.floor(baseHeight * dpr)
        canvas.style.width = `${Math.floor(baseWidth)}px`
        canvas.style.height = `${Math.floor(baseHeight)}px`

        const renderContext = {
          canvasContext: ctx,
          viewport: page.getViewport({ scale: scale * dpr }),
          canvas: canvas,
        }

        const renderTask = page.render(renderContext)
        activeRenderTasks.current.set(pageNum, renderTask)

        await renderTask.promise
        activeRenderTasks.current.delete(pageNum)
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`PDF page ${pageNum} render error:`, err)
        }
      } finally {
        setPageRendering(false)
      }
    },
    [pdfDoc, scale]
  )

  // Re-render pages when doc, page, viewMode, or scale changes
  useEffect(() => {
    if (!pdfDoc || isLoading) return

    if (viewMode === 'single') {
      const canvas = canvasRefs.current.get(currentPage)
      if (canvas) {
        renderPage(currentPage, canvas)
      }
    } else {
      // Continuous mode: render all pages
      for (let p = 1; p <= numPages; p++) {
        const canvas = canvasRefs.current.get(p)
        if (canvas) {
          renderPage(p, canvas)
        }
      }
    }
  }, [pdfDoc, currentPage, viewMode, scale, numPages, isLoading, renderPage])

  // Fit to viewport width helper
  const handleFitToWidth = useCallback(() => {
    if (!pdfDoc || !containerRef.current) return
    pdfDoc.getPage(1).then((page) => {
      const containerW = containerRef.current?.clientWidth || 900
      const availableW = Math.max(320, containerW - 48)
      const baseVp = page.getViewport({ scale: 1.0 })
      const optimalScale = Math.min(2.5, Math.max(0.5, availableW / baseVp.width))
      setScale(parseFloat(optimalScale.toFixed(2)))
    })
  }, [pdfDoc])

  // Initial optimal fit calculation on first load
  useEffect(() => {
    if (pdfDoc && !isLoading) {
      handleFitToWidth()
    }
  }, [pdfDoc, isLoading, handleFitToWidth])

  // Navigation handlers
  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => {
      const prev = Math.max(1, p - 1)
      if (viewMode === 'continuous') {
        const targetCanvas = canvasRefs.current.get(prev)
        targetCanvas?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return prev
    })
  }, [viewMode])

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => {
      const next = Math.min(numPages, p + 1)
      if (viewMode === 'continuous') {
        const targetCanvas = canvasRefs.current.get(next)
        targetCanvas?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return next
    })
  }, [numPages, viewMode])

  const handleZoomIn = useCallback(() => {
    setScale((s) => Math.min(3.0, parseFloat((s + 0.15).toFixed(2))))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((s) => Math.max(0.4, parseFloat((s - 0.15).toFixed(2))))
  }, [])

  const handleResetZoom = useCallback(() => {
    setScale(1.0)
  }, [])

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault()
        handlePrevPage()
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'j') {
        e.preventDefault()
        handleNextPage()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        handleZoomIn()
      } else if (e.key === '-') {
        e.preventDefault()
        handleZoomOut()
      } else if (e.key === '0') {
        e.preventDefault()
        handleResetZoom()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handlePrevPage, handleNextPage, handleZoomIn, handleZoomOut, handleResetZoom])

  // Track active page while scrolling in continuous mode
  const handleScroll = () => {
    if (viewMode !== 'continuous' || !containerRef.current) return
    const containerTop = containerRef.current.getBoundingClientRect().top
    for (let p = 1; p <= numPages; p++) {
      const canvas = canvasRefs.current.get(p)
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        if (rect.top - containerTop <= 150 && rect.bottom - containerTop > 100) {
          setCurrentPage(p)
          break
        }
      }
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="pdf-viewer-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`PDF Case Study: ${caseStudy.title}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Top Floating App Bar */}
        <header className="pdf-viewer-header">
          <div className="pdf-header-meta">
            <div className="pdf-header-kicker">
              <span>CASE STUDY</span>
              <span className="pdf-header-dot">·</span>
              <span>{caseStudy.category || 'BRAND IDENTITY'}</span>
            </div>
            <h3 className="pdf-header-title">{caseStudy.title}</h3>
            {caseStudy.client && (
              <p className="pdf-header-client">
                {caseStudy.client} {caseStudy.year ? `(${caseStudy.year})` : ''}
              </p>
            )}
          </div>

          {/* Close Action */}
          <div className="pdf-header-actions">
            <button
              type="button"
              className="pdf-close-btn"
              onClick={onClose}
              aria-label="Close Case Study"
              title="Close Case Study (Esc)"
            >
              <span className="pdf-close-icon" aria-hidden="true">
                ✕
              </span>
              <span className="pdf-close-label">CLOSE</span>
            </button>
          </div>
        </header>

        {/* PDF Document Canvas Viewport */}
        <main
          ref={containerRef}
          className="pdf-viewport"
          onScroll={handleScroll}
          tabIndex={0}
        >
          {isLoading && (
            <div className="pdf-state-container">
              <div className="pdf-loading-spinner" aria-hidden="true" />
              <p className="pdf-state-text">INITIALIZING VECTOR CASE STUDY...</p>
              <span className="pdf-state-sub">Rendering high-resolution document pages</span>
            </div>
          )}

          {loadError && (
            <div className="pdf-state-container pdf-error-state">
              <div className="pdf-error-icon">!</div>
              <h4 className="pdf-error-heading">DOCUMENT UNAVAILABLE</h4>
              <p className="pdf-error-desc">{loadError}</p>
              <button
                type="button"
                className="pdf-btn-retry"
                onClick={onClose}
              >
                RETURN TO PROJECT LISTING
              </button>
            </div>
          )}

          {!isLoading && !loadError && pdfDoc && (
            <div className={`pdf-pages-track mode-${viewMode}`}>
              {viewMode === 'single' ? (
                <div className="pdf-page-card single-page">
                  <canvas
                    ref={(el) => {
                      if (el) canvasRefs.current.set(currentPage, el)
                      else canvasRefs.current.delete(currentPage)
                    }}
                    className="pdf-canvas"
                  />
                  <div className="pdf-page-number-cue">
                    Page {currentPage} of {numPages}
                  </div>
                </div>
              ) : (
                Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div key={pageNum} className="pdf-page-card continuous-page" id={`pdf-page-${pageNum}`}>
                    <canvas
                      ref={(el) => {
                        if (el) canvasRefs.current.set(pageNum, el)
                        else canvasRefs.current.delete(pageNum)
                      }}
                      className="pdf-canvas"
                    />
                    <div className="pdf-page-footer-tag">
                      <span>PAGE {String(pageNum).padStart(2, '0')} / {String(numPages).padStart(2, '0')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>

        {/* Bottom Floating Minimalist Toolbar */}
        {!isLoading && !loadError && numPages > 0 && (
          <nav className="pdf-floating-toolbar" aria-label="PDF Document Controls">
            {/* Page Navigation */}
            <div className="pdf-tool-group">
              <button
                type="button"
                className="pdf-btn-tool"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                aria-label="Previous Page"
                title="Previous Page (Left Arrow)"
              >
                ‹
              </button>

              <span className="pdf-page-counter">
                <span className="pdf-page-curr">{String(currentPage).padStart(2, '0')}</span>
                <span className="pdf-page-slash">/</span>
                <span className="pdf-page-total">{String(numPages).padStart(2, '0')}</span>
              </span>

              <button
                type="button"
                className="pdf-btn-tool"
                onClick={handleNextPage}
                disabled={currentPage >= numPages}
                aria-label="Next Page"
                title="Next Page (Right Arrow)"
              >
                ›
              </button>
            </div>

            <span className="pdf-toolbar-divider" aria-hidden="true" />

            {/* Zoom Controls */}
            <div className="pdf-tool-group">
              <button
                type="button"
                className="pdf-btn-tool"
                onClick={handleZoomOut}
                aria-label="Zoom Out"
                title="Zoom Out (−)"
              >
                −
              </button>

              <span className="pdf-zoom-badge" onClick={handleResetZoom} title="Reset to 100%">
                {Math.round(scale * 100)}%
              </span>

              <button
                type="button"
                className="pdf-btn-tool"
                onClick={handleZoomIn}
                aria-label="Zoom In"
                title="Zoom In (+)"
              >
                +
              </button>
            </div>

            <span className="pdf-toolbar-divider" aria-hidden="true" />

            {/* Layout Mode & Fit Action */}
            <div className="pdf-tool-group">
              <button
                type="button"
                className="pdf-btn-tool fit-btn"
                onClick={handleFitToWidth}
                aria-label="Fit to Width"
                title="Fit to Width"
              >
                FIT
              </button>

              <button
                type="button"
                className={`pdf-btn-tool mode-btn ${viewMode === 'single' ? 'is-active' : ''}`}
                onClick={() => setViewMode((m) => (m === 'single' ? 'continuous' : 'single'))}
                aria-label={viewMode === 'single' ? 'Switch to Continuous Scroll' : 'Switch to Single Page'}
                title={viewMode === 'single' ? 'Continuous Scroll' : 'Single Page Mode'}
              >
                {viewMode === 'single' ? '1-PAGE' : 'SCROLL'}
              </button>
            </div>
          </nav>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
