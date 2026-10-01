import { useState, useEffect } from 'react'
import { useContentStore, type StatItem, type StatsSectionData, normalizeStatsData } from '../../services/contentStore'
import { useToast } from '../components/toastContext'
import { Save, Edit3, X } from 'lucide-react'

export default function StatsSettingsPage() {
  const { toast } = useToast()
  const site = useContentStore((s) => s.site)
  const updateStatsSection = useContentStore((s) => s.updateStatsSection)

  const [formData, setFormData] = useState<StatsSectionData>(() =>
    normalizeStatsData(site.stats)
  )

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [editForm, setEditForm] = useState<{
    id: string
    label: string
    value: number
    prefix: string
    suffix: string
    description: string
  }>({
    id: '',
    label: '',
    value: 0,
    prefix: '',
    suffix: '',
    description: '',
  })

  useEffect(() => {
    if (site.stats) {
      setFormData(normalizeStatsData(site.stats))
    }
  }, [site.stats])

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      await updateStatsSection(formData)
      toast('EDITORIAL STATS SAVED TO FIRESTORE.')
    } catch (err: any) {
      toast(`FAILED TO SAVE: ${err?.message || err}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenEdit = (index: number) => {
    const item = formData.stats[index]
    setEditingIndex(index)
    setEditForm({
      id: item.id || `stat-${index}`,
      label: item.label || '',
      value: item.value ?? 0,
      prefix: item.prefix || '',
      suffix: item.suffix || '',
      description: item.description || '',
    })
    setModalOpen(true)
  }

  const handleSaveItem = () => {
    if (editingIndex === null) return
    if (!editForm.label.trim()) {
      toast('PLEASE ENTER A LABEL FOR THE STATISTIC.')
      return
    }

    const updatedItem: StatItem = {
      ...formData.stats[editingIndex],
      label: editForm.label.trim().toUpperCase(),
      value: typeof editForm.value === 'number' ? editForm.value : parseFloat(String(editForm.value)) || 0,
      prefix: editForm.prefix.trim(),
      suffix: editForm.suffix.trim(),
      description: editForm.description.trim(),
    }

    const nextStats = [...formData.stats]
    nextStats[editingIndex] = updatedItem

    const nextFormData = {
      ...formData,
      stats: nextStats,
    }

    setFormData(nextFormData)
    updateStatsSection(nextFormData)
    setModalOpen(false)
    toast('STATISTIC UPDATED & SYNCED.')
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-text">
          <h1 className="admin-page-heading">EDITORIAL STATS</h1>
          <p className="admin-page-description">
            Edit the 3 key numerical achievements and editorial statement displayed on the portfolio.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn-primary"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            <Save size={13} style={{ marginRight: 6 }} />
            <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
          </button>
        </div>
      </div>

      {/* Editorial Statement Card */}
      <div className="admin-card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 className="admin-form-section-title" style={{ marginBottom: 16 }}>
          EDITORIAL STATEMENT / QUOTE
        </h2>

        <div className="admin-form-group">
          <label className="admin-label">MAIN EDITORIAL STATEMENT</label>
          <textarea
            className="admin-textarea"
            rows={3}
            value={formData.statement?.heading || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                statement: {
                  ...(prev.statement || { heading: '', subheading: '', description: '' }),
                  heading: e.target.value,
                },
              }))
            }
            placeholder="I’VE BEEN FORTUNATE TO COLLABORATE WITH GLOBAL BRANDS, STUDIOS, AND VISIONARY TEAMS..."
          />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">SECONDARY SUB-STATEMENT (OPTIONAL)</label>
          <input
            type="text"
            className="admin-input"
            value={formData.statement?.subheading || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                statement: {
                  ...(prev.statement || { heading: '', subheading: '', description: '' }),
                  subheading: e.target.value,
                },
              }))
            }
            placeholder="EVERY PIECE CRAFTED WITH METICULOUS DETAIL AND DEDICATION."
          />
        </div>
      </div>

      {/* 3 Fixed Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {formData.stats.map((stat, index) => (
          <div
            key={stat.id || index}
            className="admin-card"
            style={{
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'var(--ad-orange)',
                  letterSpacing: '0.1em',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                METRIC 0{index + 1}
              </span>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8 }}>
                {stat.prefix && (
                  <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--ad-text-secondary)' }}>
                    {stat.prefix}
                  </span>
                )}
                <span style={{ fontSize: 40, fontWeight: 900, color: 'var(--ad-text-primary)', lineHeight: 1 }}>
                  {stat.value}
                </span>
                {stat.suffix && (
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--ad-orange)' }}>
                    {stat.suffix}
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                {stat.label}
              </h3>

              {stat.description && (
                <p style={{ fontSize: 12, color: 'var(--ad-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {stat.description}
                </p>
              )}
            </div>

            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => handleOpenEdit(index)}
              style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
            >
              <Edit3 size={13} style={{ marginRight: 6 }} />
              <span>EDIT METRIC</span>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Stat Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="admin-modal-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480 }}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">EDIT METRIC: {editForm.label || 'STAT'}</h3>
              <button
                type="button"
                className="admin-btn-icon"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="admin-label">PREFIX</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editForm.prefix}
                    onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value })}
                    placeholder="e.g. $"
                  />
                </div>
                <div>
                  <label className="admin-label">NUMBER / VALUE</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={editForm.value}
                    onChange={(e) => setEditForm({ ...editForm, value: parseFloat(e.target.value) || 0 })}
                    placeholder="8"
                    required
                  />
                </div>
                <div>
                  <label className="admin-label">SUFFIX</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editForm.suffix}
                    onChange={(e) => setEditForm({ ...editForm, suffix: e.target.value })}
                    placeholder="e.g. +"
                  />
                </div>
              </div>

              <div>
                <label className="admin-label">METRIC LABEL</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  placeholder="e.g. YEARS OF EXPERIENCE"
                  required
                />
              </div>

              <div>
                <label className="admin-label">DESCRIPTIVE SUB-NOTE</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="e.g. In digital illustration &amp; visual design"
                />
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={handleSaveItem}
              >
                <Save size={13} style={{ marginRight: 6 }} />
                <span>Save Metric</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
