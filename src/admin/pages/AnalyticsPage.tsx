import { useState, useMemo, useEffect } from 'react'
import {
  Users,
  Eye,
  Clock,
  Activity,
  Layers,
  TrendingUp,
  TrendingDown,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Compass,
  ArrowRight,
  ExternalLink,
  Pencil,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { useContentStore } from '../../services/contentStore'
import { useAdminRouter } from '../routerContext'
import { useToast } from '../components/toastContext'
import ConfirmModal from '../components/ConfirmModal'
import {
  getAnalyticsSummary,
  resetAnalyticsData,
  type AnalyticsSummaryResult,
} from '../../services/analytics'

export type AnalyticsDateRange = 'today' | '7d' | '30d' | '90d' | '12m' | 'custom'

export default function AnalyticsPage() {
  const { navigate } = useAdminRouter()
  const { toast } = useToast()
  const settings = useContentStore((s) => s.settings)
  const isAnalyticsEnabled = settings.analytics?.enabled !== false
  const measurementId = settings.analytics?.measurementId

  const [dateRange, setDateRange] = useState<AnalyticsDateRange>('30d')
  const [trafficMetric, setTrafficMetric] = useState<'visitors' | 'views' | 'sessions'>('visitors')
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{
    date: string
    displayDate: string
    value: number
    metric: string
  } | null>(null)

  // Reset confirmation modal & reactive version
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [resetVersion, setResetVersion] = useState(0)

  // Listen for reset events across tabs or components
  useEffect(() => {
    const handleResetEvent = () => {
      setResetVersion((v) => v + 1)
    }
    window.addEventListener('tobi_analytics_reset', handleResetEvent)
    return () => window.removeEventListener('tobi_analytics_reset', handleResetEvent)
  }, [])

  // Execute analytics reset
  const handleResetAnalytics = () => {
    resetAnalyticsData()
    setResetVersion((v) => v + 1)
    setIsResetModalOpen(false)
    toast('PORTFOLIO ANALYTICS HAS BEEN RESET.')
  }

  // Compute analytics data based on selected range (re-computes on reset)
  const summary: AnalyticsSummaryResult = useMemo(() => {
    if (resetVersion < 0) return getAnalyticsSummary(dateRange, undefined, measurementId)
    return getAnalyticsSummary(dateRange, undefined, measurementId)
  }, [dateRange, measurementId, resetVersion])


  const { hasData, isConnected, overview, trafficSeries, topPages, topWorks, topCategories, trafficSources, devices, countries, whatsGettingAttention, funnel, realtime: _realtime } = summary

  // Chart calculation values
  const seriesValues = trafficSeries.map((s) => s[trafficMetric])
  const maxVal = Math.max(...seriesValues, 5)
  const minVal = 0

  // Generate SVG path for the line chart
  const chartPoints = useMemo(() => {
    if (trafficSeries.length <= 1) return []
    const width = 800
    const height = 180
    const padding = 20

    return trafficSeries.map((item, idx) => {
      const val = item[trafficMetric]
      const x = padding + (idx / (trafficSeries.length - 1)) * (width - padding * 2)
      const y = height - padding - ((val - minVal) / (maxVal - minVal || 1)) * (height - padding * 2)
      return { x, y, item, val }
    })
  }, [trafficSeries, trafficMetric, maxVal, minVal])

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
    const bottomY = 160
    return `${linePathD} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }, [chartPoints, linePathD])

  // Sparkline path generator for metric cards
  const generateSparkline = (data: number[]) => {
    if (data.length <= 1) return ''
    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const w = 64
    const h = 24
    return data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - ((val - min) / (max - min || 1)) * (h - 4) - 2
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="admin-page-heading">ANALYTICS</h1>
            {isAnalyticsEnabled && isConnected ? (
              <span className="admin-badge admin-badge-green" style={{ fontSize: 10 }}>
                <span className="admin-badge-dot" style={{ background: '#2ecc71' }} />
                GA4 CONNECTED
              </span>
            ) : (
              <span className="admin-badge admin-badge-orange" style={{ fontSize: 10 }}>
                NOT CONNECTED
              </span>
            )}
          </div>
          <p className="admin-page-description">
            UNDERSTAND HOW PEOPLE EXPERIENCE TOBI XP.
          </p>
        </div>

        {/* Date Range Selector & Actions */}
        <div className="admin-analytics-controls">
          <div className="admin-date-range-pills" role="radiogroup" aria-label="Date Range">
            {(['today', '7d', '30d', '90d', '12m'] as AnalyticsDateRange[]).map((range) => {
              const labelMap: Record<AnalyticsDateRange, string> = {
                today: 'TODAY',
                '7d': '7 DAYS',
                '30d': '30 DAYS',
                '90d': '90 DAYS',
                '12m': '12 MONTHS',
                custom: 'CUSTOM',
              }
              return (
                <button
                  key={range}
                  type="button"
                  className={`admin-range-pill ${dateRange === range ? 'is-active' : ''}`}
                  onClick={() => setDateRange(range)}
                >
                  {labelMap[range]}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="admin-btn-reset-analytics"
            onClick={() => setIsResetModalOpen(true)}
            title="Reset collected analytics data"
          >
            <RotateCcw size={12} />
            <span>RESET ANALYTICS</span>
          </button>
        </div>
      </div>

      {/* 27. EMPTY STATE IF NOT CONNECTED */}
      {!isAnalyticsEnabled || !isConnected ? (
        <div className="admin-empty-card" style={{ margin: '20px 0 40px', padding: '48px 24px', textAlign: 'center' }}>
          <AlertCircle size={32} style={{ color: 'var(--ad-orange)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', letterSpacing: '0.04em' }}>
            ANALYTICS NOT CONNECTED
          </h2>
          <p style={{ color: 'var(--ad-text-secondary)', fontSize: 13, maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.5 }}>
            Connect Google Analytics to start collecting portfolio insights and audience interactions.
          </p>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => navigate('/admin/settings/analytics')}
          >
            SET UP ANALYTICS
          </button>
        </div>
      ) : null}

      {/* 27. EMPTY STATE IF CONNECTED BUT NO DATA YET */}
      {isAnalyticsEnabled && isConnected && !hasData && (
        <div className="admin-empty-card" style={{ margin: '16px 0 32px', padding: '36px 20px', textAlign: 'center' }}>
          <Activity size={28} style={{ color: 'var(--ad-orange)', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.04em' }}>
            NO DATA YET
          </h3>
          <p style={{ color: 'var(--ad-text-secondary)', fontSize: 13, maxWidth: 460, margin: '0 auto 16px', lineHeight: 1.5 }}>
            Analytics is live and tracking. Metrics and audience trends will appear here automatically as visitors experience your portfolio.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => navigate('/')}
            >
              VISIT PORTFOLIO
            </button>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={() => navigate('/admin/settings/analytics')}
            >
              CHECK SETTINGS
            </button>
          </div>
        </div>
      )}

      {/* 4. OVERVIEW METRICS (6 Cards with trend & sparklines) */}
      <div className="admin-analytics-metrics-grid">
        {/* Card 1: Visitors */}
        <div className="admin-metric-card">
          <div className="admin-metric-head">
            <span className="admin-metric-label">VISITORS</span>
            <Users size={14} className="admin-metric-icon" />
          </div>
          <div className="admin-metric-body">
            <span className="admin-metric-val">
              {hasData ? overview.visitors.toLocaleString() : '—'}
            </span>
            <div className="admin-metric-spark">
              <svg viewBox="0 0 64 24" className="admin-sparkline-svg">
                <path
                  d={generateSparkline(trafficSeries.map((s) => s.visitors))}
                  fill="none"
                  stroke="var(--ad-orange)"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
          <div className="admin-metric-foot">
            {hasData ? (
              <span className={`admin-metric-trend ${overview.visitorsChange >= 0 ? 'is-up' : 'is-down'}`}>
                {overview.visitorsChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{overview.visitorsChange >= 0 ? `+${overview.visitorsChange}%` : `${overview.visitorsChange}%`}</span>
                <span className="admin-metric-comp">vs previous {dateRange}</span>
              </span>
            ) : (
              <span className="admin-metric-no-data">NO DATA YET</span>
            )}
          </div>
        </div>

        {/* Card 2: Sessions */}
        <div className="admin-metric-card">
          <div className="admin-metric-head">
            <span className="admin-metric-label">SESSIONS</span>
            <Activity size={14} className="admin-metric-icon" />
          </div>
          <div className="admin-metric-body">
            <span className="admin-metric-val">
              {hasData ? overview.sessions.toLocaleString() : '—'}
            </span>
            <div className="admin-metric-spark">
              <svg viewBox="0 0 64 24" className="admin-sparkline-svg">
                <path
                  d={generateSparkline(trafficSeries.map((s) => s.sessions))}
                  fill="none"
                  stroke="var(--ad-text-primary)"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
          <div className="admin-metric-foot">
            {hasData ? (
              <span className={`admin-metric-trend ${overview.sessionsChange >= 0 ? 'is-up' : 'is-down'}`}>
                {overview.sessionsChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{overview.sessionsChange >= 0 ? `+${overview.sessionsChange}%` : `${overview.sessionsChange}%`}</span>
                <span className="admin-metric-comp">vs previous period</span>
              </span>
            ) : (
              <span className="admin-metric-no-data">NO DATA YET</span>
            )}
          </div>
        </div>

        {/* Card 3: Page Views */}
        <div className="admin-metric-card">
          <div className="admin-metric-head">
            <span className="admin-metric-label">PAGE VIEWS</span>
            <Eye size={14} className="admin-metric-icon" />
          </div>
          <div className="admin-metric-body">
            <span className="admin-metric-val">
              {hasData ? overview.views.toLocaleString() : '—'}
            </span>
            <div className="admin-metric-spark">
              <svg viewBox="0 0 64 24" className="admin-sparkline-svg">
                <path
                  d={generateSparkline(trafficSeries.map((s) => s.views))}
                  fill="none"
                  stroke="var(--ad-orange)"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
          <div className="admin-metric-foot">
            {hasData ? (
              <span className={`admin-metric-trend ${overview.viewsChange >= 0 ? 'is-up' : 'is-down'}`}>
                {overview.viewsChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{overview.viewsChange >= 0 ? `+${overview.viewsChange}%` : `${overview.viewsChange}%`}</span>
                <span className="admin-metric-comp">vs previous period</span>
              </span>
            ) : (
              <span className="admin-metric-no-data">NO DATA YET</span>
            )}
          </div>
        </div>

        {/* Card 4: Average Engagement Time */}
        <div className="admin-metric-card">
          <div className="admin-metric-head">
            <span className="admin-metric-label">AVG ENGAGEMENT TIME</span>
            <Clock size={14} className="admin-metric-icon" />
          </div>
          <div className="admin-metric-body">
            <span className="admin-metric-val">
              {hasData ? overview.avgEngagementTime : '—'}
            </span>
          </div>
          <div className="admin-metric-foot">
            {hasData ? (
              <span className={`admin-metric-trend ${overview.avgEngagementChange >= 0 ? 'is-up' : 'is-down'}`}>
                {overview.avgEngagementChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{overview.avgEngagementChange >= 0 ? `+${overview.avgEngagementChange}%` : `${overview.avgEngagementChange}%`}</span>
                <span className="admin-metric-comp">duration</span>
              </span>
            ) : (
              <span className="admin-metric-no-data">NO DATA YET</span>
            )}
          </div>
        </div>

        {/* Card 5: Engagement Rate */}
        <div className="admin-metric-card">
          <div className="admin-metric-head">
            <span className="admin-metric-label">ENGAGEMENT RATE</span>
            <Sparkles size={14} className="admin-metric-icon" />
          </div>
          <div className="admin-metric-body">
            <span className="admin-metric-val">
              {hasData ? `${overview.engagementRate}%` : '—'}
            </span>
          </div>
          <div className="admin-metric-foot">
            {hasData ? (
              <span className={`admin-metric-trend ${overview.engagementRateChange >= 0 ? 'is-up' : 'is-down'}`}>
                {overview.engagementRateChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{overview.engagementRateChange >= 0 ? `+${overview.engagementRateChange}%` : `${overview.engagementRateChange}%`}</span>
                <span className="admin-metric-comp">retention</span>
              </span>
            ) : (
              <span className="admin-metric-no-data">NO DATA YET</span>
            )}
          </div>
        </div>

        {/* Card 6: Pages / Session */}
        <div className="admin-metric-card">
          <div className="admin-metric-head">
            <span className="admin-metric-label">PAGES / SESSION</span>
            <Layers size={14} className="admin-metric-icon" />
          </div>
          <div className="admin-metric-body">
            <span className="admin-metric-val">
              {hasData ? overview.pagesPerSession : '—'}
            </span>
          </div>
          <div className="admin-metric-foot">
            {hasData ? (
              <span className={`admin-metric-trend ${overview.pagesPerSessionChange >= 0 ? 'is-up' : 'is-down'}`}>
                {overview.pagesPerSessionChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{overview.pagesPerSessionChange >= 0 ? `+${overview.pagesPerSessionChange}%` : `${overview.pagesPerSessionChange}%`}</span>
                <span className="admin-metric-comp">exploration</span>
              </span>
            ) : (
              <span className="admin-metric-no-data">NO DATA YET</span>
            )}
          </div>
        </div>
      </div>

      {/* 5. TRAFFIC OVER TIME CHART */}
      <div className="admin-card admin-chart-card">
        <div className="admin-card-head admin-chart-head">
          <div>
            <h2 className="admin-card-title">TRAFFIC OVER TIME</h2>
            <span className="admin-card-subtitle">
              Daily activity trends across {dateRange.toUpperCase()}
            </span>
          </div>

          <div className="admin-metric-toggle-group">
            <button
              type="button"
              className={`admin-toggle-btn ${trafficMetric === 'visitors' ? 'is-active' : ''}`}
              onClick={() => setTrafficMetric('visitors')}
            >
              VISITORS
            </button>
            <button
              type="button"
              className={`admin-toggle-btn ${trafficMetric === 'views' ? 'is-active' : ''}`}
              onClick={() => setTrafficMetric('views')}
            >
              VIEWS
            </button>
            <button
              type="button"
              className={`admin-toggle-btn ${trafficMetric === 'sessions' ? 'is-active' : ''}`}
              onClick={() => setTrafficMetric('sessions')}
            >
              SESSIONS
            </button>
          </div>
        </div>

        <div className="admin-chart-body">
          {hasData && chartPoints.length > 1 ? (
            <div className="admin-svg-chart-container">
              <svg viewBox="0 0 800 180" className="admin-traffic-chart-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--ad-orange)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--ad-orange)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="20" y1="30" x2="780" y2="30" stroke="var(--ad-border)" strokeDasharray="3 3" opacity="0.5" />
                <line x1="20" y1="90" x2="780" y2="90" stroke="var(--ad-border)" strokeDasharray="3 3" opacity="0.5" />
                <line x1="20" y1="150" x2="780" y2="150" stroke="var(--ad-border)" opacity="0.8" />

                {/* Area Fill */}
                <path d={areaPathD} fill="url(#trafficGradient)" />

                {/* Main Line */}
                <path
                  d={linePathD}
                  fill="none"
                  stroke="var(--ad-orange)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points */}
                {chartPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredDataPoint?.date === pt.item.date ? 5 : 3}
                    fill="var(--ad-card-bg)"
                    stroke="var(--ad-orange)"
                    strokeWidth="2"
                    className="admin-chart-dot"
                    onMouseEnter={() =>
                      setHoveredDataPoint({
                        date: pt.item.date,
                        displayDate: pt.item.displayDate,
                        value: pt.val,
                        metric: trafficMetric.toUpperCase(),
                      })
                    }
                    onMouseLeave={() => setHoveredDataPoint(null)}
                  />
                ))}
              </svg>

              {/* Hover Tooltip */}
              {hoveredDataPoint && (
                <div className="admin-chart-tooltip">
                  <span className="admin-tooltip-date">{hoveredDataPoint.displayDate}</span>
                  <span className="admin-tooltip-val">
                    {hoveredDataPoint.value} {hoveredDataPoint.metric}
                  </span>
                </div>
              )}

              {/* Chart Date Range Labels */}
              <div className="admin-chart-axis-labels">
                <span>{trafficSeries[0]?.displayDate || ''}</span>
                <span>{trafficSeries[Math.floor(trafficSeries.length / 2)]?.displayDate || ''}</span>
                <span>{trafficSeries[trafficSeries.length - 1]?.displayDate || ''}</span>
              </div>
            </div>
          ) : (
            <div className="admin-chart-empty-state">
              <span className="admin-chart-empty-text">NO TRAFFIC DATA FOR THIS PERIOD</span>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Top Works & Top Pages */}
      <div className="admin-analytics-two-col">
        {/* 7. TOP WORKS */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2 className="admin-card-title">TOP WORKS</h2>
              <span className="admin-card-subtitle">Most viewed creative projects</span>
            </div>
            <button
              type="button"
              className="admin-card-link"
              onClick={() => navigate('/admin/works')}
            >
              <span>Manage Works</span>
              <ArrowRight size={13} style={{ marginLeft: 4 }} />
            </button>
          </div>

          <div className="admin-card-body-table">
            {topWorks.length > 0 ? (
              <table className="admin-analytics-table">
                <thead>
                  <tr>
                    <th>WORK</th>
                    <th style={{ textAlign: 'right' }}>VIEWS</th>
                    <th style={{ textAlign: 'right' }}>USERS</th>
                    <th style={{ textAlign: 'right' }}>AVG TIME</th>
                    <th style={{ textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {topWorks.slice(0, 5).map((w, idx) => (
                    <tr key={w.workId}>
                      <td>
                        <div className="admin-table-item-cell">
                          <span className="admin-rank-number">{String(idx + 1).padStart(2, '0')}</span>
                          <span className="admin-item-title">{w.title}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{w.views.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--ad-text-secondary)' }}>{w.uniqueUsers}</td>
                      <td style={{ textAlign: 'right', color: 'var(--ad-text-secondary)' }}>{w.avgTime}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="admin-btn-table-edit"
                          onClick={() => navigate(`/admin/works/${w.workId}`)}
                          title="Open in Work Editor"
                        >
                          <Pencil size={11} style={{ marginRight: 4 }} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-table-empty">
                <span>NO WORK VIEWS RECORDED YET</span>
              </div>
            )}
          </div>
        </div>

        {/* 6. TOP PAGES */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2 className="admin-card-title">TOP PAGES</h2>
              <span className="admin-card-subtitle">Most visited portfolio sections</span>
            </div>
          </div>

          <div className="admin-card-body-table">
            {topPages.length > 0 ? (
              <table className="admin-analytics-table">
                <thead>
                  <tr>
                    <th>PAGE</th>
                    <th style={{ textAlign: 'right' }}>VIEWS</th>
                    <th style={{ textAlign: 'right' }}>SHARE</th>
                    <th style={{ textAlign: 'right' }}>LINK</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.slice(0, 5).map((p) => (
                    <tr key={p.name}>
                      <td>
                        <span className="admin-item-title">{p.name}</span>
                        <span className="admin-item-sub">{p.path}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.views.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--ad-text-secondary)' }}>{p.percentage}%</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="admin-btn-table-edit"
                          onClick={() => navigate(p.path)}
                          title="View public page"
                        >
                          <ExternalLink size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-table-empty">
                <span>NO PAGE VIEWS RECORDED YET</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Top Categories & Traffic Sources & Devices */}
      <div className="admin-analytics-three-col">
        {/* 8. TOP CATEGORIES */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">TOP CATEGORIES</h2>
          </div>
          <div className="admin-card-body">
            {topCategories.length > 0 ? (
              <div className="admin-category-stat-list">
                {topCategories.slice(0, 4).map((c) => (
                  <div key={c.categoryId} className="admin-cat-stat-row">
                    <div className="admin-cat-stat-info">
                      <span className="admin-cat-stat-name">{c.name}</span>
                      <span className="admin-cat-stat-count">{c.views.toLocaleString()} views</span>
                    </div>
                    <div className="admin-progress-bar-bg">
                      <div
                        className="admin-progress-bar-fill"
                        style={{ width: `${Math.min(100, Math.max(8, c.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-table-empty">
                <span>NO CATEGORY VIEWS YET</span>
              </div>
            )}
          </div>
        </div>

        {/* 9. TRAFFIC SOURCES */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">TRAFFIC SOURCES</h2>
          </div>
          <div className="admin-card-body">
            {trafficSources.length > 0 ? (
              <div className="admin-sources-list">
                {trafficSources.slice(0, 4).map((s) => (
                  <div key={s.source} className="admin-source-row">
                    <div className="admin-source-left">
                      <Compass size={13} style={{ color: 'var(--ad-orange)', marginRight: 8 }} />
                      <span className="admin-source-name">{s.source}</span>
                    </div>
                    <div className="admin-source-right">
                      <span className="admin-source-users">{s.users}</span>
                      <span className="admin-source-pct">{s.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-table-empty">
                <span>NO SOURCE DATA YET</span>
              </div>
            )}
          </div>
        </div>

        {/* 10. DEVICE BREAKDOWN */}
        <div className="admin-card">
          <div className="admin-card-head">
            <h2 className="admin-card-title">DEVICES</h2>
          </div>
          <div className="admin-card-body">
            <div className="admin-devices-list">
              {devices.map((d) => {
                const icon =
                  d.device === 'Desktop' ? (
                    <Monitor size={14} />
                  ) : d.device === 'Mobile' ? (
                    <Smartphone size={14} />
                  ) : (
                    <Tablet size={14} />
                  )
                return (
                  <div key={d.device} className="admin-device-row">
                    <div className="admin-device-info">
                      <span className="admin-device-icon">{icon}</span>
                      <span className="admin-device-name">{d.device}</span>
                      <span className="admin-device-pct">{d.percentage}%</span>
                    </div>
                    <div className="admin-progress-bar-bg">
                      <div
                        className="admin-progress-bar-fill"
                        style={{ width: `${Math.min(100, Math.max(6, d.percentage))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Third Row: Funnel & Geography & Editorial Insights */}
      <div className="admin-analytics-two-col" style={{ marginTop: 24 }}>
        {/* 23. PORTFOLIO FUNNEL */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2 className="admin-card-title">PORTFOLIO FUNNEL</h2>
              <span className="admin-card-subtitle">Visitor journey from landing to contact</span>
            </div>
          </div>
          <div className="admin-card-body">
            <div className="admin-funnel-steps">
              {funnel.map((step, idx) => (
                <div key={step.step} className="admin-funnel-step-item">
                  <div className="admin-funnel-bar-wrap">
                    <div className="admin-funnel-header">
                      <span className="admin-funnel-name">{step.step}</span>
                      <span className="admin-funnel-count">
                        {hasData ? step.count.toLocaleString() : '0'}
                      </span>
                    </div>
                    <div className="admin-progress-bar-bg">
                      <div
                        className="admin-progress-bar-fill"
                        style={{
                          width: `${Math.min(100, Math.max(step.count > 0 ? 8 : 0, step.percentage))}%`,
                          background:
                            idx === 0
                              ? 'var(--ad-orange)'
                              : idx === 4
                              ? '#2ecc71'
                              : 'var(--ad-text-primary)',
                        }}
                      />
                    </div>
                  </div>
                  {idx < funnel.length - 1 && (
                    <div className="admin-funnel-arrow">
                      <span>↓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 25. WHAT'S GETTING ATTENTION & 11. AUDIENCE GEOGRAPHY */}
        <div className="admin-analytics-col-stack">
          {/* What's getting attention */}
          <div className="admin-card">
            <div className="admin-card-head">
              <h2 className="admin-card-title">WHAT&apos;S GETTING ATTENTION</h2>
            </div>
            <div className="admin-card-body">
              {whatsGettingAttention.length > 0 ? (
                <div className="admin-attention-list">
                  {whatsGettingAttention.map((item, idx) => (
                    <div key={idx} className="admin-attention-item">
                      <div className="admin-attention-left">
                        <span className="admin-attention-tag">{item.category}</span>
                        <span className="admin-attention-title">{item.title}</span>
                      </div>
                      <div className="admin-attention-right">
                        <span className="admin-attention-num">{item.count.toLocaleString()}</span>
                        <span className="admin-attention-unit">{item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-table-empty">
                  <span>NOT ENOUGH DATA YET</span>
                </div>
              )}
            </div>
          </div>

          {/* Audience Geography */}
          <div className="admin-card">
            <div className="admin-card-head">
              <div>
                <h2 className="admin-card-title">AUDIENCE GEOGRAPHY</h2>
                <span className="admin-card-subtitle">Aggregate visitor locations</span>
              </div>
              <Globe size={14} style={{ color: 'var(--ad-text-secondary)' }} />
            </div>
            <div className="admin-card-body">
              {countries.length > 0 ? (
                <div className="admin-countries-list">
                  {countries.slice(0, 4).map((c) => (
                    <div key={c.country} className="admin-country-row">
                      <span className="admin-country-code">{c.code}</span>
                      <span className="admin-country-name">{c.country}</span>
                      <span className="admin-country-count">{c.visitors}</span>
                      <span className="admin-country-pct">{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-table-empty">
                  <span>AGGREGATE GEOGRAPHY WILL APPEAR AS VISITS ARE LOGGED</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Analytics Confirmation Dialog */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="RESET ANALYTICS?"
        message="This will permanently clear the analytics data collected for the portfolio. This cannot be undone."
        helperText="Works, media, categories, settings, and site content will remain untouched."
        requireConfirmationText="RESET"
        confirmationPrompt="Type RESET to confirm."
        confirmLabel="RESET ANALYTICS"
        cancelLabel="CANCEL"
        danger={true}
        onConfirm={handleResetAnalytics}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  )
}

