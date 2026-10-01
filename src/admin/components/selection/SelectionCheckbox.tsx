import React from 'react'
import { Check } from 'lucide-react'

export interface SelectionCheckboxProps {
  checked?: boolean
  isSelected?: boolean
  onChange?: (e: React.MouseEvent | React.KeyboardEvent) => void
  onToggle?: () => void
  ariaLabel?: string
  className?: string
  title?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export default function SelectionCheckbox({
  checked,
  isSelected,
  onChange,
  onToggle,
  ariaLabel = 'Select item',
  className = '',
  title = 'Select',
  disabled = false,
  size = 'md',
}: SelectionCheckboxProps) {
  const isActuallyChecked = checked !== undefined ? checked : Boolean(isSelected)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    if (onChange) onChange(e)
    if (onToggle) onToggle()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      if (onChange) onChange(e)
      if (onToggle) onToggle()
    }
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isActuallyChecked}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`admin-selection-checkbox ${size === 'sm' ? 'is-sm' : ''} ${isActuallyChecked ? 'is-checked' : ''} ${className}`}
    >
      {isActuallyChecked && <Check size={size === 'sm' ? 10 : 12} strokeWidth={2.8} aria-hidden="true" />}
    </button>
  )
}
