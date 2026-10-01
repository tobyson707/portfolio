import React, { useState, useMemo, useRef, type ChangeEvent } from 'react'
import {
  Upload,
  Search,
  Copy,
  Trash2,
  Check,
  X,
  FileAudio,
  Film,
  Box,
  CheckSquare,
  Archive,
  Volume2,
  Cloud,
  Link as LinkIcon,
  FileArchive,
  FileText,
  Plus,
} from 'lucide-react'
import JSZip from 'jszip'
import { useContentStore, type MediaItem, type Category, type WorkGroupItem } from '../../services/contentStore'
import {
  uploadMediaFile,
  deleteMediaAsset,
  validateMediaFile,
  formatFileSize,
} from '../../services/mediaService'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../components/toastContext'
import {
  useSelection,
  SelectionCheckbox,
  SelectAllCheckbox,
  BulkActionBar,
  BulkMoveModal,
} from '../components/selection'

export default function MediaPage() {
  const { toast } = useToast()

  const media = useContentStore((s) => s.media)
  const categories = useContentStore((s) => s.categories)
  const workGroups = useContentStore((s) => s.workGroups)
  const addMedia = useContentStore((s) => s.addMedia)
  const deleteMedia = useContentStore((s) => s.deleteMedia)
  const archiveMedia = useContentStore((s) => s.archiveMedia)
  const bulkUpdateMedia = useContentStore((s) => s.bulkUpdateMedia)
  const bulkMoveMedia = useContentStore((s) => s.bulkMoveMedia)
  const settings = useContentStore((s) => s.settings)
  const updateSettings = useContentStore((s) => s.updateSettings)

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active') // active, hidden, archived

  const [selectedAsset, setSelectedAsset] = useState<MediaItem | null>(null)
  const [assetToDelete, setAssetToDelete] = useState<MediaItem | null>(null)

  // Modals
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [isZipModalOpen, setIsZipModalOpen] = useState(false)

  // Import flow state
  const [importingFiles, setImportingFiles] = useState<{
    files: { file?: File; name: string; size: string; type: MediaItem['type']; url?: string; source: string; originalPath?: string }[]
    sourceName: string
  } | null>(null)
  const [importCategoryId, setImportCategoryId] = useState('')
  const [importWorkGroupId, setImportWorkGroupId] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, currentFilename: '', percent: 0, statusText: '' })
  const [importResultSummary, setImportResultSummary] = useState<{ imported: number; skipped: number; failed: number; errors?: string[] } | null>(null)

  // Drive Picker mock state (account: tobyson707@gmail.com)
  const driveFolder = 'My Drive / Portfolio'
  const [driveSelectedIds, setDriveSelectedIds] = useState<string[]>([])
  const mockDriveFiles = [
    { id: 'df-1', name: 'character_concept_01.png', type: 'image' as const, size: '2.4 MB', folder: 'My Drive / Portfolio / Artwork' },
    { id: 'df-2', name: 'studio_lighting_test.mp4', type: 'video' as const, size: '14.8 MB', folder: 'My Drive / Portfolio / Video' },
    { id: 'df-3', name: 'sculpture_study_04.glb', type: '3d' as const, size: '8.2 MB', folder: 'My Drive / Portfolio / 3D' },
    { id: 'df-4', name: 'ambient_soundscape.mp3', type: 'audio' as const, size: '5.1 MB', folder: 'My Drive / Portfolio / Audio' },
    { id: 'df-5', name: 'ui_wireframe_v2.png', type: 'image' as const, size: '1.2 MB', folder: 'My Drive / Portfolio / UI' },
  ]

  // Link import state
  const [linkInput, setLinkInput] = useState('')
  const [linkPreview, setLinkPreview] = useState<{ name: string; type: MediaItem['type']; size: string; url: string; source: string } | null>(null)
  const [linkFetching, setLinkFetching] = useState(false)
  const [linkError, setLinkError] = useState('')

  // ZIP import state
  const [zipAnalysis, setZipAnalysis] = useState<{
    filename: string
    supportedFiles: { file: File; name: string; size: string; type: MediaItem['type']; url: string; originalPath: string }[]
    unsupportedCount: number
  } | null>(null)

  // Bulk modals state
  const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false)
  const [bulkConfirmData, setBulkConfirmData] = useState<{
    title: string
    message: string
    confirmLabel: string
    danger?: boolean
    onConfirm: () => void
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)

  const activeBackgroundAudioUrl = settings?.audio?.backgroundSoundUrl || ''

  const filteredMedia = useMemo(() => {
    return media
      .filter((m) => {
        if (filterStatus === 'archived') return m.status === 'archived'
        if (filterStatus === 'hidden') return m.status === 'hidden'
        return m.status !== 'archived' // active
      })
      .filter((m) => {
        if (filterType === 'images' && m.type !== 'image') return false
        if (filterType === 'videos' && m.type !== 'video') return false
        if (filterType === '3d' && m.type !== '3d') return false
        if (filterType === 'audio' && m.type !== 'audio') return false
        if (
          filterType === 'other' &&
          (m.type === 'image' || m.type === 'video' || m.type === '3d' || m.type === 'audio')
        )
          return false
        if (filterSource !== 'all' && (m as any).source !== filterSource) return false

        if (search.trim()) {
          const q = search.toLowerCase()
          return (
            m.filename.toLowerCase().includes(q) ||
            m.url.toLowerCase().includes(q) ||
            (m.categoryId && m.categoryId.toLowerCase().includes(q))
          )
        }
        return true
      })
  }, [media, filterType, filterSource, filterStatus, search])

  // Selection system
  const {
    selectedArray,
    selectedCount,
    isSelected,
    toggle,
    selectAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
    isSelectionMode,
    toggleSelectionMode,
  } = useSelection({
    items: filteredMedia,
  })

  const handleCopyUrl = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(url)
    toast('MEDIA URL COPIED.')
  }

  const handleUseAsset = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation()
    handleCopyUrl(item.url)
    toast('ASSET URL READY TO PASTE.')
  }

  const handleSetAsBackgroundSound = (item: MediaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    updateSettings({
      audio: {
        ...settings.audio,
        enabled: true,
        backgroundSoundUrl: item.url,
        fileName: item.filename,
        storagePath: item.storagePath || '',
        mimeType: item.type === 'audio' ? 'audio/mpeg' : 'audio/mp3',
        size: item.size ? parseFloat(item.size) * 1024 * 1024 : 0,
        duration: item.duration || 0,
        updatedAt: new Date().toISOString(),
      },
    })
    toast(`"${item.filename}" SET AS BACKGROUND SOUND.`)
  }

  const handlePromptDelete = (item: MediaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const isActiveBg = item.url === activeBackgroundAudioUrl
    if (isActiveBg) {
      setBulkConfirmData({
        title: 'ACTIVE BACKGROUND SOUND',
        message: 'This audio is currently active on the public portfolio. Deleting it will disable background audio.',
        confirmLabel: 'DELETE & DISABLE',
        danger: true,
        onConfirm: () => {
          updateSettings({
            audio: {
              ...settings.audio,
              enabled: false,
              backgroundSoundUrl: '',
              fileName: '',
              updatedAt: new Date().toISOString(),
            },
          })
          deleteMedia(item.id)
          if (selectedAsset?.id === item.id) setSelectedAsset(null)
          setBulkConfirmData(null)
          toast('BACKGROUND AUDIO DELETED & DISABLED.')
        },
      })
      return
    }
    setAssetToDelete(item)
  }

  const handleConfirmDelete = async () => {
    if (assetToDelete) {
      const target = assetToDelete
      setAssetToDelete(null)
      if (selectedAsset?.id === target.id) {
        setSelectedAsset(null)
      }
      try {
        await deleteMediaAsset(target)
        toast('MEDIA REMOVED.')
      } catch (err: any) {
        toast(`DELETE FAILED: ${err?.message || err}`)
      }
    }
  }

  const handlePromptArchive = (item: MediaItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const isActiveBg = item.url === activeBackgroundAudioUrl
    if (isActiveBg) {
      setBulkConfirmData({
        title: 'ACTIVE BACKGROUND SOUND',
        message: 'This audio is currently active on the public portfolio. Archiving it will disable background audio.',
        confirmLabel: 'ARCHIVE & DISABLE',
        danger: true,
        onConfirm: () => {
          updateSettings({
            audio: {
              ...settings.audio,
              enabled: false,
              backgroundSoundUrl: '',
              fileName: '',
              updatedAt: new Date().toISOString(),
            },
          })
          archiveMedia(item.id)
          if (selectedAsset?.id === item.id) setSelectedAsset(null)
          setBulkConfirmData(null)
          toast('AUDIO ARCHIVED & DISABLED.')
        },
      })
      return
    }
    archiveMedia(item.id)
    if (selectedAsset?.id === item.id) setSelectedAsset(null)
    toast('ASSET ARCHIVED.')
  }

  // Bulk action handlers
  const handleBulkHide = () => {
    setBulkConfirmData({
      title: `HIDE ${selectedCount} ASSETS?`,
      message: 'These assets will be marked as hidden in your portfolio.',
      confirmLabel: 'HIDE ASSETS',
      onConfirm: () => {
        bulkUpdateMedia(selectedArray, { status: 'hidden' })
        toast(`${selectedCount} ASSETS HIDDEN.`)
        clearSelection()
        setBulkConfirmData(null)
      },
    })
  }

  const handleBulkUnhide = () => {
    bulkUpdateMedia(selectedArray, { status: 'published' })
    toast(`${selectedCount} ASSETS RESTORED.`)
    clearSelection()
  }

  const handleBulkArchive = () => {
    setBulkConfirmData({
      title: `ARCHIVE ${selectedCount} ASSETS?`,
      message: 'Archived assets will be moved to Archive and can be restored at any time.',
      confirmLabel: 'ARCHIVE ASSETS',
      onConfirm: () => {
        selectedArray.forEach((id) => archiveMedia(id))
        toast(`${selectedCount} ASSETS ARCHIVED.`)
        clearSelection()
        setBulkConfirmData(null)
      },
    })
  }

  const handleBulkDelete = () => {
    setBulkConfirmData({
      title: `DELETE ${selectedCount} ASSETS?`,
      message: 'This action cannot be undone. The selected files will be removed from Firestore and Firebase Storage.',
      confirmLabel: `DELETE ${selectedCount} ASSETS`,
      danger: true,
      onConfirm: async () => {
        const toDelete = [...selectedArray]
        clearSelection()
        setBulkConfirmData(null)
        for (const id of toDelete) {
          try {
            await deleteMediaAsset(id)
          } catch (e) {
            console.error(`Error deleting asset ${id}:`, e)
          }
        }
        toast(`${toDelete.length} ASSETS DELETED.`)
      },
    })
  }

  const handleExecuteBulkMove = (categoryId?: string, workGroupId?: string) => {
    bulkMoveMedia(selectedArray, categoryId, workGroupId)
    toast(`${selectedCount} ASSETS MOVED.`)
    clearSelection()
    setIsBulkMoveOpen(false)
  }

  // Local Computer Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const prepared: { file: File; name: string; size: string; type: MediaItem['type']; url: string; source: string }[] = []

    Array.from(files).forEach((file) => {
      const validation = validateMediaFile(file)
      if (!validation.valid) {
        toast(validation.error || `UNSUPPORTED FILE: ${file.name}`)
        return
      }

      prepared.push({
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: validation.mediaType,
        url: URL.createObjectURL(file),
        source: 'computer',
      })
    })

    if (fileInputRef.current) fileInputRef.current.value = ''

    if (prepared.length > 0) {
      setImportingFiles({ files: prepared, sourceName: 'Computer Upload' })
    }
  }

  // Google Drive Import Selection Handler
  const handleConfirmDriveImport = () => {
    const chosen = mockDriveFiles.filter((f) => driveSelectedIds.includes(f.id))
    if (chosen.length === 0) {
      toast('NO FILES SELECTED FROM GOOGLE DRIVE.')
      return
    }

    const prepared = chosen.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      url: `https://drive.google.com/uc?id=${f.id}`,
      source: 'google-drive',
    }))

    setIsDriveModalOpen(false)
    setImportingFiles({ files: prepared, sourceName: 'Google Drive (tobyson707@gmail.com)' })
  }

  // Link Import Fetcher
  const handleFetchLink = () => {
    setLinkError('')
    if (!linkInput.trim()) {
      setLinkError('Please enter a valid URL.')
      return
    }

    try {
      const urlObj = new URL(linkInput)
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setLinkError('Only HTTP and HTTPS protocols are supported.')
        return
      }

      setLinkFetching(true)
      setTimeout(() => {
        setLinkFetching(false)
        const isDrive = linkInput.includes('drive.google.com')
        const filename = linkInput.split('/').pop()?.split('?')[0] || 'imported_asset.jpg'
        let type: MediaItem['type'] = 'image'
        if (filename.endsWith('.mp4') || filename.endsWith('.webm')) type = 'video'
        else if (filename.endsWith('.mp3') || filename.endsWith('.wav')) type = 'audio'
        else if (filename.endsWith('.glb')) type = '3d'

        setLinkPreview({
          name: filename,
          type,
          size: '1.8 MB',
          url: linkInput,
          source: isDrive ? 'google-drive' : 'url',
        })
      }, 600)
    } catch {
      setLinkError('Invalid URL format.')
    }
  }

  const handleConfirmLinkImport = () => {
    if (!linkPreview) return
    setIsLinkModalOpen(false)
    setImportingFiles({ files: [linkPreview], sourceName: linkPreview.source === 'google-drive' ? 'Google Drive Link' : 'Direct URL' })
    setLinkPreview(null)
    setLinkInput('')
  }

  // ZIP Import handler using JSZip
  const handleZipUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.zip')) {
      toast('PLEASE UPLOAD A VALID .ZIP FILE.')
      return
    }

    try {
      const zip = new JSZip()
      const zipContent = await zip.loadAsync(file)
      const supportedFiles: { file: File; name: string; size: string; type: MediaItem['type']; url: string; originalPath: string }[] = []
      let unsupported = 0

      const entries = Object.keys(zipContent.files)
      for (const relativePath of entries) {
        const zipEntry = zipContent.files[relativePath]
        if (zipEntry.dir) continue

        if (relativePath.includes('..') || relativePath.startsWith('/')) continue

        const name = relativePath.split('/').pop() || relativePath
        const ext = name.split('.').pop()?.toLowerCase() || ''
        const supportedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a', 'glb', 'gltf']

        if (!ext || !supportedExts.includes(ext)) {
          unsupported++
          continue
        }

        const blob = await zipEntry.async('blob')
        let type: MediaItem['type'] = 'image'
        let mime = 'image/jpeg'
        if (['mp4', 'webm', 'mov'].includes(ext)) {
          type = 'video'
          mime = ext === 'mov' ? 'video/quicktime' : `video/${ext}`
        } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
          type = 'audio'
          mime = ext === 'mp3' ? 'audio/mpeg' : `audio/${ext}`
        } else if (['glb', 'gltf'].includes(ext)) {
          type = '3d'
          mime = ext === 'glb' ? 'model/gltf-binary' : 'model/gltf+json'
        } else if (ext === 'png') mime = 'image/png'
        else if (ext === 'webp') mime = 'image/webp'
        else if (ext === 'svg') mime = 'image/svg+xml'
        else if (ext === 'gif') mime = 'image/gif'

        const fileObj = new File([blob], name, { type: mime })
        const previewUrl = URL.createObjectURL(blob)

        supportedFiles.push({
          file: fileObj,
          name,
          size: formatFileSize(blob.size),
          type,
          url: previewUrl,
          originalPath: relativePath,
        })
      }

      if (zipInputRef.current) zipInputRef.current.value = ''

      setZipAnalysis({
        filename: file.name,
        supportedFiles,
        unsupportedCount: unsupported,
      })
      setIsZipModalOpen(true)
    } catch {
      toast('FAILED TO PARSE ZIP FILE.')
    }
  }

  const handleConfirmZipImport = () => {
    if (!zipAnalysis || zipAnalysis.supportedFiles.length === 0) return
    setIsZipModalOpen(false)
    setImportingFiles({
      files: zipAnalysis.supportedFiles.map((f) => ({ ...f, source: 'zip' })),
      sourceName: `ZIP Archive (${zipAnalysis.filename})`,
    })
    setZipAnalysis(null)
  }

  // Execute Batch Import with Real Progress and Persistence
  const handleExecuteBatchImport = async () => {
    if (!importingFiles || importingFiles.files.length === 0) return

    setIsImporting(true)
    const total = importingFiles.files.length
    setImportProgress({ current: 0, total, currentFilename: importingFiles.files[0].name, percent: 0, statusText: 'Initializing upload...' })

    let importedCount = 0
    let skippedCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (let idx = 0; idx < total; idx++) {
      const item = importingFiles.files[idx]
      setImportProgress({
        current: idx + 1,
        total,
        currentFilename: item.name,
        percent: Math.round((idx / total) * 100),
        statusText: `Uploading ${item.name}...`,
      })

      try {
        if (item.file) {
          // Real Firebase Storage upload and atomic Firestore document creation
          await uploadMediaFile(item.file, {
            categoryId: importCategoryId || undefined,
            workGroupId: importWorkGroupId || undefined,
            source: (item.source as any) || 'computer',
            onProgress: (filePercent: number, fileStatus: string) => {
              const overall = Math.round(((idx + filePercent / 100) / total) * 100)
              setImportProgress({
                current: idx + 1,
                total,
                currentFilename: item.name,
                percent: Math.min(99, overall),
                statusText: fileStatus,
              })
            },
          })
          importedCount++
        } else if (item.url) {
          // Remote link or drive asset
          const exists = media.some((m) => m.filename === item.name && m.url === item.url)
          if (exists) {
            skippedCount++
          } else {
            addMedia({
              filename: item.name,
              url: item.url,
              type: item.type,
              size: item.size,
              categoryId: importCategoryId || undefined,
              workGroupId: importWorkGroupId || undefined,
              status: 'published',
              source: item.source,
              originalPath: item.originalPath,
            } as any)
            importedCount++
          }
        }
      } catch (err: any) {
        console.error(`[Media Upload] Failed to persist ${item.name}:`, err)
        failedCount++
        errors.push(`${item.name}: ${err?.message || 'Upload failed'}`)
      }
    }

    setIsImporting(false)
    setImportProgress({ current: total, total, currentFilename: '', percent: 100, statusText: 'Finished' })
    setImportResultSummary({ imported: importedCount, skipped: skippedCount, failed: failedCount, errors })

    if (failedCount === 0) {
      toast(`MEDIA UPLOADED: ${importedCount} ASSET${importedCount === 1 ? '' : 'S'} SAVED.`)
    } else if (importedCount > 0) {
      toast(`UPLOAD FINISHED: ${importedCount} SAVED, ${failedCount} FAILED.`)
    } else {
      toast(`UPLOAD FAILED: ${errors[0] || 'Could not save assets to Firebase'}`)
    }
  }

  return (
    <div className="admin-page-container">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.glb,.gltf"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        style={{ display: 'none' }}
        onChange={handleZipUpload}
      />

      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-text">
          <h1 className="admin-page-heading">MEDIA</h1>
          <p className="admin-page-description">
            MANAGE ARTWORK, IMAGES, VIDEOS, AUDIO AND OTHER PORTFOLIO ASSETS.
          </p>
        </div>

        <div className="admin-header-actions" style={{ position: 'relative' }}>
          <button
            type="button"
            className={`admin-btn-secondary ${isSelectionMode ? 'is-active' : ''}`}
            onClick={toggleSelectionMode}
            title={isSelectionMode ? 'Exit Selection Mode' : 'Enter Selection Mode'}
          >
            <CheckSquare size={13} style={{ marginRight: 6 }} />
            <span>{isSelectionMode ? 'DONE' : 'SELECT'}</span>
          </button>

          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          >
            <Plus size={14} style={{ marginRight: 6 }} />
            <span>ADD MEDIA</span>
          </button>

          {/* Add Media Dropdown Menu */}
          {isAddMenuOpen && (
            <div
              className="admin-dropdown-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                zIndex: 100,
                background: 'var(--ad-surface)',
                border: '1px solid var(--ad-border)',
                borderRadius: 12,
                boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                width: 240,
                padding: 6,
              }}
            >
              <button
                type="button"
                className="admin-dropdown-item"
                onClick={() => {
                  setIsAddMenuOpen(false)
                  fileInputRef.current?.click()
                }}
              >
                <Upload size={14} />
                <span>Upload from Computer</span>
              </button>
              <button
                type="button"
                className="admin-dropdown-item"
                onClick={() => {
                  setIsAddMenuOpen(false)
                  setIsDriveModalOpen(true)
                }}
              >
                <Cloud size={14} />
                <span>Import from Google Drive</span>
              </button>
              <button
                type="button"
                className="admin-dropdown-item"
                onClick={() => {
                  setIsAddMenuOpen(false)
                  setIsLinkModalOpen(true)
                }}
              >
                <LinkIcon size={14} />
                <span>Import from Link</span>
              </button>
              <button
                type="button"
                className="admin-dropdown-item"
                onClick={() => {
                  setIsAddMenuOpen(false)
                  zipInputRef.current?.click()
                }}
              >
                <FileArchive size={14} />
                <span>Import ZIP</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search, Filters, and View toggle bar */}
      <div className="admin-filter-bar">
        {/* Search */}
        <div className="admin-search-wrapper">
          <Search size={14} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-field"
            placeholder="SEARCH MEDIA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="admin-media-filter-tabs">
          {[
            { id: 'all', label: 'ALL' },
            { id: 'images', label: 'IMAGES' },
            { id: 'videos', label: 'VIDEOS' },
            { id: '3d', label: '3D' },
            { id: 'audio', label: 'AUDIO' },
            { id: 'other', label: 'OTHER' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-media-tab-btn ${filterType === tab.id ? 'is-active' : ''}`}
              onClick={() => setFilterType(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <select
          className="admin-select"
          style={{ width: 140, fontSize: 11 }}
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
        >
          <option value="all">ALL SOURCES</option>
          <option value="computer">Computer</option>
          <option value="google-drive">Google Drive</option>
          <option value="url">Direct URL</option>
          <option value="zip">ZIP Archive</option>
        </select>

        {/* Status Filter */}
        <select
          className="admin-select"
          style={{ width: 120, fontSize: 11 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
          <option value="archived">Archived</option>
        </select>

        {/* Select All Checkbox Button */}
        {filteredMedia.length > 0 && (
          <SelectAllCheckbox
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onToggleAll={selectAll}
            totalCount={filteredMedia.length}
            selectedCount={selectedCount}
          />
        )}
      </div>

      {/* Reusable Bulk Action Toolbar */}
      <BulkActionBar
        selectedCount={selectedCount}
        entityLabel="ASSET"
        onClear={clearSelection}
        onSelectAll={selectAll}
        isAllSelected={isAllSelected}
        onUnhide={handleBulkUnhide}
        onHide={handleBulkHide}
        onMove={() => setIsBulkMoveOpen(true)}
        onArchive={handleBulkArchive}
        onDelete={handleBulkDelete}
      />

      {/* Visual Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="admin-empty-card" style={{ padding: '64px 20px' }}>
          <p className="admin-empty-title">
            {search || filterType !== 'all' || filterSource !== 'all'
              ? 'NO ASSETS MATCH CURRENT FILTER.'
              : 'MEDIA LIBRARY'}
          </p>
          <p className="admin-empty-subtitle" style={{ marginBottom: 16 }}>
            No media uploaded yet.
          </p>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => setIsAddMenuOpen(true)}
          >
            <Plus size={14} style={{ marginRight: 6 }} />
            <span>+ ADD MEDIA</span>
          </button>
        </div>
      ) : (
        <div className="admin-media-grid">
          {filteredMedia.map((item) => {
            const itemSelected = isSelected(item.id)
            const isActiveBgSound = item.url === activeBackgroundAudioUrl
            const sourceBadge = (item as any).source || 'computer'

            return (
              <div
                key={item.id}
                className={`admin-media-card ${itemSelected ? 'is-selected' : ''}`}
                tabIndex={0}
                onClick={() => {
                  if (isSelectionMode) {
                    toggle(item.id)
                  } else {
                    setSelectedAsset(item)
                  }
                }}
              >
                {/* Selection Checkbox Overlay */}
                <div
                  className={`admin-card-select-overlay ${
                    itemSelected || isSelectionMode ? 'is-visible' : ''
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectionCheckbox
                    isSelected={itemSelected}
                    onToggle={() => toggle(item.id)}
                    ariaLabel={`Select ${item.filename}`}
                  />
                </div>

                {/* Badges */}
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 3,
                    display: 'flex',
                    gap: 4,
                  }}
                >
                  {isActiveBgSound && (
                    <span
                      className="admin-badge admin-badge-orange"
                      style={{ fontSize: 9, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 3 }}
                    >
                      <Volume2 size={10} />
                      BG SOUND
                    </span>
                  )}
                  <span
                    className="admin-badge"
                    style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                  >
                    {sourceBadge.toUpperCase()}
                  </span>
                </div>

                <div className="admin-media-thumb-wrap">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="admin-media-thumb"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = '/images/xp.png'
                      }}
                    />
                  ) : item.type === 'audio' ? (
                    <div className="admin-media-fallback-thumb" style={{ background: 'var(--ad-surface-hover)' }}>
                      <FileAudio size={28} style={{ color: 'var(--ad-accent)', marginBottom: 6 }} />
                      <span className="admin-media-filename-sub">{item.filename}</span>
                    </div>
                  ) : item.type === '3d' ? (
                    <div className="admin-media-fallback-thumb">
                      <Box size={28} style={{ color: 'var(--ad-text-secondary)', marginBottom: 6 }} />
                      <span className="admin-media-filename-sub">{item.filename}</span>
                    </div>
                  ) : (
                    <div className="admin-media-fallback-thumb">
                      <Film size={28} style={{ color: 'var(--ad-text-secondary)', marginBottom: 6 }} />
                      <span className="admin-media-filename-sub">{item.filename}</span>
                    </div>
                  )}

                  {/* Hover/Focus overlay actions */}
                  <div
                    className="admin-media-hover-overlay"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="admin-media-controls-group">
                      <button
                        type="button"
                        className="admin-media-overlay-btn"
                        onClick={(e) => handleUseAsset(item, e)}
                        title="Use media"
                      >
                        <Check size={11} style={{ marginRight: 4 }} />
                        <span>USE</span>
                      </button>

                      {item.type === 'audio' && !isActiveBgSound && (
                        <button
                          type="button"
                          className="admin-media-overlay-btn"
                          onClick={(e) => handleSetAsBackgroundSound(item, e)}
                          title="Set as background sound"
                        >
                          <Volume2 size={11} style={{ marginRight: 4 }} />
                          <span>SOUND</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="admin-media-overlay-btn"
                        onClick={(e) => handleCopyUrl(item.url, e)}
                        title="Copy media URL"
                      >
                        <Copy size={11} style={{ marginRight: 4 }} />
                        <span>COPY</span>
                      </button>

                      <button
                        type="button"
                        className="admin-media-overlay-btn admin-media-delete-btn"
                        onClick={(e) => handlePromptDelete(item, e)}
                        title="Delete media"
                      >
                        <Trash2 size={11} style={{ marginRight: 4 }} />
                        <span>DELETE</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* GOOGLE DRIVE PICKER MODAL */}
      {isDriveModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsDriveModalOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Cloud size={18} style={{ color: 'var(--ad-accent)' }} />
                <h3 className="admin-modal-title">IMPORT FROM GOOGLE DRIVE</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setIsDriveModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 12, color: 'var(--ad-text-secondary)', marginBottom: 12 }}>
                Connected account: <strong>tobyson707@gmail.com</strong>
              </p>
              <div style={{ padding: '8px 12px', background: 'var(--ad-surface-hover)', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                Current folder: {driveFolder}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', marginBottom: 20 }}>
                {mockDriveFiles.map((file) => {
                  const isSelected = driveSelectedIds.includes(file.id)
                  return (
                    <div
                      key={file.id}
                      onClick={() => {
                        setDriveSelectedIds((curr) =>
                          curr.includes(file.id) ? curr.filter((id) => id !== file.id) : [...curr, file.id]
                        )
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: isSelected ? 'rgba(241,87,35,0.08)' : 'var(--ad-surface)',
                        border: `1px solid ${isSelected ? 'var(--ad-accent)' : 'var(--ad-border)'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ accentColor: 'var(--ad-accent)' }}
                        />
                        <FileText size={15} style={{ color: 'var(--ad-text-secondary)' }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ad-text-primary)' }}>{file.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--ad-text-muted)' }}>{file.folder} · {file.size}</div>
                        </div>
                      </div>
                      <span className="admin-badge" style={{ fontSize: 9 }}>{file.type.toUpperCase()}</span>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--ad-text-secondary)' }}>
                  {driveSelectedIds.length} FILES SELECTED
                </span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="admin-btn-secondary" onClick={() => setIsDriveModalOpen(false)}>
                    CANCEL
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={driveSelectedIds.length === 0}
                    onClick={handleConfirmDriveImport}
                  >
                    IMPORT {driveSelectedIds.length} FILES
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT FROM LINK MODAL */}
      {isLinkModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsLinkModalOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <LinkIcon size={18} style={{ color: 'var(--ad-accent)' }} />
                <h3 className="admin-modal-title">IMPORT FROM LINK</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setIsLinkModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 12, color: 'var(--ad-text-secondary)', marginBottom: 16 }}>
                Paste a direct media URL (JPG, PNG, MP4, MP3) or Google Drive sharing link.
              </p>

              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <input
                  type="url"
                  className="admin-input"
                  placeholder="https://example.com/artwork.jpg or Google Drive link..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={handleFetchLink}
                  disabled={linkFetching}
                >
                  {linkFetching ? 'FETCHING...' : 'FETCH MEDIA'}
                </button>
              </div>

              {linkError && (
                <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                  {linkError}
                </div>
              )}

              {linkPreview && (
                <div style={{ padding: 14, background: 'var(--ad-surface-hover)', borderRadius: 10, border: '1px solid var(--ad-border)', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ad-text-primary)', marginBottom: 4 }}>
                    {linkPreview.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ad-text-secondary)', display: 'flex', gap: 12 }}>
                    <span>Source: {linkPreview.source === 'google-drive' ? 'Google Drive' : 'Direct URL'}</span>
                    <span>Type: {linkPreview.type.toUpperCase()}</span>
                    <span>Size: {linkPreview.size}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="admin-btn-secondary" onClick={() => setIsLinkModalOpen(false)}>
                  CANCEL
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={!linkPreview}
                  onClick={handleConfirmLinkImport}
                >
                  IMPORT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ZIP PREVIEW MODAL */}
      {isZipModalOpen && zipAnalysis && (
        <div className="admin-modal-overlay" onClick={() => setIsZipModalOpen(false)}>
          <div className="admin-modal-card" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileArchive size={18} style={{ color: 'var(--ad-accent)' }} />
                <h3 className="admin-modal-title">ZIP ARCHIVE PREVIEW</h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setIsZipModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                {zipAnalysis.filename}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ad-text-secondary)', marginBottom: 16 }}>
                Found <strong>{zipAnalysis.supportedFiles.length}</strong> supported files ({zipAnalysis.unsupportedCount} unsupported files skipped).
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, padding: 8, background: 'var(--ad-surface-hover)', borderRadius: 8 }}>
                {zipAnalysis.supportedFiles.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 8px' }}>
                    <span style={{ color: 'var(--ad-text-primary)' }}>{file.originalPath}</span>
                    <span style={{ color: 'var(--ad-text-muted)' }}>{file.size}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="admin-btn-secondary" onClick={() => setIsZipModalOpen(false)}>
                  CANCEL
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={zipAnalysis.supportedFiles.length === 0}
                  onClick={handleConfirmZipImport}
                >
                  IMPORT SUPPORTED FILES ({zipAnalysis.supportedFiles.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAXONOMY ASSIGNMENT & REAL PROGRESS MODAL */}
      {importingFiles && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {isImporting ? 'IMPORTING MEDIA...' : importResultSummary ? 'IMPORT COMPLETE' : `ASSIGN TAXONOMY (${importingFiles.files.length} FILES)`}
              </h3>
            </div>
            <div className="admin-modal-body">
              {isImporting ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--ad-text-secondary)' }}>
                    <span>
                      File {importProgress.current} of {importProgress.total}: <strong>{importProgress.currentFilename}</strong>
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--ad-accent)' }}>
                      {importProgress.percent}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--ad-border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${importProgress.percent}%`,
                        height: '100%',
                        background: 'var(--ad-accent)',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                  {importProgress.statusText && (
                    <div style={{ fontSize: 11, color: 'var(--ad-text-muted)' }}>
                      {importProgress.statusText}
                    </div>
                  )}
                </div>
              ) : importResultSummary ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ad-text-primary)' }}>
                    {importResultSummary.failed === 0
                      ? `Successfully saved ${importResultSummary.imported} files to Firebase Storage and Firestore.`
                      : `Finished with ${importResultSummary.imported} saved and ${importResultSummary.failed} failed.`}
                  </div>
                  {importResultSummary.errors && importResultSummary.errors.length > 0 && (
                    <div style={{ maxHeight: 120, overflowY: 'auto', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 8, fontSize: 12, color: '#ef4444' }}>
                      {importResultSummary.errors.map((err, i) => (
                        <div key={i} style={{ marginBottom: 4 }}>• {err}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => {
                        setImportingFiles(null)
                        setImportResultSummary(null)
                      }}
                    >
                      VIEW MEDIA LIBRARY
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 12, color: 'var(--ad-text-secondary)' }}>
                    Choose where to assign this batch, or leave unassigned to organize later.
                  </p>

                  <div className="admin-form-group">
                    <label className="admin-form-label">CATEGORY</label>
                    <select
                      className="admin-select"
                      value={importCategoryId}
                      onChange={(e) => setImportCategoryId(e.target.value)}
                    >
                      <option value="">-- UNASSIGNED --</option>
                      {categories.map((c: Category) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">WORK GROUP / SUBCATEGORY</label>
                    <select
                      className="admin-select"
                      value={importWorkGroupId}
                      onChange={(e) => setImportWorkGroupId(e.target.value)}
                    >
                      <option value="">-- NONE --</option>
                      {workGroups
                        .filter((wg: WorkGroupItem) => !importCategoryId || wg.categoryId === importCategoryId)
                        .map((wg: WorkGroupItem) => (
                          <option key={wg.id} value={wg.id}>{wg.name}</option>
                        ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => setImportingFiles(null)}
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={handleExecuteBatchImport}
                    >
                      IMPORT {importingFiles.files.length} FILES
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightweight Detail Panel */}
      {selectedAsset && (
        <div className="admin-modal-overlay" onClick={() => setSelectedAsset(null)}>
          <div className="admin-asset-detail-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-asset-detail-header">
              <span className="admin-asset-detail-title">{selectedAsset.filename}</span>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedAsset(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-asset-detail-body">
              <div className="admin-asset-detail-preview">
                {selectedAsset.type === 'image' ? (
                  <img src={selectedAsset.url} alt={selectedAsset.filename} />
                ) : selectedAsset.type === 'audio' ? (
                  <div className="admin-asset-preview-placeholder">
                    <FileAudio size={36} style={{ color: 'var(--ad-accent)', marginBottom: 8 }} />
                    <span>AUDIO ASSET</span>
                  </div>
                ) : (
                  <div className="admin-asset-preview-placeholder">
                    <span>{selectedAsset.type.toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="admin-asset-detail-meta">
                <div className="admin-meta-row">
                  <span className="admin-meta-key">TYPE</span>
                  <span className="admin-meta-val">{selectedAsset.type.toUpperCase()}</span>
                </div>
                <div className="admin-meta-row">
                  <span className="admin-meta-key">SOURCE</span>
                  <span className="admin-meta-val">{(selectedAsset as any).source || 'computer'}</span>
                </div>
                {selectedAsset.size && (
                  <div className="admin-meta-row">
                    <span className="admin-meta-key">FILE SIZE</span>
                    <span className="admin-meta-val">{selectedAsset.size}</span>
                  </div>
                )}
                {selectedAsset.url === activeBackgroundAudioUrl && (
                  <div className="admin-meta-row">
                    <span className="admin-meta-key">ROLE</span>
                    <span className="admin-meta-val" style={{ color: 'var(--ad-accent)', fontWeight: 700 }}>
                      ACTIVE BACKGROUND SOUND
                    </span>
                  </div>
                )}
                <div className="admin-meta-row">
                  <span className="admin-meta-key">URL</span>
                  <span className="admin-meta-val admin-meta-url">{selectedAsset.url}</span>
                </div>
              </div>
            </div>

            <div className="admin-asset-detail-actions">
              {selectedAsset.type === 'audio' && selectedAsset.url !== activeBackgroundAudioUrl && (
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => handleSetAsBackgroundSound(selectedAsset)}
                >
                  <Volume2 size={13} style={{ marginRight: 6 }} />
                  <span>SET AS BACKGROUND SOUND</span>
                </button>
              )}

              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => handleCopyUrl(selectedAsset.url)}
              >
                <Copy size={13} style={{ marginRight: 6 }} />
                <span>COPY URL</span>
              </button>

              <button
                type="button"
                className="admin-btn-secondary"
                onClick={(e) => handlePromptArchive(selectedAsset, e)}
              >
                <Archive size={13} style={{ marginRight: 6 }} />
                <span>ARCHIVE</span>
              </button>

              <button
                type="button"
                className="admin-btn-danger"
                onClick={(e) => handlePromptDelete(selectedAsset, e)}
              >
                <Trash2 size={13} style={{ marginRight: 6 }} />
                <span>DELETE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(assetToDelete)}
        title="DELETE THIS ASSET?"
        message={`"${assetToDelete?.filename}" will be removed from your media library.`}
        confirmLabel="DELETE"
        cancelLabel="CANCEL"
        danger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setAssetToDelete(null)}
      />

      {/* Bulk Action Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(bulkConfirmData)}
        title={bulkConfirmData?.title || 'CONFIRM ACTION'}
        message={bulkConfirmData?.message || ''}
        confirmLabel={bulkConfirmData?.confirmLabel || 'CONFIRM'}
        cancelLabel="CANCEL"
        danger={bulkConfirmData?.danger}
        onConfirm={() => bulkConfirmData?.onConfirm()}
        onCancel={() => setBulkConfirmData(null)}
      />

      {/* Bulk Move Modal */}
      <BulkMoveModal
        isOpen={isBulkMoveOpen}
        onClose={() => setIsBulkMoveOpen(false)}
        onConfirm={handleExecuteBulkMove}
        itemCount={selectedCount}
        entityType="media"
      />
    </div>
  )
}
