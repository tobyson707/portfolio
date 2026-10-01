import React, { useState, useMemo } from 'react'
import { Search, X, Check, Image as ImageIcon, Box, FileAudio, AlertCircle } from 'lucide-react'
import { useContentStore, type MediaItem } from '../../services/contentStore'

interface AssetPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (asset: MediaItem) => void
  currentAssetPath?: string
  title?: string
  allowedTypes?: Array<'image' | 'video' | '3d' | 'audio' | 'other'>
}

export default function AssetPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentAssetPath,
  title = 'SELECT PORTFOLIO ASSET',
  allowedTypes = ['image'],
}: AssetPickerModalProps) {
  const media = useContentStore((s) => s.media)
  const categories = useContentStore((s) => s.categories)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [failedPaths, setFailedPaths] = useState<Set<string>>(new Set())

  const filteredAssets = useMemo(() => {
    return media.filter((item) => {
      // Type restriction
      if (allowedTypes.length > 0 && !allowedTypes.includes(item.type)) {
        return false
      }

      // Category filter
      if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
        return false
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = (item.name || item.filename).toLowerCase().includes(q)
        const matchPath = item.url.toLowerCase().includes(q)
        if (!matchName && !matchPath) return false
      }

      return true
    })
  }, [media, allowedTypes, selectedCategoryId, searchQuery])

  if (!isOpen) return null

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="admin-modal-head" style={{ flexShrink: 0 }}>
          <div>
            <h2 className="admin-modal-title">{title}</h2>
            <span className="admin-modal-subtitle">
              Choose an existing optimized WebP asset from the project’s public directory.
            </span>
          </div>
          <button
            type="button"
            className="admin-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--ad-border)',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div className="admin-search-wrap" style={{ flex: 1 }}>
            <Search size={14} className="admin-search-icon" />
            <input
              type="text"
              className="admin-input admin-search-input"
              placeholder="Search assets by name or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <select
            className="admin-select-compact"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="all">ALL CATEGORIES</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Assets Grid */}
        <div
          className="admin-modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          {filteredAssets.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '48px 20px',
                textAlign: 'center',
                color: 'var(--ad-text-secondary)',
              }}
            >
              <ImageIcon size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: 13, margin: 0 }}>No matching assets found in the registry.</p>
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isSelected = currentAssetPath === asset.url
              const isFailed = failedPaths.has(asset.url)
              const isWebP = asset.url.toLowerCase().endsWith('.webp')

              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    onSelect(asset)
                    onClose()
                  }}
                  style={{
                    border: isSelected ? '2px solid var(--ad-orange)' : '1px solid var(--ad-border)',
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: 'var(--ad-card-bg, #ffffff)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      aspectRatio: '16 / 10',
                      background: '#111215',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isFailed ? (
                      <AlertCircle size={18} color="#ef4444" />
                    ) : asset.type === '3d' ? (
                      <Box size={24} color="var(--ad-orange)" />
                    ) : asset.type === 'audio' ? (
                      <FileAudio size={24} color="var(--ad-orange)" />
                    ) : (
                      <img
                        src={asset.url}
                        alt={asset.name || asset.filename}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setFailedPaths((prev) => new Set(prev).add(asset.url))}
                        loading="lazy"
                      />
                    )}

                    {/* Active Check Icon */}
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'var(--ad-orange)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}

                    {/* WebP badge */}
                    {isWebP && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 4,
                          right: 4,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#ff7733',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 4px',
                          borderRadius: 3,
                          letterSpacing: '0.05em',
                        }}
                      >
                        WEBP
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '8px 10px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={asset.name || asset.filename}
                    >
                      {asset.name || asset.filename}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: 'var(--ad-text-secondary)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                      title={asset.url}
                    >
                      {asset.url}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="admin-modal-foot"
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--ad-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--ad-text-secondary)' }}>
            Showing {filteredAssets.length} registered asset{filteredAssets.length !== 1 ? 's' : ''}
          </span>
          <button type="button" className="admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
