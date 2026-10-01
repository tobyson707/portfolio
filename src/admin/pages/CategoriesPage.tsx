import React, { useState } from 'react'
import {
  Edit3,
  X,
  Save,
} from 'lucide-react'
import {
  useContentStore,
  type Category,
} from '../../services/contentStore'
import { useToast } from '../components/toastContext'

export default function CategoriesPage() {
  const { toast } = useToast()

  const categories = useContentStore((s) => s.categories)
  const works = useContentStore((s) => s.works)
  const updateCategory = useContentStore((s) => s.updateCategory)

  // Category Edit Modal state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryTagline, setCategoryTagline] = useState('')
  const [categoryDesc, setCategoryDesc] = useState('')
  const [categoryTools, setCategoryTools] = useState('')
  const [categoryAwards, setCategoryAwards] = useState('')
  const [categoryFooter, setCategoryFooter] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat)
    setCategoryName(cat.name)
    setCategoryTagline(cat.tagline || '')
    setCategoryDesc(cat.description || '')
    setCategoryTools(Array.isArray(cat.tools) ? cat.tools.join(', ') : '')
    setCategoryAwards(Array.isArray(cat.awards) ? cat.awards.join('\n') : '')
    setCategoryFooter(cat.footer || '')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    if (!categoryName.trim()) {
      toast('PLEASE ENTER A CATEGORY NAME.')
      return
    }

    const toolsArr = categoryTools
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const awardsArr = categoryAwards
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean)

    setIsSaving(true)
    try {
      await updateCategory(editingCategory.id, {
        name: categoryName.trim(),
        tagline: categoryTagline.trim(),
        description: categoryDesc.trim(),
        tools: toolsArr,
        awards: awardsArr,
        footer: categoryFooter.trim(),
      })

      toast('CATEGORY CONTENT SAVED TO FIRESTORE.')
      setEditingCategory(null)
    } catch (err: any) {
      console.error('[CategoriesPage] Save error:', err)
      toast(`FAILED TO SAVE: ${err?.message || err}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-text">
          <h1 className="admin-page-heading">CATEGORIES</h1>
          <p className="admin-page-description">
            Edit the category names, taglines, and editorial descriptions displayed across the portfolio.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20,
        }}
      >
        {categories.map((cat, idx) => {
          const catWorks = works.filter((w) => w.categoryId === cat.id)
          const publishedWorks = catWorks.filter((w) => w.status === 'published')

          return (
            <div
              key={cat.id}
              className="admin-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Category Header Preview */}
              <div
                style={{
                  height: 120,
                  background: '#131417',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={cat.cover || cat.imageUrl || `/images/categories/${cat.slug || 'illustrations'}.webp`}
                  alt={cat.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.6,
                  }}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/images/xp.png'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(0,0,0,0.7)',
                      color: 'var(--ad-orange)',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 3,
                      letterSpacing: '0.06em',
                    }}
                  >
                    SECTION {cat.no || String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Body Info */}
              <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>
                    {cat.name}
                  </h3>
                  <span style={{ fontSize: 11, color: 'var(--ad-text-secondary)' }}>
                    {publishedWorks.length} {publishedWorks.length === 1 ? 'work' : 'works'}
                  </span>
                </div>

                {cat.tagline && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--ad-orange)',
                      marginBottom: 8,
                      display: 'block',
                    }}
                  >
                    {cat.tagline}
                  </span>
                )}

                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--ad-text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: 16,
                    flex: 1,
                  }}
                >
                  {cat.description || 'No editorial description provided for this category section.'}
                </p>

                {/* Tools */}
                {cat.tools && cat.tools.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
                    {cat.tools.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 3,
                          background: 'var(--ad-surface)',
                          border: '1px solid var(--ad-border)',
                          color: 'var(--ad-text-secondary)',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                    {cat.tools.length > 3 && (
                      <span style={{ fontSize: 10, color: 'var(--ad-text-secondary)', alignSelf: 'center' }}>
                        +{cat.tools.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Edit Button */}
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => handleOpenEdit(cat)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Edit3 size={13} style={{ marginRight: 6 }} />
                  <span>EDIT CATEGORY</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="admin-modal-backdrop" onClick={() => setEditingCategory(null)}>
          <div
            className="admin-modal-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560 }}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">EDIT CATEGORY: {editingCategory.name}</h3>
              <button
                type="button"
                className="admin-btn-icon"
                onClick={() => setEditingCategory(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="admin-label">CATEGORY DISPLAY NAME</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. ILLUSTRATIONS"
                    required
                  />
                </div>

                <div>
                  <label className="admin-label">TAGLINE / SUB-HEADER</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={categoryTagline}
                    onChange={(e) => setCategoryTagline(e.target.value)}
                    placeholder="e.g. VISUAL EXPLORATION & STORYTELLING"
                  />
                </div>

                <div>
                  <label className="admin-label">EDITORIAL DESCRIPTION</label>
                  <textarea
                    className="admin-textarea"
                    rows={4}
                    value={categoryDesc}
                    onChange={(e) => setCategoryDesc(e.target.value)}
                    placeholder="Describe the discipline, aesthetic focus, and scope of this collection..."
                  />
                </div>

                <div>
                  <label className="admin-label">PRIMARY TOOLS / MEDIUMS (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={categoryTools}
                    onChange={(e) => setCategoryTools(e.target.value)}
                    placeholder="e.g. Procreate, Photoshop, Blender"
                  />
                </div>

                <div>
                  <label className="admin-label">AWARDS &amp; RECOGNITION (ONE PER LINE)</label>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    value={categoryAwards}
                    onChange={(e) => setCategoryAwards(e.target.value)}
                    placeholder="e.g. Behance Featured 2024&#10;Tokyo Illustration Award"
                  />
                </div>

                <div>
                  <label className="admin-label">FOOTER / CLOSING NOTE</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={categoryFooter}
                    onChange={(e) => setCategoryFooter(e.target.value)}
                    placeholder="e.g. Available for select commissions &amp; contracts"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setEditingCategory(null)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={isSaving}
                >
                  <Save size={13} style={{ marginRight: 6 }} />
                  <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
