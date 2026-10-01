import React, { useState, useMemo } from 'react'
import {
  Search,
  Copy,
  Check,
  Image as ImageIcon,
  Box,
  FileAudio,
  AlertCircle,
} from 'lucide-react'
import {
  useContentStore,
  type MediaItem,
} from '../../services/contentStore'
import { calculateAssetUsage } from '../../services/mediaService'
import { useToast } from '../components/toastContext'

export default function AssetsPage() {
  const { toast } = useToast()
  const media = useContentStore((s) => s.media)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | '3d' | 'audio' | 'other'>('all')
  const [copiedPath, setCopiedPath] = useState<string | null>(null)
  const [failedImagePaths, setFailedImagePaths] = useState<Set<string>>(new Set())
  const [selectedAsset, setSelectedAsset] = useState<MediaItem | null>(null)

  // Computed assets with live usage
  const assetsWithUsage = useMemo(() => {
    return media.map((item) => {
      const usage = calculateAssetUsage(item)
      return {
        ...item,
        usage,
      }
    })
  }, [media])

  const filteredAssets = useMemo(() => {
    return assetsWithUsage.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = (item.name || item.filename).toLowerCase().includes(q)
        const matchPath = (item.url || '').toLowerCase().includes(q)
        const matchUsage = item.usage.referencedWorks.some((w) => w.toLowerCase().includes(q))
        if (!matchName && !matchPath && !matchUsage) return false
      }
      return true
    })
  }, [assetsWithUsage, typeFilter, search])

  const handleCopy = (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(path)
    setCopiedPath(path)
    toast('ASSET PATH COPIED TO CLIPBOARD.')
    setTimeout(() => setCopiedPath(null), 2000)
  }

  const imageAssetsCount = media.filter((m) => m.type === 'image' || m.url.endsWith('.webp')).length
  const model3dCount = media.filter((m) => m.type === '3d' || m.url.endsWith('.glb')).length
  const audioCount = media.filter((m) => m.type === 'audio' || m.url.endsWith('.mp3')).length

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-text">
          <h1 className="admin-page-heading">ASSETS</h1>
          <p className="admin-page-description">
            Read-only registry of static WebP, 3D models, and audio assets located in public/.
          </p>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="admin-stats-strip" style={{ marginBottom: 20 }}>
        <div className="admin-stat-block" onClick={() => setTypeFilter('all')} style={{ cursor: 'pointer' }}>
          <span className="admin-stat-label">TOTAL ASSETS</span>
          <span className="admin-stat-value">{media.length}</span>
          <span className="admin-stat-desc">IN REPOSITORY</span>
        </div>
        <div className="admin-stat-divider" />
        <div className="admin-stat-block" onClick={() => setTypeFilter('image')} style={{ cursor: 'pointer' }}>
          <span className="admin-stat-label">WEBP IMAGES</span>
          <span className="admin-stat-value" style={{ color: 'var(--ad-orange)' }}>
            {imageAssetsCount}
          </span>
          <span className="admin-stat-desc">ARTWORK &amp; COVERS</span>
        </div>
        <div className="admin-stat-divider" />
        <div className="admin-stat-block" onClick={() => setTypeFilter('3d')} style={{ cursor: 'pointer' }}>
          <span className="admin-stat-label">3D MODELS</span>
          <span className="admin-stat-value">{model3dCount}</span>
          <span className="admin-stat-desc">GLTF / GLB MESHES</span>
        </div>
        <div className="admin-stat-divider" />
        <div className="admin-stat-block" onClick={() => setTypeFilter('audio')} style={{ cursor: 'pointer' }}>
          <span className="admin-stat-label">AUDIO</span>
          <span className="admin-stat-value">{audioCount}</span>
          <span className="admin-stat-desc">BGM TRACKS</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar" style={{ marginBottom: 20 }}>
        <div className="admin-search-input-wrap" style={{ flex: 1, minWidth: 260 }}>
          <Search size={14} className="admin-search-icon" />
          <input
            type="text"
            className="admin-input admin-search-input"
            placeholder="Search static assets by name, path (/images/works/...), or referencing work..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-filter-group">
          <select
            className="admin-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            aria-label="Filter asset type"
          >
            <option value="all">ALL TYPES ({media.length})</option>
            <option value="image">IMAGES / WEBP ({imageAssetsCount})</option>
            <option value="3d">3D MODELS ({model3dCount})</option>
            <option value="audio">AUDIO ({audioCount})</option>
          </select>
        </div>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="admin-empty-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <ImageIcon size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p className="admin-empty-title">NO MATCHING ASSETS FOUND</p>
          <span style={{ fontSize: 13, color: 'var(--ad-text-secondary)' }}>
            Try adjusting your search query or type filter.
          </span>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {filteredAssets.map((asset) => {
            const is3D = asset.type === '3d' || asset.url.toLowerCase().endsWith('.glb')
            const isAudio = asset.type === 'audio' || asset.url.toLowerCase().endsWith('.mp3')
            const isFailed = failedImagePaths.has(asset.url)
            const isCopied = copiedPath === asset.url

            return (
              <div
                key={asset.id}
                className="admin-card"
                onClick={() => setSelectedAsset(asset)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Media Thumbnail */}
                <div
                  style={{
                    aspectRatio: '16 / 10',
                    background: '#121316',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid var(--ad-border)',
                  }}
                >
                  {isFailed ? (
                    <div style={{ textAlign: 'center', padding: 12, color: 'var(--ad-text-secondary)' }}>
                      <AlertCircle size={20} color="#ef4444" style={{ margin: '0 auto 4px' }} />
                      <span style={{ fontSize: 10 }}>Preview unavailable</span>
                    </div>
                  ) : is3D ? (
                    <Box size={32} color="var(--ad-orange)" style={{ opacity: 0.8 }} />
                  ) : isAudio ? (
                    <FileAudio size={32} color="var(--ad-orange)" style={{ opacity: 0.8 }} />
                  ) : (
                    <img
                      src={asset.url}
                      alt={asset.name || asset.filename}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => setFailedImagePaths((prev) => new Set(prev).add(asset.url))}
                      loading="lazy"
                    />
                  )}

                  {/* Format Tag */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'var(--ad-text-primary)',
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '2px 5px',
                      borderRadius: 3,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {is3D ? 'GLB' : isAudio ? 'MP3' : 'WEBP'}
                  </span>
                </div>

                {/* Info Container */}
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--ad-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {asset.name || asset.filename}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--ad-text-secondary)', marginLeft: 8 }}>
                      {asset.size || 'Optimized'}
                    </span>
                  </div>

                  {/* Public Path */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--ad-surface)',
                      border: '1px solid var(--ad-border)',
                      borderRadius: 4,
                      padding: '4px 8px',
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: 'var(--ad-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {asset.url}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(asset.url, e)}
                      title="Copy public path"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isCopied ? 'var(--ad-orange)' : 'var(--ad-text-secondary)',
                        cursor: 'pointer',
                        padding: 2,
                        display: 'flex',
                      }}
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>

                  {/* Referenced By */}
                  <div style={{ marginTop: 'auto', paddingTop: 6, fontSize: 11 }}>
                    {asset.usage.isUsed ? (
                      <span style={{ color: 'var(--ad-success, #10b981)', fontWeight: 600 }}>
                        Used by: {asset.usage.referencedWorks[0] || asset.usage.referencedCategories[0]}
                        {asset.usage.referencedWorks.length + asset.usage.referencedCategories.length > 1 &&
                          ` (+${asset.usage.referencedWorks.length + asset.usage.referencedCategories.length - 1} more)`}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ad-text-secondary)', opacity: 0.7 }}>
                        Not directly referenced
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Asset Inspection Modal (Read-Only) */}
      {selectedAsset && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedAsset(null)}>
          <div
            className="admin-modal-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540 }}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">INSPECT ASSET</h3>
              <button
                type="button"
                className="admin-btn-icon"
                onClick={() => setSelectedAsset(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Image Preview */}
              <div
                style={{
                  maxHeight: 260,
                  background: '#111215',
                  borderRadius: 6,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--ad-border)',
                }}
              >
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.name || selectedAsset.filename}
                  style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain' }}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/images/xp.png'
                  }}
                />
              </div>

              {/* Path & Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--ad-text-secondary)', fontSize: 10, display: 'block' }}>FILENAME</span>
                  <span style={{ fontWeight: 600 }}>{selectedAsset.filename || selectedAsset.name}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ad-text-secondary)', fontSize: 10, display: 'block' }}>FORMAT</span>
                  <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{selectedAsset.type}</span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--ad-text-secondary)', fontSize: 10, display: 'block' }}>PUBLIC PATH</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ad-orange)' }}>
                    {selectedAsset.url}
                  </span>
                </div>
              </div>

              {/* Usage */}
              <div>
                <span style={{ color: 'var(--ad-text-secondary)', fontSize: 10, display: 'block', marginBottom: 4 }}>
                  PORTFOLIO REFERENCES
                </span>
                {calculateAssetUsage(selectedAsset).isUsed ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {calculateAssetUsage(selectedAsset).referencedWorks.map((w) => (
                      <div
                        key={w}
                        style={{
                          fontSize: 12,
                          padding: '6px 10px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: 4,
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Work: <strong>{w}</strong></span>
                        <span style={{ color: 'var(--ad-success, #10b981)', fontSize: 10, fontWeight: 700 }}>ACTIVE</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--ad-text-secondary)', padding: 8, background: 'var(--ad-surface)', borderRadius: 4 }}>
                    This asset is part of the public repository and available for work references.
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={(e) => handleCopy(selectedAsset.url, e)}
              >
                <Copy size={13} style={{ marginRight: 6 }} />
                <span>Copy Path</span>
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={() => setSelectedAsset(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
