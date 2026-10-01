import React, { useState, useMemo } from 'react'
import {
  RotateCcw,
  Trash2,
  Search,
  Layers,
  Tags,
  FolderTree,
  Image as ImageIcon,
  FileAudio,
  Film,
  Box,
  SlidersHorizontal,
} from 'lucide-react'
import {
  useContentStore,
  type Work,
  type Category,
  type WorkGroupItem,
  type MediaItem,
} from '../../services/contentStore'
import ConfirmModal from '../components/ConfirmModal'
import { useToast } from '../components/toastContext'
import {
  useSelection,
  SelectionCheckbox,
  SelectAllCheckbox,
  BulkActionBar,
} from '../components/selection'

export type ArchiveTab = 'all' | 'works' | 'categories' | 'subcategories' | 'media'

export interface ArchivedEntityItem {
  id: string
  uniqueKey: string
  title: string
  type: 'work' | 'category' | 'subcategory' | 'media'
  categoryName?: string
  subcategoryName?: string
  discipline?: string
  cover?: string
  mediaType?: 'image' | 'video' | '3d' | 'audio' | 'other'
  archivedAt?: string
  updatedAt?: string
  rawItem: Work | Category | WorkGroupItem | MediaItem
}

interface ArchivePageProps {
  initialTab?: ArchiveTab
}

export default function ArchivePage({ initialTab = 'all' }: ArchivePageProps) {
  const { toast } = useToast()

  const works = useContentStore((s) => s.works)
  const categories = useContentStore((s) => s.categories)
  const workGroups = useContentStore((s) => s.workGroups)
  const media = useContentStore((s) => s.media)

  const restoreWork = useContentStore((s) => s.restoreWork)
  const deleteWork = useContentStore((s) => s.deleteWork)
  const restoreCategory = useContentStore((s) => s.restoreCategory)
  const deleteCategory = useContentStore((s) => s.deleteCategory)
  const restoreWorkGroup = useContentStore((s) => s.restoreWorkGroup)
  const deleteWorkGroup = useContentStore((s) => s.deleteWorkGroup)
  const restoreMedia = useContentStore((s) => s.restoreMedia)
  const deleteMedia = useContentStore((s) => s.deleteMedia)

  const bulkRestoreMixed = useContentStore((s) => s.bulkRestoreMixed)
  const bulkDeleteMixed = useContentStore((s) => s.bulkDeleteMixed)

  const [activeTab, setActiveTab] = useState<ArchiveTab>(initialTab)
  const [search, setSearch] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all')

  const [confirmModalData, setConfirmModalData] = useState<{
    title: string
    message: string
    confirmLabel: string
    danger?: boolean
    onConfirm: () => void
  } | null>(null)

  // Map category ID to display name
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  // Map workGroup ID to display name
  const groupMap = useMemo(() => {
    const map = new Map<string, string>()
    workGroups.forEach((g) => map.set(g.id, g.name))
    return map
  }, [workGroups])

  // Aggregate all archived entities
  const allArchivedItems = useMemo<ArchivedEntityItem[]>(() => {
    const items: ArchivedEntityItem[] = []

    // 1. Archived Works
    works
      .filter((w) => w.status === 'archived')
      .forEach((w) => {
        items.push({
          id: w.id,
          uniqueKey: `work-${w.id}`,
          title: w.title,
          type: 'work',
          categoryName: categoryMap.get(w.categoryId) || 'Unassigned',
          subcategoryName: w.workGroupId ? groupMap.get(w.workGroupId) : undefined,
          discipline: w.discipline,
          cover: w.coverImage,
          archivedAt: w.archivedAt || w.updatedAt,
          updatedAt: w.updatedAt,
          rawItem: w,
        })
      })

    // 2. Archived Categories
    categories
      .filter((c) => c.status === 'archived')
      .forEach((c) => {
        items.push({
          id: c.id,
          uniqueKey: `cat-${c.id}`,
          title: c.name,
          type: 'category',
          cover: c.cover,
          archivedAt: c.archivedAt || c.updatedAt,
          updatedAt: c.updatedAt,
          rawItem: c,
        })
      })

    // 3. Archived Subcategories / WorkGroups
    workGroups
      .filter((g) => g.status === 'archived')
      .forEach((g) => {
        items.push({
          id: g.id,
          uniqueKey: `group-${g.id}`,
          title: g.name,
          type: 'subcategory',
          categoryName: categoryMap.get(g.categoryId) || 'Unassigned',
          discipline: g.discipline,
          cover: g.cover,
          archivedAt: g.archivedAt || g.updatedAt,
          updatedAt: g.updatedAt,
          rawItem: g,
        })
      })

    // 4. Archived Media
    media
      .filter((m) => m.status === 'archived')
      .forEach((m) => {
        items.push({
          id: m.id,
          uniqueKey: `media-${m.id}`,
          title: m.filename,
          type: 'media',
          mediaType: m.type,
          cover: m.type === 'image' ? m.url : undefined,
          categoryName: m.categoryId ? categoryMap.get(m.categoryId) : undefined,
          subcategoryName: m.workGroupId ? groupMap.get(m.workGroupId) : undefined,
          archivedAt: m.archivedAt || m.updatedAt || m.createdAt,
          updatedAt: m.updatedAt || m.createdAt,
          rawItem: m,
        })
      })

    return items
  }, [works, categories, workGroups, media, categoryMap, groupMap])

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: allArchivedItems.length,
      works: allArchivedItems.filter((i) => i.type === 'work').length,
      categories: allArchivedItems.filter((i) => i.type === 'category').length,
      subcategories: allArchivedItems.filter((i) => i.type === 'subcategory').length,
      media: allArchivedItems.filter((i) => i.type === 'media').length,
    }
  }, [allArchivedItems])

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return allArchivedItems.filter((item) => {
      // Tab filter
      if (activeTab === 'works' && item.type !== 'work') return false
      if (activeTab === 'categories' && item.type !== 'category') return false
      if (activeTab === 'subcategories' && item.type !== 'subcategory') return false
      if (activeTab === 'media' && item.type !== 'media') return false

      // Category dropdown filter
      if (selectedCategoryFilter !== 'all') {
        const catObj = categories.find((c) => c.id === selectedCategoryFilter)
        if (catObj && item.categoryName !== catObj.name) {
          return false
        }
      }

      // Date filter
      if (selectedDateFilter !== 'all' && item.archivedAt) {
        const itemTime = new Date(item.archivedAt).getTime()
        const now = Date.now()
        if (selectedDateFilter === 'today' && now - itemTime > 1000 * 60 * 60 * 24) return false
        if (selectedDateFilter === '7days' && now - itemTime > 1000 * 60 * 60 * 24 * 7) return false
        if (selectedDateFilter === '30days' && now - itemTime > 1000 * 60 * 60 * 24 * 30) return false
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchCat = item.categoryName?.toLowerCase().includes(q)
        const matchSub = item.subcategoryName?.toLowerCase().includes(q)
        const matchDisc = item.discipline?.toLowerCase().includes(q)
        const matchType = item.type.toLowerCase().includes(q)
        if (!matchTitle && !matchCat && !matchSub && !matchDisc && !matchType) return false
      }

      return true
    })
  }, [allArchivedItems, activeTab, selectedCategoryFilter, selectedDateFilter, search, categories])

  // Selection system using unique keys
  const {
    selectedArray,
    selectedCount,
    isSelected,
    toggle,
    selectAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
  } = useSelection({
    items: filteredItems.map((item) => ({ id: item.uniqueKey })),
  })

  // Selected item objects
  const selectedItems = useMemo(() => {
    const keySet = new Set(selectedArray)
    return filteredItems.filter((i) => keySet.has(i.uniqueKey))
  }, [selectedArray, filteredItems])

  // Single Restore
  const handleRestore = (item: ArchivedEntityItem) => {
    if (item.type === 'work') restoreWork(item.id)
    else if (item.type === 'category') restoreCategory(item.id)
    else if (item.type === 'subcategory') restoreWorkGroup(item.id)
    else if (item.type === 'media') restoreMedia(item.id)

    toast(`"${item.title.toUpperCase()}" RESTORED.`)
  }

  // Single Permanent Delete Prompt
  const handlePromptDelete = (item: ArchivedEntityItem) => {
    let warningMsg = `Are you sure you want to permanently delete "${item.title}"? This item will be permanently removed and cannot be restored.`
    if (item.type === 'category') {
      const childGroups = workGroups.filter((g) => g.categoryId === item.id)
      const childWorks = works.filter((w) => w.categoryId === item.id)
      if (childGroups.length > 0 || childWorks.length > 0) {
        warningMsg = `This category contains ${childGroups.length} subcategories and ${childWorks.length} works. Deleting it will permanently remove this category.`
      }
    }

    setConfirmModalData({
      title: 'DELETE PERMANENTLY?',
      message: warningMsg,
      confirmLabel: 'DELETE PERMANENTLY',
      danger: true,
      onConfirm: () => {
        if (item.type === 'work') deleteWork(item.id)
        else if (item.type === 'category') deleteCategory(item.id)
        else if (item.type === 'subcategory') deleteWorkGroup(item.id)
        else if (item.type === 'media') deleteMedia(item.id)

        setConfirmModalData(null)
        toast(`"${item.title.toUpperCase()}" PERMANENTLY DELETED.`)
      },
    })
  }

  // Bulk Restore
  const handleBulkRestore = () => {
    bulkRestoreMixed(selectedItems.map((i) => ({ id: i.id, type: i.type })))
    toast(`${selectedCount} ITEMS RESTORED.`)
    clearSelection()
  }

  // Bulk Permanent Delete
  const handleBulkDelete = () => {
    setConfirmModalData({
      title: `DELETE ${selectedCount} ITEMS PERMANENTLY?`,
      message: 'This action cannot be undone. The selected items will be permanently removed from all records.',
      confirmLabel: `DELETE ${selectedCount} ITEMS`,
      danger: true,
      onConfirm: () => {
        bulkDeleteMixed(selectedItems.map((i) => ({ id: i.id, type: i.type })))
        toast(`${selectedCount} ITEMS PERMANENTLY DELETED.`)
        clearSelection()
        setConfirmModalData(null)
      },
    })
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—'
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="admin-page-heading">ARCHIVE</h1>
            <span className="admin-badge admin-badge-orange">{counts.all} ARCHIVED</span>
          </div>
          <p className="admin-page-description">
            Archived categories, works, subcategories and media assets.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs-row" role="tablist">
        {[
          { id: 'all', label: 'ALL', count: counts.all, icon: null },
          { id: 'works', label: 'WORKS', count: counts.works, icon: <Layers size={13} /> },
          { id: 'categories', label: 'CATEGORIES', count: counts.categories, icon: <Tags size={13} /> },
          { id: 'subcategories', label: 'SUBCATEGORIES', count: counts.subcategories, icon: <FolderTree size={13} /> },
          { id: 'media', label: 'MEDIA', count: counts.media, icon: <ImageIcon size={13} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`admin-tab-item ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id as ArchiveTab)}
          >
            {tab.icon && (
              <span style={{ marginRight: 5, display: 'inline-flex', alignItems: 'center' }}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            <span className="admin-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="admin-toolbar" style={{ marginTop: 16 }}>
        <div className="admin-toolbar-left" style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div className="admin-search-wrap" style={{ minWidth: 260 }}>
            <Search size={14} className="admin-search-icon" />
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search archive by title, category, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: 160 }}>
            <select
              className="admin-select"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ minWidth: 140 }}>
            <select
              className="admin-select"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value as any)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Select All Checkbox */}
        <div className="admin-toolbar-right">
          {filteredItems.length > 0 && (
            <SelectAllCheckbox
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              totalCount={filteredItems.length}
              onToggleAll={selectAll}
            />
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        isAllSelected={isAllSelected}
        onClear={clearSelection}
        onSelectAll={selectAll}
        entityLabel="ITEM"
        customActions={
          <button
            type="button"
            className="admin-bulk-btn admin-bulk-btn-restore"
            onClick={handleBulkRestore}
            title="Restore selected items"
            style={{
              background: 'var(--ad-accent-subtle)',
              color: 'var(--ad-accent)',
              borderColor: 'var(--ad-accent-border)',
            }}
          >
            <RotateCcw size={12} style={{ marginRight: 4 }} />
            <span>RESTORE</span>
          </button>
        }
        onDelete={handleBulkDelete}
      />

      {/* Archived Items Grid / List */}
      {filteredItems.length > 0 ? (
        <div
          className="admin-archive-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
            marginTop: 16,
          }}
        >
          {filteredItems.map((item) => {
            const isItemSel = isSelected(item.uniqueKey)

            return (
              <div
                key={item.uniqueKey}
                className={`admin-archive-card ${isItemSel ? 'is-selected' : ''}`}
                style={{
                  background: 'var(--ad-surface)',
                  border: isItemSel
                    ? '1px solid var(--ad-accent)'
                    : '1px solid var(--ad-border)',
                  borderRadius: 'var(--ad-radius-md)',
                  padding: 16,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isItemSel ? '0 0 0 1px var(--ad-accent)' : 'none',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Top section with Checkbox, Thumbnail & Info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    {/* Checkbox */}
                    <div style={{ paddingTop: 2 }}>
                      <SelectionCheckbox
                        isSelected={isItemSel}
                        onToggle={() => toggle(item.uniqueKey)}
                        ariaLabel={`Select ${item.title}`}
                      />
                    </div>

                    {/* Thumbnail or Type Icon */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--ad-radius-sm)',
                        background: 'var(--ad-surface-hover)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid var(--ad-border)',
                      }}
                    >
                      {item.cover ? (
                        <img
                          src={item.cover}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : item.type === 'media' && item.mediaType === 'audio' ? (
                        <FileAudio size={20} style={{ color: 'var(--ad-accent)' }} />
                      ) : item.type === 'media' && item.mediaType === 'video' ? (
                        <Film size={20} style={{ color: 'var(--ad-text-secondary)' }} />
                      ) : item.type === 'media' && item.mediaType === '3d' ? (
                        <Box size={20} style={{ color: 'var(--ad-text-secondary)' }} />
                      ) : item.type === 'category' ? (
                        <Tags size={20} style={{ color: 'var(--ad-text-secondary)' }} />
                      ) : item.type === 'subcategory' ? (
                        <FolderTree size={20} style={{ color: 'var(--ad-text-secondary)' }} />
                      ) : (
                        <Layers size={20} style={{ color: 'var(--ad-text-secondary)' }} />
                      )}
                    </div>

                    {/* Meta info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.title}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--ad-text-secondary)',
                          marginTop: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span className="admin-badge" style={{ fontSize: 9, padding: '2px 5px' }}>
                          {item.type.toUpperCase()}
                        </span>

                        {item.categoryName && <span>{item.categoryName}</span>}
                        {item.subcategoryName && (
                          <>
                            <span>/</span>
                            <span>{item.subcategoryName}</span>
                          </>
                        )}
                        {item.discipline && (
                          <span
                            className="admin-badge admin-badge-orange"
                            style={{ fontSize: 9, padding: '1px 4px' }}
                          >
                            {item.discipline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date Metadata */}
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--ad-text-muted)',
                      padding: '8px 0',
                      borderTop: '1px solid var(--ad-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Archived {formatDate(item.archivedAt)}</span>
                    <span className="admin-badge" style={{ fontSize: 9 }}>
                      ARCHIVED
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 8,
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid var(--ad-border)',
                  }}
                >
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    style={{
                      fontSize: 11,
                      padding: '5px 10px',
                      color: 'var(--ad-accent)',
                      borderColor: 'var(--ad-accent-border)',
                    }}
                    onClick={() => handleRestore(item)}
                    title="Restore item to active portfolio state"
                  >
                    <RotateCcw size={11} style={{ marginRight: 4 }} />
                    RESTORE
                  </button>

                  <button
                    type="button"
                    className="admin-btn-secondary admin-action-btn-danger"
                    style={{ fontSize: 11, padding: '5px 10px' }}
                    onClick={() => handlePromptDelete(item)}
                    title="Permanently remove item"
                  >
                    <Trash2 size={11} style={{ marginRight: 4 }} />
                    DELETE
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          className="admin-empty-state"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: 'var(--ad-surface)',
            border: '1px dashed var(--ad-border)',
            borderRadius: 'var(--ad-radius-lg)',
            marginTop: 20,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--ad-surface-hover)',
              color: 'var(--ad-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
            }}
          >
            <SlidersHorizontal size={22} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>ARCHIVE IS EMPTY</h3>
          <p style={{ fontSize: 12, color: 'var(--ad-text-secondary)', maxWidth: 360, margin: '0 auto' }}>
            {search.trim() || selectedCategoryFilter !== 'all' || selectedDateFilter !== 'all'
              ? 'No archived items match your current search and filter criteria.'
              : 'There are no archived works, categories, subcategories, or media assets.'}
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalData && (
        <ConfirmModal
          isOpen={true}
          title={confirmModalData.title}
          message={confirmModalData.message}
          confirmLabel={confirmModalData.confirmLabel}
          danger={confirmModalData.danger}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setConfirmModalData(null)}
        />
      )}
    </div>
  )
}
