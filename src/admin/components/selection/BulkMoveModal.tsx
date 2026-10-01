import React, { useState, useEffect } from 'react'
import { X, Move } from 'lucide-react'
import { useContentStore, type Category, type WorkGroupItem } from '../../../services/contentStore'

export interface BulkMoveModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (targetCategoryId: string, targetWorkGroupId?: string, discipline?: string) => void
  itemCount: number
  entityType: 'works' | 'workGroups' | 'media'
  initialCategoryId?: string
  initialWorkGroupId?: string
}

export default function BulkMoveModal({
  isOpen,
  onClose,
  onConfirm,
  itemCount,
  entityType,
  initialCategoryId,
  initialWorkGroupId,
}: BulkMoveModalProps) {
  const categories = useContentStore((s) => s.categories)
  const workGroups = useContentStore((s) => s.workGroups)

  const [selectedCatId, setSelectedCatId] = useState<string>('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      const defaultCat = initialCategoryId || categories[0]?.id || ''
      setSelectedCatId(defaultCat)
      setSelectedGroupId(initialWorkGroupId || '')
      setSelectedDiscipline('')
    }
  }, [isOpen, initialCategoryId, initialWorkGroupId, categories])

  if (!isOpen) return null

  const availableGroups = workGroups.filter((g) => g.categoryId === selectedCatId)

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCatId = e.target.value
    setSelectedCatId(newCatId)
    const matchingGroups = workGroups.filter((g) => g.categoryId === newCatId)
    if (matchingGroups.length > 0) {
      setSelectedGroupId(matchingGroups[0].id)
      if (matchingGroups[0].discipline) {
        setSelectedDiscipline(matchingGroups[0].discipline)
      }
    } else {
      setSelectedGroupId('')
      setSelectedDiscipline('')
    }
  }

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGrpId = e.target.value
    setSelectedGroupId(newGrpId)
    const matched = workGroups.find((g) => g.id === newGrpId)
    if (matched && matched.discipline) {
      setSelectedDiscipline(matched.discipline)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCatId) return
    onConfirm(selectedCatId, selectedGroupId || undefined, selectedDiscipline.trim() || undefined)
  }

  const entityName =
    entityType === 'works'
      ? itemCount > 1 ? 'WORKS' : 'WORK'
      : entityType === 'workGroups'
      ? itemCount > 1 ? 'SUBCATEGORIES' : 'SUBCATEGORY'
      : itemCount > 1 ? 'MEDIA ASSETS' : 'MEDIA ASSET'

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal-content"
        style={{ maxWidth: 480, width: '92vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Move size={15} style={{ color: 'var(--ad-accent, #F15723)' }} />
            <h3 className="admin-modal-title">
              MOVE {itemCount} {entityName}
            </h3>
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="admin-modal-body">
            <p style={{ fontSize: 13, color: 'var(--ad-text-secondary)', marginBottom: 16 }}>
              Choose the destination category and work group for the selected {itemCount} item{itemCount > 1 ? 's' : ''}.
            </p>

            <div className="admin-form-group">
              <label className="admin-label">DESTINATION CATEGORY *</label>
              <select
                className="admin-select"
                value={selectedCatId}
                onChange={handleCategoryChange}
                required
              >
                {categories.map((c: Category) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {entityType !== 'workGroups' && (
              <div className="admin-form-group">
                <label className="admin-label">DESTINATION SUBCATEGORY / WORK GROUP</label>
                <select
                  className="admin-select"
                  value={selectedGroupId}
                  onChange={handleGroupChange}
                >
                  <option value="">-- No Work Group --</option>
                  {availableGroups.map((g: WorkGroupItem) => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.discipline ? `(${g.discipline})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {entityType === 'works' && (
              <div className="admin-form-group">
                <label className="admin-label">DISCIPLINE (OPTIONAL)</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Illustration, Game · Web"
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="admin-modal-footer">
            <button type="button" className="admin-btn-secondary" onClick={onClose}>
              CANCEL
            </button>
            <button type="submit" className="admin-btn-primary">
              <Move size={12} style={{ marginRight: 6 }} />
              <span>MOVE {itemCount} {entityName}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
