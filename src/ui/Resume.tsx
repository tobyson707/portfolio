import { motion } from 'framer-motion'
import { SOCIAL_ICONS } from '../data/socialIcons'
import { FOCUS_POINTS } from '../data/focusPoints'
import { SITE_CONTENT, type ResumeEntry, type SocialLink } from '../data/siteContent'
import { useContentStore } from '../services/contentStore'

// 履历条目依次对应 glb 里的聚焦锚点（相机停靠点），顺序须与 entries 一致。
// 名单是唯一真源，见 data/focusPoints.ts（Scene.tsx 也从那里取）。
const POINT_ORDER = FOCUS_POINTS

const EASE = [0.22, 1, 0.36, 1]
const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
}
const itemV = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

function SocialLinks({ links }: { links: SocialLink[] }) {
  return links.map((link) => {
    const Icon = (SOCIAL_ICONS as Record<string, any>)[link.id] || SOCIAL_ICONS['instagram']
    if (!Icon) return null
    return (
      <a
        key={link.id}
        className="tl-logo"
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={link.label}
        title={link.label}
      >
        <Icon />
      </a>
    )
  })
}

function Entry({ entry, index }: { entry: ResumeEntry; index: number }) {
  return (
    <motion.div
      className="tl-entry"
      data-point={POINT_ORDER[index % POINT_ORDER.length]}
      variants={containerV}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-12% 0px -12% 0px' }}
    >
      <motion.span className="tl-dot" variants={itemV} aria-hidden="true" />
      <div className="tl-body">
        {/* entry.period is hidden per requirements */}
        <motion.div className="tl-head" variants={itemV}>
          <h3 className="tl-place">{entry.place}</h3>
        </motion.div>
        {entry.role && (
          <motion.div className="tl-role" variants={itemV}>
            {entry.role}
          </motion.div>
        )}
        {entry.links && entry.links.length > 0 && (
          <motion.div className="tl-logos" variants={itemV}>
            <SocialLinks links={entry.links} />
          </motion.div>
        )}
        {entry.points && entry.points.length > 0 && (
          <motion.ul className="tl-points" variants={itemV}>
            {entry.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </motion.ul>
        )}
      </div>
    </motion.div>
  )
}

export default function Resume() {
  const storeResume = useContentStore((s) => s.site.resume)
  const data = storeResume || SITE_CONTENT.resume
  const visibleEntries = (data.entries || [])
    .filter((e) => e.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <section className="resume" id="resume" lang="en">
      <motion.h2
        className="resume-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {data.title || 'Résumé'}
      </motion.h2>
      <div className="timeline">
        {visibleEntries.map((e, i) => (
          <Entry key={e.id || i} entry={e} index={i} />
        ))}
      </div>
    </section>
  )
}
