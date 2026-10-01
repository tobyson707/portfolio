import React, { useEffect, useState, useMemo } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { seedFirestoreIfEmpty, collectDataFromFirebase } from '../../services/firestoreSync'
import type { AuthContextType, AdminUser } from './types'
import { AuthContext, AUTHORIZED_ADMIN_EMAILS } from './authContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState<boolean>(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Handle redirect result if user used signInWithRedirect
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('[Auth] Successfully authenticated via redirect')
        }
      })
      .catch((err) => {
        console.warn('[Auth] Redirect sign-in note:', err?.code || err)
      })
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setAdminUser(null)
        setIsAdmin(false)
        setIsCheckingAdmin(false)
        setLoading(false)
        return
      }

      setUser(firebaseUser)
      setIsCheckingAdmin(true)
      const userEmail = (firebaseUser.email || '').toLowerCase().trim()
      const isConfiguredAdminEmail = AUTHORIZED_ADMIN_EMAILS.some(
        (adminEmail) => adminEmail.toLowerCase().trim() === userEmail
      )

      try {
        const adminDocRef = doc(db, 'admins', firebaseUser.uid)
        const adminDocSnap = await getDoc(adminDocRef)

        if (adminDocSnap.exists() && adminDocSnap.data()?.role === 'admin') {
          setAdminUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'admin',
            ...adminDocSnap.data(),
          })
          setIsAdmin(true)
          setAuthError(null)
        } else if (isConfiguredAdminEmail) {
          // Provision or sync the admin record in Firestore for the authorized administrator
          try {
            await setDoc(
              adminDocRef,
              {
                email: firebaseUser.email,
                role: 'admin',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            )
          } catch (writeErr) {
            console.warn('[Auth] Setting admin document note:', writeErr)
          }

          setAdminUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'admin',
          })
          setIsAdmin(true)
          setAuthError(null)
        } else {
          // Unauthorized Google Account
          console.warn(`[Auth] Unauthorized Google account signed in: ${userEmail}`)
          setAdminUser(null)
          setIsAdmin(false)
          setAuthError("This Google account isn't authorized to access the TOBI XP Admin Console.")
          try {
            await firebaseSignOut(auth)
          } catch {
            // ignore sign-out error
          }
          setUser(null)
        }
      } catch (err) {
        console.warn('[Auth] Error verifying admin authorization in Firestore:', err)
        if (isConfiguredAdminEmail) {
          setAdminUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: 'admin',
          })
          setIsAdmin(true)
          setAuthError(null)
        } else {
          setAdminUser(null)
          setIsAdmin(false)
          setAuthError("This Google account isn't authorized to access the TOBI XP Admin Console.")
          try {
            await firebaseSignOut(auth)
          } catch {
            // ignore sign-out error
          }
          setUser(null)
        }
      } finally {
        setIsCheckingAdmin(false)
        setLoading(false)
      }

      // If authorized admin, trigger initial data sync
      if (isConfiguredAdminEmail) {
        try {
          await seedFirestoreIfEmpty()
          await collectDataFromFirebase()
        } catch (syncErr) {
          console.warn('[Auth] Background sync error:', syncErr)
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // Call signInWithPopup SYNCHRONOUSLY to preserve the user's click activation gesture
  const signInWithGoogle = (): Promise<{ success: boolean; error?: string; code?: string }> => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    // Execute directly in current call stack
    return signInWithPopup(auth, provider)
      .then(async (result) => {
        const firebaseUser = result.user
        const userEmail = (firebaseUser.email || '').toLowerCase().trim()

        const isConfiguredAdmin = AUTHORIZED_ADMIN_EMAILS.some(
          (a) => a.toLowerCase().trim() === userEmail
        )

        let isFirestoreAdmin = false
        try {
          const adminDocRef = doc(db, 'admins', firebaseUser.uid)
          const adminDocSnap = await getDoc(adminDocRef)

          if (adminDocSnap.exists() && adminDocSnap.data()?.role === 'admin') {
            isFirestoreAdmin = true
          } else if (isConfiguredAdmin) {
            await setDoc(
              adminDocRef,
              {
                email: firebaseUser.email,
                role: 'admin',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            )
            isFirestoreAdmin = true
          }
        } catch (dbErr) {
          console.warn('[Auth] Checking admin doc in Firestore:', dbErr)
          if (isConfiguredAdmin) {
            isFirestoreAdmin = true
          }
        }

        if (!isConfiguredAdmin && !isFirestoreAdmin) {
          try {
            await firebaseSignOut(auth)
          } catch {
            // ignore
          }
          setUser(null)
          setIsAdmin(false)
          setAdminUser(null)
          const deniedMsg = "This Google account isn't authorized to access the TOBI XP Admin Console."
          setAuthError(deniedMsg)
          return { success: false, error: deniedMsg, code: 'auth/unauthorized' }
        }

        setAuthError(null)
        return { success: true }
      })
      .catch((err: any) => {
        console.error('[Auth] Google sign-in error:', err?.code || err)
        if (err?.code === 'auth/popup-closed-by-user') {
          const msg = 'Sign-in window was closed before completing.'
          setAuthError(msg)
          return { success: false, error: msg, code: err.code }
        }
        if (err?.code === 'auth/popup-blocked') {
          const msg = 'Pop-up was blocked by your browser. Please allow pop-ups for this site, or continue using redirect.'
          setAuthError(msg)
          return { success: false, error: msg, code: err.code }
        }
        if (err?.code === 'auth/network-request-failed') {
          const msg = 'Network error. Please check your internet connection.'
          setAuthError(msg)
          return { success: false, error: msg, code: err.code }
        }
        if (err?.code === 'auth/account-exists-with-different-credential') {
          const msg = 'An account already exists with a different credential.'
          setAuthError(msg)
          return { success: false, error: msg, code: err.code }
        }
        if (err?.code === 'auth/unauthorized-domain') {
          const msg = 'This domain is not authorized in the Firebase Console. Please add this domain under Firebase Authentication > Settings > Authorized domains.'
          setAuthError(msg)
          return { success: false, error: msg, code: err.code }
        }
        if (err?.code === 'auth/cancelled-popup-request') {
          return { success: false, code: err.code }
        }

        const message = err?.message?.replace('Firebase: ', '') || 'Google authentication failed. Please try again.'
        setAuthError(message)
        return { success: false, error: message, code: err?.code }
      })
  }

  // Full page redirect option as a resilient fallback if popups remain blocked
  const signInWithGoogleRedirect = async (): Promise<void> => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await signInWithRedirect(auth, provider)
  }

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth)
    } catch (err) {
      console.warn('[Auth] Error signing out from Firebase:', err)
    } finally {
      setUser(null)
      setAdminUser(null)
      setIsAdmin(false)
      setAuthError(null)
    }
  }

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      adminUser,
      isAdmin,
      loading,
      isCheckingAdmin,
      authError,
      signInWithGoogle,
      signInWithGoogleRedirect,
      signOut,
    }),
    [user, adminUser, isAdmin, loading, isCheckingAdmin, authError]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
