import { useState } from 'react'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { useAdminRouter } from '../routerContext'

export default function LoginPage() {
  const { navigate } = useAdminRouter()
  const { signInWithGoogle, signInWithGoogleRedirect, authError } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isPopupBlocked, setIsPopupBlocked] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleGoogleSignIn = () => {
    setLocalError('')
    setIsPopupBlocked(false)
    setIsLoading(true)

    // Call directly in user-initiated event stack to keep browser gesture active
    signInWithGoogle()
      .then((res) => {
        if (res.success) {
          navigate('/admin/dashboard')
        } else if (res.code === 'auth/popup-blocked') {
          setIsPopupBlocked(true)
          setLocalError('')
        } else if (res.error) {
          setLocalError(res.error)
        }
      })
      .catch((err) => {
        if (err?.code === 'auth/popup-blocked') {
          setIsPopupBlocked(true)
          setLocalError('')
        } else {
          setLocalError('Google authentication failed. Please try again.')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const handleRedirectSignIn = async () => {
    setLocalError('')
    setIsRedirecting(true)
    try {
      await signInWithGoogleRedirect()
    } catch (err: any) {
      setIsRedirecting(false)
      setLocalError(err?.message || 'Redirect sign-in failed. Please try again.')
    }
  }

  const displayError = localError || authError

  return (
    <div className="admin-login-screen admin-login">
      {/* Return to Portfolio button positioned top-right */}
      <button
        type="button"
        className="admin-login-return-btn"
        onClick={() => navigate('/')}
        aria-label="Return to portfolio"
      >
        <span>Return to portfolio</span>
        <ExternalLink size={14} className="admin-return-arrow" aria-hidden="true" />
      </button>

      <div className="admin-login-container">
        {/* Top Branding */}
        <div className="admin-login-header">
          <img
            src="/images/xp.png"
            alt="TOBI XP Logo"
            className="admin-login-logo"
            loading="eager"
          />
          <h1 className="admin-login-brand-title">TOBI XP</h1>
          <span className="admin-login-brand-subtitle">ADMIN CONSOLE</span>
          <p className="admin-login-desc">
            Private workspace for TOBI XP.
          </p>
        </div>

        {/* Browser Pop-up Blocked Notification & Recovery Options */}
        {isPopupBlocked && (
          <div className="admin-popup-blocked-card" role="alert">
            <div className="admin-popup-blocked-head">
              <AlertTriangle size={18} className="admin-popup-icon" style={{ color: 'var(--ad-orange)' }} aria-hidden="true" />
              <strong>Pop-up blocked by browser</strong>
            </div>
            <p className="admin-popup-blocked-text">
              Your browser prevented the Google Sign-In pop-up from opening. You can allow pop-ups in your browser bar, or continue using full-page redirect:
            </p>
            <div className="admin-popup-blocked-actions">
              <button
                type="button"
                className="admin-btn-redirect"
                onClick={handleRedirectSignIn}
                disabled={isRedirecting}
              >
                <span>{isRedirecting ? 'REDIRECTING...' : 'CONTINUE WITH REDIRECT'}</span>
                <ExternalLink size={13} style={{ marginLeft: 6 }} />
              </button>
              <button
                type="button"
                className="admin-btn-retry-popup"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                Try pop-up again
              </button>
            </div>
          </div>
        )}

        {displayError && !isPopupBlocked && (
          <div className="admin-login-error" role="alert">
            {displayError}
          </div>
        )}

        {/* Minimal Google Authentication Card */}
        <div className="admin-login-card admin-login-google-card">
          <button
            type="button"
            className="admin-btn-google-primary"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isRedirecting}
          >
            <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.039l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
              />
            </svg>
            <span>{isLoading ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
