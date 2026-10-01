import { useContext } from 'react'
import { AuthContext } from './authContext'
import type { AuthContextType } from './types'

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
