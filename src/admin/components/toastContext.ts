import { createContext, useContext } from 'react'

export interface Toast {
  id: string
  message: string
  type?: 'success' | 'info' | 'warning'
}

export interface ToastContextType {
  toast: (message: string, type?: 'success' | 'info' | 'warning') => void
}

export const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
