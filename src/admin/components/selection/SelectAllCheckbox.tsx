import React from 'react'
import { Check, Minus } from 'lucide-react'

export interface SelectAllCheckboxProps {
  isAllSelected: boolean
  isIndeterminate: boolean
  onToggleAll: () => void
  totalCount?: number
  selectedCount?: number
  label?: string
  className?: string
  disabled?: boolean
}

export default function SelectAllCheckbox({
  isAllSelected,
  isIndeterminate,
  onToggleAll,
  totalCount,
  selectedCount,
  label = 'SELECT ALL',
  className = '',
  disabled = false,
}: SelectAllCheckboxProps) {
  const isChecked = isAllSelected

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      onToggleAll()
    }
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? 'mixed' : isChecked}
      aria-label={`${label}${typeof totalCount === 'number' ? ` (${totalCount} items)` : ''}`}
      disabled={disabled || (typeof totalCount === 'number' && totalCount === 0)}
      tabIndex={0}
      onClick={onToggleAll}
      onKeyDown={handleKeyDown}
      className={`admin-select-all-btn ${isChecked || isIndeterminate ? 'is-active' : ''} ${className}`}
    >
      <span
        className={`admin-selection-checkbox is-sm ${isChecked ? 'is-checked' : ''} ${
          isIndeterminate ? 'is-indeterminate' : ''
        }`}
      >
        {isChecked && <Check size={10} strokeWidth={2.8} aria-hidden="true" />}
        {!isChecked && isIndeterminate && <Minus size={10} strokeWidth={2.8} aria-hidden="true" />}
      </span>
      <span className="admin-select-all-text">{label}</span>
      {typeof selectedCount === 'number' && selectedCount > 0 && typeof totalCount === 'number' && (
        <span className="admin-select-all-count">
          ({selectedCount}/{totalCount})
        </span>
      )}
    </button>
  )
}
