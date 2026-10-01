import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, AlertTriangle, Info } from 'lucide-react'
import { ToastContext, type Toast } from './toastContext'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="admin-toast-container" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`admin-toast admin-toast-${t.type || 'success'}`}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {t.type === 'warning' ? (
                <AlertTriangle size={14} style={{ color: 'var(--ad-orange)', flexShrink: 0 }} />
              ) : t.type === 'info' ? (
                <Info size={14} style={{ color: 'var(--ad-accent)', flexShrink: 0 }} />
              ) : (
                <Check size={14} style={{ color: '#2ecc71', flexShrink: 0 }} />
              )}
              <span className="admin-toast-text">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
