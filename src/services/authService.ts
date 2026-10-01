import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

class AuthService {
  public async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
      return { success: true }
    } catch (err: any) {
      console.error('[Auth] Google sign-in error:', err?.code || err)
      if (err?.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in window was closed before completing.' }
      }
      if (err?.code === 'auth/popup-blocked') {
        return { success: false, error: 'Sign-in pop-up was blocked by the browser. Please allow pop-ups.' }
      }
      return {
        success: false,
        error: err?.message?.replace('Firebase: ', '') || 'Google authentication failed.',
      }
    }
  }

  public async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth)
    } catch (e) {
      console.warn('[Auth] Sign-out note:', e)
    }
  }

  public getCurrentUser(): User | null {
    return auth.currentUser
  }

  public onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
  }
}

export const authService = new AuthService()
export { useAuth } from '../admin/auth/useAuth'
