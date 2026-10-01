import type { User } from 'firebase/auth'

export interface AdminUser {
  uid: string
  email: string
  role: 'admin'
  createdAt?: any
  updatedAt?: any
}

export interface AuthContextType {
  user: User | null
  adminUser: AdminUser | null
  isAdmin: boolean
  loading: boolean
  isCheckingAdmin: boolean
  authError: string | null
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; code?: string }>
  signInWithGoogleRedirect: () => Promise<void>
  signOut: () => Promise<void>
}
