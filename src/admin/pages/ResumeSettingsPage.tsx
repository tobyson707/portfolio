import { useState, useEffect } from 'react'
import { useContentStore, type SiteContentData } from '../../services/contentStore'
import { useToast } from '../components/toastContext'
import { Save, Edit3, X } from 'lucide-react'

export default function ResumeSettingsPage() {
  const { toast } = useToast()
  const site = useContentStore((s) => s.site)
  const updateSiteSection = useContentStore((s) => s.updateSiteSection)

  const [formData, setFormData] = useState<SiteContentData['resume']>(
    site.resume || {
      title: 'Résumé',
      entries: [],
    }
  )

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    id: '',
    period: '',
    place: '',
    role: '',
    pointsStr: '',
    visible: true,
  })

  useEffect(() => {
    if (site.resume) {
      setFormData(site.resume)
    }
  }, [site.resume])

  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      await updateSiteSection('resume', formData)
      toast('RÉSUMÉ CONTENT SAVED TO FIRESTORE.')
    } catch (err: any) {
      toast(`FAILED TO SAVE: ${err?.message || err}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenEdit = (index: number) => {
    const entry = formData.entries[index]
    setEditingIndex(index)
    setEditForm({
      id: entry.id || `res-${index}`,
      period: entry.period || '',
      place: entry.place || '',
      role: entry.role || '',
      pointsStr: Array.isArray(entry.points) ? entry.points.join('\n') : '',
      visible: entry.visible !== false,
    })
    setModalOpen(true)
  }

  const handleSaveEntry = () => {
    if (editingIndex === null) return
    if (!editForm.place.trim()) {
      toast('PLEASE ENTER A COMPANY / INSTITUTION.')
      return
    }

    const points = editForm.pointsStr
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean)

    const updatedEntry = {
      ...formData.entries[editingIndex],
      period: editForm.period.trim(),
      place: editForm.place.trim(),
      role: editForm.role.trim() || undefined,
      points: points.length > 0 ? points : [],
      visible: editForm.visible,
    }

    const nextEntries = [...formData.entries]
    nextEntries[editingIndex] = updatedEntry

    const updatedResume = {
      ...formData,
      entries: nextEntries,
    }

    setFormData(updatedResume)
    updateSiteSection('resume', updatedResume)
    setModalOpen(false)
    toast('RÉSUMÉ ENTRY UPDATED & SYNCED.')
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-text">
          <h1 className="admin-page-heading">RÉSUMÉ</h1>
          <p className="admin-page-description">
            Edit the timeline milestones, roles, and bullet points displayed in the 3D Résumé section.
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

      {/* Main Section Header Card */}
      <div className="admin-card" style={{ padding: 20, marginBottom: 20 }}>
        <label className="admin-label">SECTION TITLE</label>
        <input
          type="text"
          className="admin-input"
          value={formData.title || 'Résumé'}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Résumé"
        />
      </div>

      {/* Resume Entries List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {formData.entries.map((entry, index) => (
          <div
            key={entry.id || index}
            className="admin-card"
            style={{
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(241, 87, 35, 0.1)',
                  color: 'var(--ad-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                0{index + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ad-text-primary)' }}>
                    {entry.place}
                  </span>
                  {entry.role && (
                    <span style={{ fontSize: 12, color: 'var(--ad-orange)', fontWeight: 600 }}>
                      {entry.role}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--ad-text-secondary)', marginLeft: 'auto' }}>
                    {entry.period}
                  </span>
                </div>

                {entry.points && entry.points.length > 0 && (
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--ad-text-secondary)',
                      margin: '6px 0 0 0',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    • {entry.points[0]}
                    {entry.points.length > 1 && ` (+${entry.points.length - 1} more)`}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => handleOpenEdit(index)}
              style={{ padding: '6px 14px', fontSize: 12 }}
            >
              <Edit3 size={13} style={{ marginRight: 6 }} />
              <span>EDIT</span>
            </button>
          </div>
        ))}
      </div>

      {/* Edit Entry Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="admin-modal-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540 }}
          >
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">EDIT TIMELINE ENTRY</h3>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="admin-label">PERIOD / TIMELINE</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editForm.period}
                    onChange={(e) => setEditForm({ ...editForm, period: e.target.value })}
                    placeholder="e.g. 2023 – PRESENT"
                    required
                  />
                </div>

                <div>
                  <label className="admin-label">COMPANY / INSTITUTION</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editForm.place}
                    onChange={(e) => setEditForm({ ...editForm, place: e.target.value })}
                    placeholder="e.g. TOBI XP STUDIO"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="admin-label">ROLE / POSITION</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  placeholder="e.g. Lead Illustrator &amp; Visual Designer"
                />
              </div>

              <div>
                <label className="admin-label">BULLET POINTS &amp; ACCOMPLISHMENTS (ONE PER LINE)</label>
                <textarea
                  className="admin-textarea"
                  rows={5}
                  value={editForm.pointsStr}
                  onChange={(e) => setEditForm({ ...editForm, pointsStr: e.target.value })}
                  placeholder="Directed character design system&#10;Produced key visual assets for global clients"
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
                onClick={handleSaveEntry}
              >
                <Save size={13} style={{ marginRight: 6 }} />
                <span>Save Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
