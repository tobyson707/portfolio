import React, { useState, useMemo } from 'react'
import { Search, Edit3, Eye, EyeOff, Layers } from 'lucide-react'
import { useAdminRouter } from '../routerContext'
import { useContentStore, type Work } from '../../services/contentStore'
import { useToast } from '../components/toastContext'

export default function WorksListPage() {
  const { navigate } = useAdminRouter()
  const { toast } = useToast()
  const works = useContentStore((s) => s.works)
  const categories = useContentStore((s) => s.categories)
  const updateWork = useContentStore((s) => s.updateWork)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'order' | 'title' | 'year' | 'updated'>('order')

  const filteredWorks = useMemo(() => {
    return works
      .filter((w) => {
        if (selectedCategory !== 'all' && w.categoryId !== selectedCategory) return false
        if (selectedStatus !== 'all' && w.status !== selectedStatus) return false
        if (search.trim()) {
          const q = search.toLowerCase()
          const matchTitle = w.title.toLowerCase().includes(q)
          const matchClient = w.client?.toLowerCase().includes(q)
          const matchDiscipline = w.discipline?.toLowerCase().includes(q)
          const matchTools = w.tools?.some((t) => t.toLowerCase().includes(q))
          if (!matchTitle && !matchClient && !matchDiscipline && !matchTools) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'order') return (a.order || 0) - (b.order || 0)
        if (sortBy === 'title') return a.title.localeCompare(b.title)
        if (sortBy === 'year') return Number(b.year || 0) - Number(a.year || 0)
        if (sortBy === 'updated') {
          return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        }
        return 0
      })
  }, [works, selectedCategory, selectedStatus, search, sortBy])

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId)
    return cat ? cat.name : catId.toUpperCase()
  }

  const handleToggleStatus = (work: Work, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextStatus = work.status === 'published' ? 'hidden' : 'published'
    updateWork(work.id, { status: nextStatus })
    toast(nextStatus === 'published' ? 'WORK PUBLISHED.' : 'WORK HIDDEN FROM PUBLIC PORTFOLIO.')
  }

  return (
    <div className="admin-page-container">
      {/* Works Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-text">
          <h1 className="admin-page-heading">WORKS</h1>
          <p className="admin-page-description">
            Edit the content currently displayed on the portfolio.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-filter-bar" style={{ marginBottom: 20 }}>
        {/* Search Input */}
        <div className="admin-search-input-wrap" style={{ flex: 1, minWidth: 260 }}>
          <Search size={14} className="admin-search-icon" />
          <input
            type="text"
            className="admin-input admin-search-input"
            placeholder="Search existing works by title, client, discipline, tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="admin-filter-group">
          <select
            className="admin-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">ALL CATEGORIES ({works.length})</option>
            {categories.map((c) => {
              const count = works.filter((w) => w.categoryId === c.id).length
              return (
                <option key={c.id} value={c.id}>
                  {c.name.toUpperCase()} ({count})
                </option>
              )
            })}
          </select>
        </div>

        {/* Status Filter */}
        <div className="admin-filter-group">
          <select
            className="admin-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">ALL STATUS</option>
            <option value="published">PUBLISHED</option>
            <option value="hidden">HIDDEN</option>
            <option value="draft">DRAFT</option>
          </select>
        </div>

        {/* Sort */}
        <div className="admin-filter-group">
          <select
            className="admin-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort works"
          >
            <option value="order">DEFAULT ORDER</option>
            <option value="title">TITLE (A–Z)</option>
            <option value="year">YEAR (NEWEST)</option>
            <option value="updated">RECENTLY UPDATED</option>
          </select>
        </div>
      </div>

      {/* Works List / Table */}
      {filteredWorks.length === 0 ? (
        <div className="admin-empty-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Layers size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p className="admin-empty-title">NO MATCHING WORKS FOUND</p>
          <span style={{ fontSize: 13, color: 'var(--ad-text-secondary)' }}>
            Try adjusting your search query or filters.
          </span>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>PREVIEW</th>
                <th>WORK TITLE</th>
                <th>CATEGORY</th>
                <th>DISCIPLINE</th>
                <th>TOOLS</th>
                <th>YEAR</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorks.map((work) => (
                <tr
                  key={work.id}
                  className="admin-table-row"
                  onClick={() => navigate(`/admin/works/${work.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Thumbnail */}
                  <td>
                    <div
                      style={{
                        width: 44,
                        height: 34,
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: '#16171a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={work.coverImage || '/images/xp.png'}
                        alt={work.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = '/images/xp.png'
                        }}
                      />
                    </div>
                  </td>

                  {/* Title & Description */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: 'var(--ad-text-primary)' }}>
                        {work.title}
                      </span>
                      {work.client && (
                        <span style={{ fontSize: 11, color: 'var(--ad-text-secondary)' }}>
                          Client: {work.client}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        color: 'var(--ad-orange)',
                      }}
                    >
                      {getCategoryName(work.categoryId)}
                    </span>
                  </td>

                  {/* Discipline */}
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--ad-text-secondary)' }}>
                      {work.discipline || work.projectType || '—'}
                    </span>
                  </td>

                  {/* Tools */}
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 180 }}>
                      {work.tools && work.tools.length > 0 ? (
                        work.tools.slice(0, 2).map((tool) => (
                          <span
                            key={tool}
                            style={{
                              fontSize: 10,
                              padding: '2px 6px',
                              borderRadius: 3,
                              background: 'var(--ad-surface)',
                              border: '1px solid var(--ad-border)',
                              color: 'var(--ad-text-secondary)',
                            }}
                          >
                            {tool}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--ad-text-secondary)' }}>—</span>
                      )}
                      {work.tools && work.tools.length > 2 && (
                        <span style={{ fontSize: 10, color: 'var(--ad-text-secondary)', alignSelf: 'center' }}>
                          +{work.tools.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Year */}
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--ad-text-secondary)' }}>
                      {work.year || '—'}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`admin-status-pill admin-status-${work.status}`}
                      onClick={(e) => handleToggleStatus(work, e)}
                      title="Click to toggle status"
                      style={{ cursor: 'pointer' }}
                    >
                      {work.status.toUpperCase()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div
                      style={{ display: 'inline-flex', gap: 6 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={(e) => handleToggleStatus(work, e)}
                        title={work.status === 'published' ? 'Hide from public portfolio' : 'Publish to portfolio'}
                        style={{ padding: '4px 8px' }}
                      >
                        {work.status === 'published' ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-primary"
                        onClick={() => navigate(`/admin/works/${work.id}`)}
                        style={{ padding: '4px 12px', fontSize: 11 }}
                      >
                        <Edit3 size={12} style={{ marginRight: 4 }} />
                        <span>EDIT</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
