import React from 'react'
import {
  X,
  Eye,
  EyeOff,
  Move,
  Archive,
  CopyPlus,
  Trash2,
  CheckSquare,
} from 'lucide-react'

export interface BulkActionBarProps {
  selectedCount: number
  onClear: () => void
  onSelectAll?: () => void
  isAllSelected?: boolean
  onHide?: () => void
  onUnhide?: () => void
  onMove?: () => void
  onArchive?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  entityLabel?: string
  className?: string
  customActions?: React.ReactNode
}

export default function BulkActionBar({
  selectedCount,
  onClear,
  onSelectAll,
  isAllSelected = false,
  onHide,
  onUnhide,
  onMove,
  onArchive,
  onDuplicate,
  onDelete,
  entityLabel = 'ITEM',
  className = '',
  customActions,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  const pluralLabel =
    selectedCount > 1
      ? entityLabel.endsWith('Y')
        ? `${entityLabel.slice(0, -1)}IES`
        : `${entityLabel}S`
      : entityLabel

  return (
    <div className={`admin-bulk-action-bar ${className}`} role="toolbar" aria-label="Bulk actions">
      <div className="admin-bulk-left">
        <span className="admin-bulk-count-badge">
          <strong>{selectedCount}</strong> {pluralLabel} SELECTED
        </span>

        {onSelectAll && (
          <button
            type="button"
            className="admin-bulk-mini-btn"
            onClick={onSelectAll}
            title={isAllSelected ? 'Deselect all' : 'Select all visible'}
          >
            <CheckSquare size={12} style={{ marginRight: 4 }} />
            <span>{isAllSelected ? 'DESELECT ALL' : 'SELECT ALL'}</span>
          </button>
        )}

        <button
          type="button"
          className="admin-bulk-mini-btn admin-bulk-clear-btn"
          onClick={onClear}
          title="Clear selection"
        >
          <X size={12} style={{ marginRight: 4 }} />
          <span>CLEAR</span>
        </button>
      </div>

      <div className="admin-bulk-actions">
        {onUnhide && (
          <button
            type="button"
            className="admin-bulk-btn"
            onClick={onUnhide}
            title="Make visible in portfolio"
          >
            <Eye size={12} style={{ marginRight: 4 }} />
            <span>UNHIDE</span>
          </button>
        )}

        {onHide && (
          <button
            type="button"
            className="admin-bulk-btn"
            onClick={onHide}
            title="Hide from public portfolio"
          >
            <EyeOff size={12} style={{ marginRight: 4 }} />
            <span>HIDE</span>
          </button>
        )}

        {onMove && (
          <button
            type="button"
            className="admin-bulk-btn"
            onClick={onMove}
            title="Move to category or subcategory"
          >
            <Move size={12} style={{ marginRight: 4 }} />
            <span>MOVE</span>
          </button>
        )}

        {onArchive && (
          <button
            type="button"
            className="admin-bulk-btn"
            onClick={onArchive}
            title="Archive selected items"
          >
            <Archive size={12} style={{ marginRight: 4 }} />
            <span>ARCHIVE</span>
          </button>
        )}

        {onDuplicate && (
          <button
            type="button"
            className="admin-bulk-btn"
            onClick={onDuplicate}
            title="Duplicate selected works"
          >
            <CopyPlus size={12} style={{ marginRight: 4 }} />
            <span>DUPLICATE</span>
          </button>
        )}

        {customActions}

        {onDelete && (
          <button
            type="button"
            className="admin-bulk-btn admin-bulk-btn-danger"
            onClick={onDelete}
            title="Permanently remove selected items"
          >
            <Trash2 size={12} style={{ marginRight: 4 }} />
            <span>DELETE</span>
          </button>
        )}
      </div>
    </div>
  )
}
