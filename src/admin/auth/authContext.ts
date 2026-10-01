import { createContext } from 'react'
import type { AuthContextType } from './types'

export const AUTHORIZED_ADMIN_EMAILS = [
  'tobyson707@gmail.com',
  'jh204222@gmail.com',
]

export const AuthContext = createContext<AuthContextType | null>(null)
