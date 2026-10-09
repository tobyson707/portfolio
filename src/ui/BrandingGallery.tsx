import React, { useState, useEffect, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { BRAND_PROJECTS, type BrandProject } from '../data/brandIdentityManifest'
import { useStore } from '../store'

const PdfPopupViewer = lazy(() => import('./PdfPopupViewer'))

const EASE = [0.22, 1, 0.36, 1]

export interface BrandingGalleryProps {
  onClose: () => void
}

export default function BrandingGallery({ onClose }: BrandingGalleryProps) {
  const [selectedProject, setSelectedProject] = useState<BrandProject | null>(null)
  const setIsModalOpen = useStore((s) => s.setIsModalOpen)

  // Sync modal and category audio state when opening Branding & Identity
  useEffect(() => {
    setIsModalOpen(true)
    useStore.getState().setSelectedCategory('BRANDING & IDENTITY')
    return () => {
      setIsModalOpen(false)
    }
  }, [setIsModalOpen])

  // Esc key listener when popup is closed
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
        className="wk-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="branding-gallery-title"
        initial={{ opacity: 0, scale: 0.985, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 6 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <button
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
            <div className="branding-head-kicker">DESIGNS · 01</div>
            <h3 id="branding-gallery-title" className="wk-detail-title">
              Branding &amp; Identity
            </h3>
            <p className="branding-head-desc">
              Logo design, visual systems, and PDF case studies exploring brand architecture and geometric mark construction.
            </p>
          </header>

          {/* List-style Projects matching Illustrations Category List */}
          <div className="branding-projects-list-wrapper">
            <ul className="wk-list">
              {BRAND_PROJECTS.map((proj) => (
                <li key={proj.id} className="wk-line">
                  <button
                    type="button"
                    className="wk-line-btn"
                    onClick={() => setSelectedProject(proj)}
                    aria-label={`Open ${proj.title} PDF case study`}
                  >
                    <span className="wk-line-name">{proj.title}</span>
                    <span className="wk-line-meta">{proj.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </motion.div>

      {/* PDF Popup Lightbox Viewer (Dynamically Loaded) */}
      {selectedProject && (
        <Suspense fallback={null}>
          <PdfPopupViewer
            project={selectedProject}
            isOpen={Boolean(selectedProject)}
            onClose={() => setSelectedProject(null)}
          />
        </Suspense>
      )}
    </>
  )
}
