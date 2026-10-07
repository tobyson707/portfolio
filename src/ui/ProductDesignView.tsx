import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PRODUCT_CATALOGUE_PROJECTS,
  type ProductDesignProject,
  type ProductDesignMediaItem,
} from '../data/productDesignManifest'
import { useStore } from '../store'

const EASE = [0.22, 1, 0.36, 1]

export interface ProductDesignViewProps {
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Seamless Looping Case Study Video Component
// Behaves like high-quality looping GIF, optimized MP4, no browser UI controls
// ---------------------------------------------------------------------------
interface CaseStudyVideoProps {
  src: string
  poster?: string
}

function CaseStudyVideo({ src, poster }: CaseStudyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.loop = true

    const tryPlay = () => {
      const p = video.play()
      if (p !== undefined) {
        p.catch(() => {
          // Autoplay fallback (silent)
        })
      }
    }

    tryPlay()

    video.addEventListener('loadedmetadata', tryPlay)
    video.addEventListener('canplay', tryPlay)

    // Pause when scrolled far out of view, resume seamlessly when entering viewport
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          tryPlay()
        } else {
          video.pause()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(video)

    return () => {
      video.removeEventListener('loadedmetadata', tryPlay)
      video.removeEventListener('canplay', tryPlay)
      observer.disconnect()
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      controls={false}
      preload="metadata"
      className="product-screen-video"
    />
  )
}

// ---------------------------------------------------------------------------
// Project Detail View Overlay Component
// Left column = Fixed project information
// Right column = Independently scrollable visual case study (Media only, NO text)
// ---------------------------------------------------------------------------
interface ProjectDetailModalProps {
  project: ProductDesignProject
  onClose: () => void
}

function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  // ESC key handler for detail modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const mediaList: ProductDesignMediaItem[] =
    project.media && project.media.length > 0
      ? project.media
      : (project.images || []).map((img) => ({
          id: img.id,
          type: 'image',
          src: (img as any).image || img.src,
        }))

  return (
    <div
      className="product-detail-modal-root"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      {/* Dark backdrop overlay */}
      <motion.div
        className="product-detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      {/* Main Two-Column Full-Screen Project Detail Container */}
      <motion.div
        className="product-detail-wrapper"
        initial={{ opacity: 0, scale: 0.985, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 8 }}
        transition={{ duration: 0.38, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button in Upper-Right Corner */}
        <button
          type="button"
          className="product-detail-close-btn"
          onClick={onClose}
          aria-label="Close project view"
          title="Back to Catalogue (Esc)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="product-detail-content-layout">
          {/* ======================================================== */}
          {/* LEFT COLUMN — FIXED INFORMATION                          */}
          {/* ======================================================== */}
          <aside className="product-detail-info-pane">
            <div className="product-info-kicker">PRODUCT DESIGN · CASE STUDY</div>

            <h2 id="product-modal-title" className="product-info-title">
              {project.title}
            </h2>

            {project.year && (
              <div className="product-info-year-badge">
                <span>{project.year}</span>
              </div>
            )}

            <p className="product-info-desc">{project.description}</p>

            <div className="product-info-meta-group">
              {/* Client */}
              <div className="product-meta-row">
                <span className="product-meta-label">CLIENT</span>
                <span className="product-meta-value">{project.client}</span>
              </div>

              {/* Role */}
              <div className="product-meta-row">
                <span className="product-meta-label">ROLE</span>
                <span className="product-meta-value">{project.role}</span>
              </div>
            </div>

            {/* Optional Website Link ONLY for TOBI XP */}
            {project.websiteUrl && (
              <div className="product-info-action-row">
                <a
                  href={project.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-visit-site-btn"
                  aria-label={`Visit ${project.title} live website in new tab`}
                >
                  <span>VISIT WEBSITE</span>
                  <span className="product-visit-arrow" aria-hidden="true">→</span>
                </a>
              </div>
            )}
          </aside>

          {/* ======================================================== */}
          {/* RIGHT COLUMN — INDEPENDENTLY SCROLLABLE MEDIA ONLY       */}
          {/* (NO TEXT, NO HEADERS, NO CAPTIONS, NO OVERLAYS)         */}
          {/* ======================================================== */}
          <main className="product-detail-visual-pane">
            <div className="product-screens-scroll-flow">
              {mediaList.map((media) => {
                const isVideo = media.type === 'video'

                return (
                  <div
                    key={media.id}
                    className={`product-screen-figure ${isVideo ? 'is-video-figure' : ''}`}
                  >
                    {isVideo ? (
                      <CaseStudyVideo
                        src={media.src}
                        poster={media.poster}
                      />
                    ) : (
                      <img
                        src={media.src}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        className="product-screen-img"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      </motion.div>
    </div>
  )
}

// -----------------------------------------------------------
// Main Product Design Catalogue Component
// Displays visual project cards for the 4 core projects
// -----------------------------------------------------------
export default function ProductDesignView({ onClose }: ProductDesignViewProps) {
  const [selectedProject, setSelectedProject] = useState<ProductDesignProject | null>(null)
  const setIsModalOpen = useStore((s) => s.setIsModalOpen)

  // Sync global modal state, body scroll lock, and category audio state
  useEffect(() => {
    setIsModalOpen(true)
    useStore.getState().setSelectedCategory('PRODUCT DESIGN')
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      setIsModalOpen(false)
      document.body.style.overflow = prevOverflow
    }
  }, [setIsModalOpen])

  // Top level Escape listener when detail modal is not open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !selectedProject) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, selectedProject])

  return (
    <>
      <motion.div
        className="wk-detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      <motion.div
        className="wk-detail product-catalogue-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-design-catalogue-title"
        initial={{ opacity: 0, scale: 0.985, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 6 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <button
          type="button"
          className="wk-detail-close"
          onClick={onClose}
          aria-label="Back to Works"
          title="Back to Works (Esc)"
        >
          ✕
        </button>

        <article className="wk-detail-article">
          {/* Header */}
          <header className="wk-detail-head">
            <div className="branding-head-kicker">DESIGNS · 02</div>
            <h3 id="product-design-catalogue-title" className="wk-detail-title">
              Product Design
            </h3>
            <p className="branding-head-desc">
              Digital products, design engineering architectures, and interactive simulation interfaces.
            </p>
          </header>

          {/* Product Catalogue Grid (4 curated visual project exhibits) */}
          <div className="product-catalogue-grid">
            {PRODUCT_CATALOGUE_PROJECTS.map((project) => (
              <button
                key={project.id}
                type="button"
                className="product-catalogue-card"
                onClick={() => setSelectedProject(project)}
                aria-label={`Open ${project.title} case study`}
              >
                {/* Visual Thumbnail Frame */}
                <div className="product-catalogue-thumb-wrap">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    loading="lazy"
                    draggable={false}
                    className="product-catalogue-thumb-img"
                  />
                  <div className="product-catalogue-thumb-scrim">
                    <span className="product-catalogue-explore-pill">
                      <span>VIEW CASE STUDY</span>
                      <span className="explore-arrow" aria-hidden="true">↗</span>
                    </span>
                  </div>
                </div>

                {/* Card Information */}
                <div className="product-catalogue-info">
                  <div className="product-catalogue-top-row">
                    <span className="product-catalogue-year">{project.year}</span>
                    <span className="product-catalogue-role">{project.role}</span>
                  </div>
                  <h4 className="product-catalogue-card-title">{project.title}</h4>
                  <p className="product-catalogue-card-desc">{project.subtitle || project.description}</p>
                </div>
              </button>
            ))}
          </div>
        </article>
      </motion.div>

      {/* Full-Screen Project Detail Overlay */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
