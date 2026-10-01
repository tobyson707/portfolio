import React, { useState, useMemo } from 'react'
import {
  LayoutDashboard,
  BarChart3,
  Layers,
  Tags,
  PanelTop,
  User as UserIcon,
  Mail,
  Share2,
  Briefcase,
  TrendingUp,
  Settings,
  ExternalLink,
  Sun,
  Moon,
  Menu,
  X,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react'
import { useAdminRouter } from './routerContext'
import { useAuth } from './auth'
import { useContentStore } from '../services/contentStore'
import { useStore } from '../store'
import { executeRadialThemeToggle } from '../utils/themeTransition'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { currentPath, route, navigate } = useAdminRouter()
  const { signOut, user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const theme = useStore((s) => s.theme)

  const works = useContentStore((s) => s.works)
  const categories = useContentStore((s) => s.categories)
  const isFirebaseConnected = useContentStore((s) => s.isFirebaseConnected)
  const isSyncing = useContentStore((s) => s.isSyncing)
  const collectFromFirebase = useContentStore((s) => s.collectFromFirebase)
  const syncStatusMessage = useContentStore((s) => s.syncStatusMessage)

  const publishedWorksCount = works.filter((w) => w.status === 'published').length
  const categoriesCount = categories.filter((c) => c.status !== 'archived').length

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false)
    navigate(path)
  }

  // Derive dynamic page title for Top Bar
  const pageTitle = useMemo(() => {
    if (route.name === 'dashboard') return 'Dashboard'
    if (route.name === 'analytics') return 'Analytics'
    if (route.name === 'works-list') return 'Works'
    if (route.name === 'work-new') return 'New Work'
    if (route.name === 'work-edit') return 'Edit Work'
    if (route.name === 'categories') return 'Categories'
    if (route.name === 'media') return 'Media'
    if (route.name === 'archive') {
      const tabName = route.tab && route.tab !== 'all' ? ` / ${route.tab.toUpperCase()}` : ''
      return `Archive${tabName}`
    }
    if (route.name === 'settings') {
      const tabName = route.tab ? ` / ${route.tab.toUpperCase()}` : ''
      return `Settings${tabName}`
    }
    if (route.name === 'site') {
      const tabName = route.tab ? route.tab.charAt(0).toUpperCase() + route.tab.slice(1) : ''
      return tabName ? `Site / ${tabName}` : 'Site Settings'
    }
    if (route.name === 'resume') {
      return 'Site / Resume'
    }
    if (route.name === 'stats') {
      return 'Site / Stats'
    }
    return 'Studio'
  }, [route])

  const media = useContentStore((s) => s.media)

  const contentGroupNav = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      active: currentPath === '/admin/dashboard',
      badge: null,
      icon: <LayoutDashboard size={16} />,
    },
    {
      label: 'Works',
      path: '/admin/works',
      active: currentPath === '/admin/works' || currentPath.startsWith('/admin/works/'),
      badge: publishedWorksCount,
      icon: <Layers size={16} />,
    },
    {
      label: 'Categories',
      path: '/admin/categories',
      active: currentPath === '/admin/categories',
      badge: categoriesCount,
      icon: <Tags size={16} />,
    },
    {
      label: 'Assets',
      path: '/admin/assets',
      active: currentPath === '/admin/assets' || currentPath === '/admin/media',
      badge: media.length,
      icon: <ImageIcon size={16} />,
    },
  ]

  const siteGroupNav = [
    {
      label: 'Hero',
      path: '/admin/site/hero',
      active: currentPath === '/admin/site/hero' || (currentPath === '/admin/site' && (!route.name || (route as any).tab === 'hero')),
      icon: <PanelTop size={16} />,
    },
    {
      label: 'About',
      path: '/admin/site/about',
      active: currentPath === '/admin/site/about' || (currentPath === '/admin/site' && (route as any).tab === 'about'),
      icon: <UserIcon size={16} />,
    },
    {
      label: 'Resume',
      path: '/admin/resume',
      active: currentPath === '/admin/resume' || currentPath === '/admin/site/resume' || route.name === 'resume',
      icon: <Briefcase size={16} />,
    },
    {
      label: 'Stats',
      path: '/admin/stats',
      active: currentPath === '/admin/stats' || currentPath === '/admin/site/stats' || route.name === 'stats',
      icon: <TrendingUp size={16} />,
    },
    {
      label: 'Contact',
      path: '/admin/site/contact',
      active: currentPath === '/admin/site/contact' || (currentPath === '/admin/site' && (route as any).tab === 'contact'),
      icon: <Mail size={16} />,
    },
    {
      label: 'Social',
      path: '/admin/site/social',
      active: currentPath === '/admin/site/social' || (currentPath === '/admin/site' && (route as any).tab === 'social'),
      icon: <Share2 size={16} />,
    },
  ]

  const systemGroupNav = [
    {
      label: 'Analytics',
      path: '/admin/analytics',
      active: currentPath === '/admin/analytics',
      icon: <BarChart3 size={16} />,
    },
    {
      label: 'Settings',
      path: '/admin/settings',
      active: currentPath === '/admin/settings' || currentPath.startsWith('/admin/settings/'),
      icon: <Settings size={16} />,
    },
  ]

  const sidebarContent = (
    <div className="admin-sidebar-inner">
      {/* Brand Header */}
      <div className="admin-brand-header">
        <div className="admin-brand-wrap" onClick={() => handleNavClick('/admin/dashboard')}>
          <img src="/images/xp.png" alt="TOBI XP" className="admin-brand-logo" />
          <div className="admin-brand-info">
            <span className="admin-brand-name">TOBI XP</span>
            <span className="admin-brand-studio">STUDIO</span>
          </div>
        </div>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin Navigation">
        {/* CONTENT SECTION */}
        <div className="admin-nav-section">
          <div className="admin-nav-section-title">CONTENT</div>
          <ul className="admin-nav-list">
            {contentGroupNav.map((item) => (
              <li key={item.path}>
                <button
                  type="button"
                  className={`admin-nav-item ${item.active ? 'is-active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-icon">{item.icon}</span>
                    <span className="admin-nav-label">{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span className="admin-nav-badge">{item.badge}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* SITE SECTION */}
        <div className="admin-nav-section">
          <div className="admin-nav-section-title">SITE</div>
          <ul className="admin-nav-list">
            {siteGroupNav.map((item) => (
              <li key={item.path}>
                <button
                  type="button"
                  className={`admin-nav-item ${item.active ? 'is-active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-icon">{item.icon}</span>
                    <span className="admin-nav-label">{item.label}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* SYSTEM SECTION */}
        <div className="admin-nav-section">
          <div className="admin-nav-section-title">SYSTEM</div>
          <ul className="admin-nav-list">
            {systemGroupNav.map((item) => (
              <li key={item.path}>
                <button
                  type="button"
                  className={`admin-nav-item ${item.active ? 'is-active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                >
                  <div className="admin-nav-item-left">
                    <span className="admin-nav-icon">{item.icon}</span>
                    <span className="admin-nav-label">{item.label}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* BOTTOM UTILITY LINKS */}
      <div className="admin-sidebar-bottom">
        <div className="admin-sidebar-divider" />
        <ul className="admin-nav-list admin-bottom-list">
          <li>
            <button
              type="button"
              className="admin-nav-item admin-nav-linkout"
              onClick={() => navigate('/')}
            >
              <span className="admin-nav-label">VIEW PORTFOLIO</span>
              <ExternalLink size={13} className="admin-arrow-icon" />
            </button>
          </li>
          <li>
            <button
              type="button"
              className="admin-nav-item admin-nav-logout"
              onClick={handleLogout}
            >
              <span className="admin-nav-label">LOG OUT</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  )

  return (
    <div className="admin-shell">
      {/* Desktop Fixed Left Sidebar (240–260px) */}
      <aside className="admin-sidebar">{sidebarContent}</aside>

      {/* Content Viewport with Compact Top Bar */}
      <div className="admin-viewport">
        {/* Compact Top Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="admin-topbar-title">{pageTitle}</h2>
          </div>

          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-status-badge"
              onClick={() => collectFromFirebase()}
              title={syncStatusMessage || 'Connected to Firestore database. Click to refresh/collect data.'}
              style={{
                cursor: 'pointer',
                background: isFirebaseConnected ? 'rgba(46, 204, 113, 0.12)' : 'rgba(230, 126, 34, 0.12)',
                color: isFirebaseConnected ? '#27ae60' : 'var(--ad-orange)',
                borderColor: isFirebaseConnected ? 'rgba(46, 204, 113, 0.3)' : 'rgba(230, 126, 34, 0.3)',
              }}
            >
              {isSyncing ? (
                <RefreshCw size={12} className="animate-spin" style={{ marginRight: 5 }} />
              ) : (
                <span
                  className="admin-status-badge-dot"
                  style={{ background: isFirebaseConnected ? '#2ecc71' : '#e67e22' }}
                />
              )}
              {isSyncing ? 'SYNCING...' : isFirebaseConnected ? 'FIREBASE LIVE' : 'CONNECTING...'}
            </button>

            <button
              type="button"
              className="admin-topbar-btn"
              onClick={(e) => executeRadialThemeToggle(e)}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              className="admin-topbar-btn admin-topbar-site-btn"
              onClick={() => navigate('/')}
              title="Open public portfolio"
            >
              <span>VIEW SITE</span>
              <ExternalLink size={13} style={{ marginLeft: 4 }} />
            </button>

            <div className="admin-topbar-avatar" title={`Signed in as ${user?.email || 'TOBI XP'}`}>
              TXP
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="admin-main">{children}</main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="admin-mobile-drawer" onClick={() => setMobileMenuOpen(false)}>
          <div className="admin-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-drawer-head">
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ad-text-secondary)' }}>
                MENU
              </span>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </div>
  )
}
