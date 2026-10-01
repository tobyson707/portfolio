import { useState, useMemo } from 'react'
import {
  ArrowRight,
  RefreshCw,
  Edit3,
  PanelTop,
  User as UserIcon,
  Briefcase,
  Layers,
  Mail,
  Share2,
  TrendingUp,
} from 'lucide-react'
import { useAdminRouter } from '../routerContext'
import { useContentStore, type Work } from '../../services/contentStore'
import { useToast } from '../components/toastContext'
import { getAnalyticsSummary } from '../../services/analytics'

export default function DashboardPage() {
  const { navigate } = useAdminRouter()
  const { toast } = useToast()
  const works = useContentStore((s) => s.works)
  const categories = useContentStore((s) => s.categories)
  const collectFromFirebase = useContentStore((s) => s.collectFromFirebase)
  const isSyncing = useContentStore((s) => s.isSyncing)
  const settings = useContentStore((s) => s.settings)
  const media = useContentStore((s) => s.media)

  const [trafficTimeframe, setTrafficTimeframe] = useState<'30d' | '7d'>('30d')

  // Real analytics summary
  const analyticsSummary = useMemo(() => {
    return getAnalyticsSummary(trafficTimeframe, undefined, settings.analytics?.measurementId)
  }, [trafficTimeframe, settings.analytics?.measurementId])

  const { hasData, overview, trafficSeries, topWorks } = analyticsSummary

  // Greeting based on client local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'GOOD MORNING, TOBI.'
    if (hour < 17) return 'GOOD AFTERNOON, TOBI.'
    return 'GOOD EVENING, TOBI.'
  }, [])

  const recentWorks = [...works]
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 6)

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId)
    return cat ? cat.name : catId.toUpperCase()
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent'
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'Recent'
    }
  }

  // Generate SVG path for dashboard traffic chart
  const seriesValues = trafficSeries.map((s) => s.views)
  const maxVal = Math.max(...seriesValues, 5)
  const minVal = 0

  const chartPoints = useMemo(() => {
    if (trafficSeries.length <= 1) return []
    const width = 800
    const height = 140
    const padding = 16

    return trafficSeries.map((item, idx) => {
      const val = item.views
      const x = padding + (idx / (trafficSeries.length - 1)) * (width - padding * 2)
      const y = height - padding - ((val - minVal) / (maxVal - minVal || 1)) * (height - padding * 2)
      return { x, y, item, val }
    })
  }, [trafficSeries, maxVal, minVal])

  const linePathD = useMemo(() => {
    if (chartPoints.length === 0) return ''
    return chartPoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`
    }, '')
  }, [chartPoints])

  const areaPathD = useMemo(() => {
    if (chartPoints.length === 0) return ''
    const firstX = chartPoints[0].x
    const lastX = chartPoints[chartPoints.length - 1].x
    const bottomY = 124
    return `${linePathD} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }, [chartPoints, linePathD])

  return (
    <div className="admin-page-container">
      {/* Dashboard Header */}
      <div className="admin-dash-header-row">
        <div className="admin-dash-greeting">
          <h1 className="admin-greeting-title">{greeting}</h1>
          <p className="admin-greeting-sub">TOBI XP CONTENT STUDIO · EDIT EXISTING PORTFOLIO CONTENT</p>
        </div>

        {/* Quick Actions Header Toolbar */}
        <div className="admin-quick-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/site/hero')}
          >
            <PanelTop size={13} style={{ marginRight: 6 }} />
            <span>EDIT HERO</span>
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/site/about')}
          >
            <UserIcon size={13} style={{ marginRight: 6 }} />
            <span>EDIT ABOUT</span>
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/works')}
          >
            <Layers size={13} style={{ marginRight: 6 }} />
            <span>EDIT WORKS</span>
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/site/contact')}
          >
            <Mail size={13} style={{ marginRight: 6 }} />
            <span>EDIT CONTACT</span>
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={async () => {
              try {
                await collectFromFirebase()
                toast('Successfully synced with Firebase Firestore!')
              } catch (err: any) {
                toast(err.message || 'Firebase sync failed')
              }
            }}
            title="Fetch latest content from Firebase Firestore"
          >
            {isSyncing ? (
              <RefreshCw size={13} className="animate-spin" style={{ marginRight: 6 }} />
            ) : (
              <RefreshCw size={13} style={{ marginRight: 6 }} />
            )}
            <span>{isSyncing ? 'SYNCING...' : 'SYNC FIRESTORE'}</span>
          </button>
        </div>
      </div>

      {/* Content Studio Overview Metrics Strip */}
      <div className="admin-stats-strip" style={{ marginBottom: 28 }}>
        <div className="admin-stat-block" onClick={() => navigate('/admin/works')} style={{ cursor: 'pointer' }}>
          <span className="admin-stat-label">WORKS</span>
          <span className="admin-stat-value">{works.length}</span>
          <span className="admin-stat-desc">EXISTING WORKS</span>
        </div>
        <div className="admin-stat-divider" />
        <div className="admin-stat-block" onClick={() => navigate('/admin/categories')} style={{ cursor: 'pointer' }}>
          <span className="admin-stat-label">CATEGORIES</span>
          <span className="admin-stat-value">{categories.length}</span>
          <span className="admin-stat-desc">FIXED TAXONOMY</span>
        </div>
        <div className="admin-stat-divider" />
        <div className="admin-stat-block" onClick={() => navigate('/admin/site/hero')} style={{ cursor: 'pointer' }}>
          <span className="admin-stat-label">SECTIONS</span>
          <span className="admin-stat-value">6</span>
          <span className="admin-stat-desc">EDITABLE SECTIONS</span>
        </div>
        <div className="admin-stat-divider" />
        <div className="admin-stat-block" onClick={() => navigate('/admin/assets')} style={{ cursor: 'pointer' }}>
          <span className="admin-stat-label">ASSETS</span>
          <span className="admin-stat-value">{media.length}</span>
          <span className="admin-stat-desc">STATIC WEBP</span>
        </div>
      </div>

      {/* INSIGHTS SECTION */}
      <section className="admin-dashboard-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-heading">INSIGHTS</h2>
            <span className="admin-section-subheading">Audience engagement and portfolio reach</span>
          </div>
          <button
            type="button"
            className="admin-section-link"
            onClick={() => navigate('/admin/analytics')}
          >
            <span>Full Analytics</span>
            <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </button>
        </div>

        <div className="admin-stats-strip">
          <div className="admin-stat-block">
            <span className="admin-stat-label">TOTAL VISITORS</span>
            <span className="admin-stat-value">
              {hasData ? overview.visitors.toLocaleString() : '—'}
            </span>
            <span className="admin-stat-desc">
              {hasData ? (
                <span className={`admin-metric-trend-inline ${overview.visitorsChange >= 0 ? 'is-up' : 'is-down'}`}>
                  {overview.visitorsChange >= 0 ? '+' : ''}
                  {overview.visitorsChange}% vs prev
                </span>
              ) : (
                'ACTIVE TRACKING'
              )}
            </span>
          </div>

          <div className="admin-stat-divider" aria-hidden="true" />

          <div className="admin-stat-block">
            <span className="admin-stat-label">TOTAL VIEWS</span>
            <span className="admin-stat-value">
              {hasData ? overview.views.toLocaleString() : '—'}
            </span>
            <span className="admin-stat-desc">
              {hasData ? (
                <span className={`admin-metric-trend-inline ${overview.viewsChange >= 0 ? 'is-up' : 'is-down'}`}>
                  {overview.viewsChange >= 0 ? '+' : ''}
                  {overview.viewsChange}% vs prev
                </span>
              ) : (
                'PORTFOLIO VIEWS'
              )}
            </span>
          </div>

          <div className="admin-stat-divider" aria-hidden="true" />

          <div className="admin-stat-block">
            <span className="admin-stat-label">SESSIONS</span>
            <span className="admin-stat-value">
              {hasData ? overview.sessions.toLocaleString() : '—'}
            </span>
            <span className="admin-stat-desc">
              {hasData ? (
                <span className={`admin-metric-trend-inline ${overview.sessionsChange >= 0 ? 'is-up' : 'is-down'}`}>
                  {overview.sessionsChange >= 0 ? '+' : ''}
                  {overview.sessionsChange}% vs prev
                </span>
              ) : (
                'ENGAGEMENT SESSIONS'
              )}
            </span>
          </div>

          <div className="admin-stat-divider" aria-hidden="true" />

          <div className="admin-stat-block">
            <span className="admin-stat-label">AVG ENGAGEMENT</span>
            <span className="admin-stat-value">
              {hasData ? overview.avgEngagementTime : '—'}
            </span>
            <span className="admin-stat-desc">
              {hasData ? (
                <span className={`admin-metric-trend-inline ${overview.avgEngagementChange >= 0 ? 'is-up' : 'is-down'}`}>
                  {overview.avgEngagementChange >= 0 ? '+' : ''}
                  {overview.avgEngagementChange}% duration
                </span>
              ) : (
                'TIME ON SITE'
              )}
            </span>
          </div>
        </div>
      </section>

      {/* TRAFFIC & TOP WORKS ROW */}
      <div className="admin-analytics-two-col" style={{ margin: '28px 0' }}>
        {/* TRAFFIC LINE CHART */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2 className="admin-card-title">TRAFFIC</h2>
              <span className="admin-card-subtitle">Portfolio views over time</span>
            </div>
            <div className="admin-select-timeframe-wrap">
              <select
                className="admin-select-compact"
                value={trafficTimeframe}
                onChange={(e) => setTrafficTimeframe(e.target.value as any)}
                aria-label="Traffic timeframe"
              >
                <option value="30d">30 DAYS</option>
                <option value="7d">7 DAYS</option>
              </select>
            </div>
          </div>

          <div className="admin-card-body" style={{ minHeight: 160, display: 'flex', alignItems: 'center' }}>
            {hasData && chartPoints.length > 1 ? (
              <div className="admin-svg-chart-container" style={{ width: '100%' }}>
                <svg viewBox="0 0 800 140" className="admin-traffic-chart-svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="dashTrafficGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--ad-orange)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--ad-orange)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={areaPathD} fill="url(#dashTrafficGrad)" />
                  <path
                    d={linePathD}
                    fill="none"
                    stroke="var(--ad-orange)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="admin-chart-axis-labels">
                  <span>{trafficSeries[0]?.displayDate || ''}</span>
                  <span>{trafficSeries[trafficSeries.length - 1]?.displayDate || ''}</span>
                </div>
              </div>
            ) : (
              <div className="admin-table-empty" style={{ width: '100%', padding: '36px 0' }}>
                <span>TRAFFIC DATA STREAMING</span>
              </div>
            )}
          </div>
        </div>

        {/* TOP WORKS */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2 className="admin-card-title">TOP WORKS</h2>
              <span className="admin-card-subtitle">Highest visitor engagement</span>
            </div>
            <button
              type="button"
              className="admin-card-link"
              onClick={() => navigate('/admin/analytics')}
            >
              <span>View details</span>
              <ArrowRight size={13} style={{ marginLeft: 4 }} />
            </button>
          </div>

          <div className="admin-card-body">
            {topWorks.length > 0 ? (
              <div className="admin-top-ranked-list">
                {topWorks.slice(0, 3).map((w, idx) => (
                  <div
                    key={w.workId}
                    className="admin-ranked-row"
                    onClick={() => navigate(`/admin/works/${w.workId}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/admin/works/${w.workId}`)
                    }}
                  >
                    <div className="admin-ranked-left">
                      <span className="admin-rank-badge">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="admin-ranked-name">{w.title}</span>
                    </div>
                    <div className="admin-ranked-right">
                      <span className="admin-ranked-views">{w.views.toLocaleString()}</span>
                      <span className="admin-ranked-unit">views</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-top-ranked-list">
                {works.slice(0, 3).map((w, idx) => (
                  <div
                    key={w.id}
                    className="admin-ranked-row"
                    onClick={() => navigate(`/admin/works/${w.id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="admin-ranked-left">
                      <span className="admin-rank-badge">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="admin-ranked-name">{w.title}</span>
                    </div>
                    <div className="admin-ranked-right">
                      <span className="admin-ranked-unit">{w.discipline || 'Work'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENTLY EDITED WORKS */}
      <section className="admin-recent-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-heading">RECENTLY EDITED</h2>
            <span className="admin-section-subheading">Select any work to edit its content and metadata</span>
          </div>
          <button
            type="button"
            className="admin-section-link"
            onClick={() => navigate('/admin/works')}
          >
            <span>All works</span>
            <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </button>
        </div>

        <div className="admin-recent-list">
          {recentWorks.map((work: Work) => (
            <div
              key={work.id}
              className="admin-work-row"
              onClick={() => navigate(`/admin/works/${work.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/admin/works/${work.id}`)
              }}
            >
              {/* Thumbnail */}
              <div className="admin-row-thumb-wrap">
                <img
                  src={work.coverImage || '/images/xp.png'}
                  alt={work.title}
                  className="admin-row-thumb"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/images/xp.png'
                  }}
                />
              </div>

              {/* Title */}
              <div className="admin-row-info">
                <span className="admin-row-title">{work.title}</span>
                {work.description && (
                  <span className="admin-row-sub">{work.description}</span>
                )}
              </div>

              {/* Category */}
              <div className="admin-row-category">
                <span className="admin-cat-label">{getCategoryName(work.categoryId)}</span>
              </div>

              {/* Date */}
              <div className="admin-row-date">
                <span>{formatDate(work.updatedAt || work.createdAt)}</span>
              </div>

              {/* Status Pill */}
              <div className="admin-row-status">
                <span className={`admin-status-pill admin-status-${work.status}`}>
                  {work.status.toUpperCase()}
                </span>
              </div>

              {/* Action button */}
              <div className="admin-row-action" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="admin-row-edit-btn"
                  onClick={() => navigate(`/admin/works/${work.id}`)}
                  aria-label={`Edit ${work.title}`}
                >
                  <Edit3 size={12} style={{ marginRight: 4 }} />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK ACTIONS FOOTER SECTION */}
      <section className="admin-dashboard-quick-footer" style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--ad-text-secondary)', marginBottom: 14 }}>
          EDIT SITE SECTIONS
        </h3>
        <div className="admin-quick-actions-bar">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/site/hero')}
          >
            <PanelTop size={13} style={{ marginRight: 6 }} />
            <span>HERO</span>
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/site/about')}
          >
            <UserIcon size={13} style={{ marginRight: 6 }} />
            <span>ABOUT</span>
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/resume')}
          >
            <Briefcase size={13} style={{ marginRight: 6 }} />
            <span>RESUME</span>
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/stats')}
          >
            <TrendingUp size={13} style={{ marginRight: 6 }} />
            <span>STATS</span>
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/site/contact')}
          >
            <Mail size={13} style={{ marginRight: 6 }} />
            <span>CONTACT</span>
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/site/social')}
          >
            <Share2 size={13} style={{ marginRight: 6 }} />
            <span>SOCIAL</span>
          </button>
        </div>
      </section>
    </div>
  )
}
