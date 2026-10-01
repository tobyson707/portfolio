import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, X, Check } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  requireConfirmationText?: string
  confirmationPrompt?: string
  helperText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  danger = true,
  requireConfirmationText,
  confirmationPrompt,
  helperText,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [typedText, setTypedText] = useState('')

  useEffect(() => {
    if (isOpen) {
      setTypedText('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const isMatch =
    !requireConfirmationText ||
    typedText.trim().toUpperCase() === requireConfirmationText.toUpperCase()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isMatch) {
      e.preventDefault()
      onConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <AnimatePresence>
      <div className="admin-modal-overlay" onClick={onCancel}>
        <motion.div
          className="admin-confirm-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="admin-confirm-header">
            <h3 className="admin-confirm-title">{title}</h3>
          </div>

          <p className="admin-confirm-message">{message}</p>

          {helperText && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--ad-text-secondary)',
                marginTop: -12,
                marginBottom: 16,
                padding: '8px 12px',
                background: 'var(--ad-surface-hover)',
                borderRadius: 'var(--ad-radius-sm)',
                border: '1px solid var(--ad-border)',
                lineHeight: 1.4,
              }}
            >
              {helperText}
            </div>
          )}

          {requireConfirmationText && (
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--ad-text-primary)',
                  marginBottom: 6,
                  letterSpacing: '0.04em',
                }}
              >
                {confirmationPrompt || (
                  <>
                    Type <strong style={{ color: danger ? 'var(--ad-danger)' : 'var(--ad-text-primary)' }}>{requireConfirmationText}</strong> to confirm:
                  </>
                )}
              </label>
              <input
                type="text"
                className="admin-input"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={requireConfirmationText}
                autoFocus
                style={{
                  width: '100%',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  fontSize: 13,
                  borderColor: isMatch && typedText ? (danger ? 'var(--ad-danger)' : 'var(--ad-border-strong)') : undefined,
                }}
              />
            </div>
          )}

          <div className="admin-confirm-actions">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={onCancel}
            >
              <X size={13} style={{ marginRight: 6 }} />
              <span>{cancelLabel}</span>
            </button>
            <button
              type="button"
              className={danger ? 'admin-btn-danger' : 'admin-btn-primary'}
              onClick={() => {
                if (isMatch) onConfirm()
              }}
              disabled={!isMatch}
              style={{
                opacity: isMatch ? 1 : 0.45,
                cursor: isMatch ? 'pointer' : 'not-allowed',
                pointerEvents: isMatch ? 'auto' : 'none',
              }}
            >
              {danger ? (
                <Trash2 size={13} style={{ marginRight: 6 }} />
              ) : (
                <Check size={13} style={{ marginRight: 6 }} />
              )}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

