import { useState } from 'react'
import { X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { Work } from '../../services/contentStore'

interface WorkPreviewModalProps {
  isOpen: boolean
  work: Partial<Work>
  categoryName?: string
  onClose: () => void
}

export default function WorkPreviewModal({
  isOpen,
  work,
  categoryName = 'Portfolio Work',
  onClose,
}: WorkPreviewModalProps) {
  const [selectedImg, setSelectedImg] = useState<string | null>(null)

  if (!isOpen) return null

  const images = work.gallery && work.gallery.length > 0
    ? work.gallery
    : [{ image: work.coverImage || '/images/xp.png', title: work.title || 'Artwork' }]

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-content"
        style={{ maxWidth: 840, width: '95vw', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="admin-status-badge"
              style={{
                background: 'rgba(241, 87, 35, 0.1)',
                borderColor: 'var(--ad-accent)',
                color: 'var(--ad-accent)',
              }}
            >
              PREVIEW MODE
            </span>
            <span style={{ fontSize: 13, color: 'var(--ad-text-secondary)', fontWeight: 500 }}>
              Viewing how this appears to visitors
            </span>
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="admin-modal-body" style={{ padding: '28px clamp(16px, 4vw, 36px)' }}>
          {/* Header area */}
          <div style={{ borderBottom: '1px solid var(--ad-border)', paddingBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--ad-accent)',
                }}
              >
                {categoryName}
              </span>
              <span style={{ color: 'var(--ad-text-muted)' }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--ad-text-muted)', fontWeight: 600 }}>
                {work.year || '2026'}
              </span>
              {work.status !== 'published' && (
                <span
                  className="admin-status-pill draft"
                  style={{ marginLeft: 6, fontSize: 10, padding: '2px 7px' }}
                >
                  {work.status || 'DRAFT'} (NOT LIVE)
                </span>
              )}
            </div>

            <h2
              style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                margin: '0 0 12px 0',
                color: 'var(--ad-text-primary)',
              }}
            >
              {work.title || 'Untitled Work'}
            </h2>

            {work.description && (
              <p
                style={{
                  fontSize: 15,
                  color: 'var(--ad-text-secondary)',
                  lineHeight: 1.6,
                  maxWidth: 680,
                  margin: 0,
                }}
              >
                {work.description}
              </p>
            )}

            {/* Meta Tags */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {work.client && (
                <span
                  style={{
                    fontSize: 11.5,
                    padding: '3px 9px',
                    borderRadius: 6,
                    background: 'var(--ad-surface-hover)',
                    border: '1px solid var(--ad-border)',
                  }}
                >
                  Client: <strong>{work.client}</strong>
                </span>
              )}
              {work.projectType && (
                <span
                  style={{
                    fontSize: 11.5,
                    padding: '3px 9px',
                    borderRadius: 6,
                    background: 'var(--ad-surface-hover)',
                    border: '1px solid var(--ad-border)',
                  }}
                >
                  Type: <strong>{work.projectType}</strong>
                </span>
              )}
              {work.tools &&
                work.tools.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11.5,
                      padding: '3px 9px',
                      borderRadius: 6,
                      background: 'var(--ad-accent-soft)',
                      color: 'var(--ad-accent)',
                      border: '1px solid var(--ad-accent-border)',
                      fontWeight: 600,
                    }}
                  >
                    {t}
                  </span>
                ))}
            </div>
          </div>

          {/* Gallery Grid */}
          <div>
            <h4
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ad-text-muted)',
                marginBottom: 12,
              }}
            >
              Artwork Gallery ({images.length})
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 14,
              }}
            >
              {images.map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid var(--ad-border)',
                    background: 'var(--ad-surface-hover)',
                    aspectRatio: '4/3',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onClick={() => setSelectedImg(img.image)}
                >
                  <img
                    src={img.image}
                    alt={img.title || `Work ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = '/images/xp.png'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '6px 10px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {img.title || `Image ${idx + 1}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Case Study Content if any */}
          {work.content && (
            <div
              style={{
                background: 'var(--ad-bg)',
                borderRadius: 12,
                padding: '20px 24px',
                border: '1px solid var(--ad-border)',
              }}
            >
              <h4
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ad-text-muted)',
                  marginTop: 0,
                  marginBottom: 14,
                }}
              >
                Case Study / Notes
              </h4>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--ad-text-primary)',
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {work.content}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <div className="admin-modal-foot">
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>

      {/* Expanded single image viewer inside preview */}
      {selectedImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100010,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setSelectedImg(null)}
        >
          <img
            src={selectedImg}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  )
}
