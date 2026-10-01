import { useEffect, useState, useRef, useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
import { useContentStore, type StatItem, normalizeStatsData } from '../services/contentStore'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  isInView: boolean
  duration?: number
}

function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  isInView,
  duration = 1500,
}: AnimatedCounterProps) {
  const decimals = useMemo(() => {
    const str = String(value)
    if (str.includes('.')) {
      return str.split('.')[1].length
    }
    return 0
  }, [value])

  const [currentValue, setCurrentValue] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return value
    }
    return 0
  })

  useEffect(() => {
    if (!isInView) return

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrentValue(value)
      return
    }

    let startTimestamp: number | null = null
    let rafId: number

    const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const elapsed = timestamp - startTimestamp
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutExpo(progress)
      const current = eased * value

      if (decimals > 0) {
        setCurrentValue(parseFloat(current.toFixed(decimals)))
      } else {
        setCurrentValue(Math.round(current))
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        setCurrentValue(value)
      }
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [isInView, value, duration, decimals])

  const formattedNumber = decimals > 0 ? currentValue.toFixed(decimals) : currentValue.toLocaleString('en-US')

  return (
    <span className="editorial-stat-num-wrapper" aria-hidden="true">
      {prefix && <span className="editorial-stat-prefix">{prefix}</span>}
      <span className="editorial-stat-digits">{formattedNumber}</span>
      {suffix && <span className="editorial-stat-suffix">{suffix}</span>}
    </span>
  )
}

function StatColumn({
  stat,
  isInView,
  index,
}: {
  stat: StatItem
  isInView: boolean
  index: number
}) {
  const fullAccessibleLabel = `${stat.prefix || ''}${stat.value}${stat.suffix || ''} ${stat.label}. ${stat.description || ''}`

  return (
    <motion.div
      className="editorial-stat-col"
      initial={{ opacity: 0, y: 35 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 35 }}
      transition={{ duration: 0.8, delay: 0.1 + index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      tabIndex={0}
      aria-label={fullAccessibleLabel}
    >
      <span className="editorial-stat-index" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="editorial-stat-num-row">
        <AnimatedCounter
          value={stat.value}
          prefix={stat.prefix}
          suffix={stat.suffix}
          isInView={isInView}
        />
      </div>

      <div className="editorial-stat-meta">
        <span className="editorial-stat-label">{stat.label}</span>
        {stat.description && <p className="editorial-stat-desc">{stat.description}</p>}
      </div>
    </motion.div>
  )
}

export default function EditorialStats() {
  const rawStatsData = useContentStore((s) => s.site.stats)
  const statsData = useMemo(() => normalizeStatsData(rawStatsData), [rawStatsData])

  const visibleStats = useMemo(() => {
    return (statsData.stats || [])
      .filter((s) => s.visible !== false)
      .sort((a, b) => a.order - b.order)
  }, [statsData.stats])

  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-15% 0px -15% 0px' })

  return (
    <section className="editorial-stats-section" id="stats" ref={sectionRef}>
      {/* Dark background overlay / scrim above 3D model and below text */}
      <div className="editorial-stats-scrim" aria-hidden="true" />

      <div className="editorial-stats-container">
        <div className="editorial-stats-grid">
          {visibleStats.map((stat, idx) => (
            <div key={stat.id} className="editorial-stat-cell">
              <StatColumn stat={stat} isInView={isInView} index={idx} />
              {idx < visibleStats.length - 1 && (
                <div className="editorial-stat-divider-v" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
