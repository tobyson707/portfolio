import { useEffect } from 'react'
import { AdminRouterProvider } from './AdminRouter'
import { useAdminRouter } from './routerContext'
import { AuthProvider, useAuth } from './auth'
import { ToastProvider } from './components/Toast'
import AdminLayout from './AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'
import WorksListPage from './pages/WorksListPage'
import WorkEditorPage from './pages/WorkEditorPage'
import CategoriesPage from './pages/CategoriesPage'
import AssetsPage from './pages/AssetsPage'
import SettingsPage from './pages/SettingsPage'
import SiteSettingsPage from './pages/SiteSettingsPage'
import ResumeSettingsPage from './pages/ResumeSettingsPage'
import StatsSettingsPage from './pages/StatsSettingsPage'
import './admin.css'

function AdminContentSwitcher() {
  const { route, navigate } = useAdminRouter()
  const { user, isAdmin, loading, isCheckingAdmin, signOut } = useAuth()

  // Route protection
  useEffect(() => {
    if (loading || isCheckingAdmin) return
    if (route.name === 'login' && user && isAdmin) {
      navigate('/admin/dashboard', { replace: true })
    } else if (route.name !== 'login' && !user) {
      navigate('/admin', { replace: true })
    }
  }, [route.name, user, isAdmin, loading, isCheckingAdmin, navigate])

  // Minimal TOBI XP Authentication Loading State (Section 9)
  if (loading || isCheckingAdmin) {
    return (
      <div className="admin-login-screen admin-auth-loading">
        <div className="admin-loading-card">
          <img
            src="/images/xp.png"
            alt="TOBI XP Logo"
            className="admin-login-logo"
            style={{ width: 84, height: 'auto', marginBottom: 14 }}
          />
          <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.04em', margin: '0 0 6px 0', textTransform: 'uppercase' }}>
            TOBI XP
          </h2>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ad-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Checking access...
          </span>
        </div>
      </div>
    )
  }

  // Not signed in
  if (!user || route.name === 'login') {
    return <LoginPage />
  }

  // Authenticated in Firebase, but not an authorized administrator
  if (!isAdmin) {
    return (
      <div className="admin-login-screen">
        <div className="admin-login-card" style={{ textAlign: 'center', maxWidth: 440 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--ad-danger)', marginBottom: 8 }}>
            ACCESS DENIED
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ad-text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
            This Google account (<strong>{user.email || 'Unknown'}</strong>) isn&apos;t authorized to access the TOBI XP Admin Console.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => signOut()}
            >
              Sign Out
            </button>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => navigate('/')}
            >
              Return to Portfolio
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Authorized Administrator: Render Dashboard & Content Editor views
  return (
    <AdminLayout>
      {route.name === 'dashboard' && <DashboardPage />}
      {route.name === 'analytics' && <AnalyticsPage />}
      {(route.name === 'works-list' || route.name === 'work-new') && <WorksListPage />}
      {route.name === 'work-edit' && <WorkEditorPage workId={route.id} />}
      {route.name === 'categories' && <CategoriesPage />}
      {(route.name === 'assets' || route.name === 'media' || (route as any).name === 'archive') && <AssetsPage />}
      {route.name === 'settings' && <SettingsPage initialTab={route.tab || 'general'} />}
      {route.name === 'site' && <SiteSettingsPage initialTab={route.tab || 'hero'} />}
      {route.name === 'resume' && <ResumeSettingsPage />}
      {route.name === 'stats' && <StatsSettingsPage />}
      {route.name === 'not-found' && (
        <div className="admin-empty-state" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>PAGE NOT FOUND</h2>
          <p style={{ color: 'var(--ad-text-secondary)', marginBottom: 20 }}>
            Nothing here yet. Let&apos;s head back.
          </p>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => navigate('/admin/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </AdminLayout>
  )
}

export default function AdminApp() {
  return (
    <div className="admin-root admin-app">
      <AuthProvider>
        <ToastProvider>
          <AdminRouterProvider>
            <AdminContentSwitcher />
          </AdminRouterProvider>
        </ToastProvider>
      </AuthProvider>
    </div>
  )
}
