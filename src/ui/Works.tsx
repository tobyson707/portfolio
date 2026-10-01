import { useEffect, useRef, useState, type Ref } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { WORKS, assetUrl, type WorkListItem, type WorkSection, type WorksLang } from '../data/works'
import {
  getCategoryImages,
  allIllustrationImages,
  illustrationGallery,
  reportMissingImage,
  type IllustrationImage,
} from '../data/worksManifest'
import ImageViewer from './ImageViewer'
import Contact from './Contact'
import { SITE_CONTENT } from '../data/siteContent'
import { scrollToContact } from '../utils/scroll'
import { useContentStore } from '../services/contentStore'
import { trackWorkView } from '../services/analytics'

const EASE = [0.22, 1, 0.36, 1]

// 极简清单的一行：作品名靠左、数据(播放量/标签)靠右、发丝线分隔；整行可点开全屏详情
function WorkLine({ item, onOpen }: { item: WorkListItem; onOpen: (item: WorkListItem) => void }) {
  const hasMeta = item.meta || (item.tags && item.tags.length)
  return (
    <li className="wk-line">
      <button className="wk-line-btn" onClick={() => onOpen(item)}>
        <span className="wk-line-name">{item.name}</span>
        {hasMeta && (
          <span className="wk-line-meta">
            {item.meta && <span className="wk-line-num">{item.meta}</span>}
            {item.tags &&
              item.tags.map((t, i) => (
                <span key={i} className="wk-line-tag">
                  {t}
                </span>
              ))}
          </span>
        )}
      </button>
    </li>
  )
}

// 一张全高板块卡：左侧分类信息，右侧配图，下方紧跟作品清单
function SectionCard({
  section,
  data,
  onOpen,
}: {
  section: WorkSection
  data: WorksLang
  onOpen: (item: WorkListItem) => void
}) {
  const isIllustrations =
    section.id === 'ad' ||
    section.no === '01' ||
    section.title?.toUpperCase().includes('ILLUSTRATION')

  const [coverError, setCoverError] = useState(false)
  const cover = isIllustrations
    ? '/images/works/Illustrations/Illustrations.webp'
    : section.cover
    ? assetUrl(section.cover)
    : undefined
  const altText = isIllustrations ? 'Illustration portfolio preview' : `${section.title} cover`

  return (
    <div className="wk-card">
      <div className="wk-card-header">
        <div className="wk-card-head">
          <span className="wk-card-no">{section.no}</span>
          <h3 className="wk-card-title">{section.title}</h3>
          <span className="wk-card-tagline">{section.tagline}</span>
        </div>
        <div
          className="wk-card-cover"
          onClick={() => {
            if (isIllustrations) {
              onOpen({
                name: 'All Illustrations',
                slug: 'all',
                meta: `${allIllustrationImages.length} works`,
                categoryId: 'ad',
              } as WorkListItem)
            } else if (section.items && section.items.length > 0) {
              onOpen(section.items[0])
            }
          }}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          aria-label={`Explore ${section.title}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (isIllustrations) {
                onOpen({
                  name: 'All Illustrations',
                  slug: 'all',
                  meta: `${allIllustrationImages.length} works`,
                  categoryId: 'ad',
                } as WorkListItem)
              } else if (section.items && section.items.length > 0) {
                onOpen(section.items[0])
              }
            }
          }}
        >
          {cover && !coverError ? (
            <img
              src={cover}
              alt={altText}
              loading="lazy"
              draggable={false}
              onError={() => setCoverError(true)}
            />
          ) : (
            <div className="wk-card-cover-ph" aria-hidden="true">
              <span className="wk-card-cover-no">{section.no}</span>
            </div>
          )}
        </div>
      </div>
      <SectionWorks section={section} data={data} onOpen={onOpen} />
    </div>
  )
}

// 板块内的作品清单（items 扁平 / groups 分组 / awards · footer 底部小字）
function SectionWorks({
  section,
  data,
  onOpen,
}: {
  section: WorkSection
  data: WorksLang
  onOpen: (item: WorkListItem) => void
}) {
  const isComingSoon = section.isComingSoon || (!section.items?.length && !section.groups?.length)
  const isDesigns = section.id === 'maker' || section.title.toUpperCase().includes('DESIGN')

  if (isComingSoon || (isDesigns && (!section.items || section.items.length === 0))) {
    const rawMsg = section.comingSoonMessage || 'PATIENCE!\nSTILL WORKING ON THIS SECTION...'
    return (
      <div className="wk-card-body">
        <div className="wk-coming-soon">
          <p className="wk-coming-soon-text">
            {rawMsg}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="wk-card-body">
      {section.items && (
        <ul className="wk-list">
          {section.items.map((it, i) => (
            <WorkLine key={it.id || it.slug || i} item={it} onOpen={onOpen} />
          ))}
        </ul>
      )}

      {section.groups &&
        section.groups.map((g, gi) => (
          <div key={gi} className="wk-sub">
            <div className="wk-sub-head">{g.heading}</div>
            <ul className="wk-list">
              {g.items.map((it, i) => (
                <WorkLine key={i} item={{ name: it }} onOpen={onOpen} />
              ))}
            </ul>
          </div>
        ))}

      {((section.awards?.length ?? 0) > 0 ||
        (section.tools?.length ?? 0) > 0 ||
        Boolean(section.footer)) && (
        <div className="wk-foot">
          {section.awards && section.awards.length > 0 && (
            <p className="wk-foot-line">
              <span className="wk-foot-label">{data.awardsLabel}</span>
              <span className="wk-foot-val accent">{section.awards.join('  ·  ')}</span>
            </p>
          )}
          {section.tools && section.tools.length > 0 && (
            <p className="wk-foot-line">
              <span className="wk-foot-label">TOOLS</span>
              <span className="wk-foot-val accent">{section.tools.join('  ·  ')}</span>
            </p>
          )}
          {section.footer && <p className="wk-foot-line">{section.footer}</p>}
        </div>
      )}
    </div>
  )
}

function WorkDetail({
  item,
  data,
  onClose,
}: {
  item: WorkListItem
  data: WorksLang
  onClose: () => void
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const isIllustrationSection =
    ['paintings', 'sketches', 'studies', 'illustrations', 'all', 'all illustrations', 'all works'].includes(
      (item.slug || item.name || '').toLowerCase().trim()
    ) ||
    item.categoryId === 'ad' ||
    (item as any).workGroupId === 'wg-paint' ||
    (item as any).workGroupId === 'wg-sketch' ||
    (item as any).workGroupId === 'wg-studies'

  const initialCat = (() => {
    const norm = (item.slug || item.name || '').toLowerCase().trim()
    if (norm === 'paintings' || norm === 'painting') return 'paintings'
    if (norm === 'sketches' || norm === 'sketch') return 'sketches'
    if (norm === 'studies' || norm === 'study') return 'studies'
    return 'all'
  })()

  const [activeCategory, setActiveCategory] = useState<string>(initialCat)

  const CATEGORY_TABS = [
    { id: 'all', label: 'All', count: allIllustrationImages.length },
    { id: 'paintings', label: 'Paintings', count: illustrationGallery.paintings.length },
    { id: 'sketches', label: 'Sketches', count: illustrationGallery.sketches.length },
    { id: 'studies', label: 'Studies', count: illustrationGallery.studies.length },
  ]

  const fallbackImages: IllustrationImage[] = (item.gallery || []).map((g, idx) => ({
    id: `${item.slug || 'work'}-${idx}`,
    src: g.image,
    title: g.title,
    category: (item.name as any) || 'Paintings',
  }))

  const manifestImages = isIllustrationSection
    ? getCategoryImages(activeCategory)
    : getCategoryImages(item.name || item.slug || '')

  const images: IllustrationImage[] =
    manifestImages.length > 0
      ? manifestImages
      : isIllustrationSection && activeCategory === 'studies'
      ? []
      : fallbackImages

  const isViewerOpen = selectedImageIndex !== null

  return (
    <>
      <motion.div
        className="wk-detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      <motion.div
        className="wk-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wk-detail-title"
        initial={{ opacity: 0, scale: 0.985, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 6 }}
        transition={{ duration: 0.42, ease: EASE }}
      >
        <button className="wk-detail-close" onClick={onClose} aria-label={data.closeLabel}>
          ✕
        </button>

        <article className="wk-detail-article">
          <header className="wk-detail-head">
            <h3 id="wk-detail-title" className="wk-detail-title">
              {isIllustrationSection
                ? activeCategory === 'all'
                  ? 'All Illustrations'
                  : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)
                : item.name}
            </h3>
            <div className="wk-detail-sub">
              {isIllustrationSection
                ? `${images.length} work${images.length === 1 ? '' : 's'}`
                : item.meta}
            </div>

            {isIllustrationSection && (
              <div className="wk-detail-filter-bar" role="tablist" aria-label="Illustration Categories">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = activeCategory === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`wk-detail-filter-btn ${isActive ? 'is-active' : ''}`}
                      onClick={() => {
                        setActiveCategory(tab.id)
                        setSelectedImageIndex(null)
                      }}
                    >
                      <span className="wk-filter-name">{tab.label}</span>
                      <span className="wk-filter-count">{tab.count}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </header>

          {/* Pinterest-style dynamic masonry gallery */}
          {images.length > 0 ? (
            <div className="wk-masonry-gallery">
              {images.map((image, idx) => (
                <button
                  className="wk-masonry-tile"
                  key={image.id || image.src}
                  type="button"
                  aria-label={image.title ? `View ${image.title}` : 'View artwork'}
                  onClick={() => setSelectedImageIndex(idx)}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  <div
                    className="wk-masonry-media"
                    style={{
                      aspectRatio:
                        image.width && image.height ? `${image.width} / ${image.height}` : undefined,
                    }}
                  >
                    <img
                      src={encodeURI(image.src)}
                      alt={image.title || 'Artwork thumbnail'}
                      className="wk-masonry-img"
                      draggable={false}
                      loading="lazy"
                      onError={() => {
                        reportMissingImage(image.src, image.category || item.name || 'Gallery')
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="wk-masonry-empty">
              <p className="wk-masonry-empty-text">No works currently published in this category.</p>
            </div>
          )}
        </article>
      </motion.div>

      {/* Focused, minimal image viewer with dark overlay */}
      <ImageViewer
        images={images}
        currentIndex={selectedImageIndex ?? 0}
        isOpen={isViewerOpen}
        onClose={() => setSelectedImageIndex(null)}
        onNavigate={(nextIdx) => setSelectedImageIndex(nextIdx)}
      />
    </>
  )
}

export default function Works({ lang, innerRef }: { lang: 'en'; innerRef: Ref<HTMLElement> }) {
  const data = WORKS[lang]
  const dynamicSections = useContentStore((s) => s.getPublicSections())
  const siteContent = useContentStore((s) => s.site)
  const worksConfig = siteContent.worksConfig || {}

  const resolvedData: typeof data = {
    ...data,
    title: worksConfig.title || data.title,
    closeLabel: worksConfig.closeLabel || data.closeLabel,
    openLabel: worksConfig.openLabel || data.openLabel,
    hint: worksConfig.hint || data.hint,
    awardsLabel: worksConfig.awardsLabel || data.awardsLabel,
    visitLabel: worksConfig.visitLabel || data.visitLabel,
    detailPlaceholder: worksConfig.detailPlaceholder || data.detailPlaceholder,
    phImageLabel: worksConfig.phImageLabel || data.phImageLabel,
    phButtonLabel: worksConfig.phButtonLabel || data.phButtonLabel,
  }

  const sections = dynamicSections.length > 0 ? dynamicSections : resolvedData.sections
  const count = sections.length

  const [active, setActive] = useState<WorkListItem | null>(null) // 当前打开详情的作品 item

  // 竖滚 pin 转横移：测量整排卡片的实际可横移距离（px），竖滚进度 → 横移
  const galleryRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: galleryRef,
    offset: ['start start', 'end end'],
  })

  // track 实际宽度 - 视口宽 = 需要横移的距离；随尺寸/语言变化重测
  const [scrollRange, setScrollRange] = useState(0)
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => {
      setScrollRange(Math.max(0, el.scrollWidth - window.innerWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    if (document.fonts) {
      document.fonts.ready.then(measure)
    }
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [count, lang])

  // Listen for hash navigation e.g. #contact
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#contact') {
        scrollToContact()
      }
    }
    window.addEventListener('hashchange', handleHash)
    if (window.location.hash === '#contact') {
      setTimeout(handleHash, 400)
    }
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // px 数值插值（比 vw 字符串更顺）；竖滚行程与横移 1:1
  const x = useTransform(scrollYProgress, [0, 1], [0, -scrollRange])
  // 横移到底时「继续下滑」提示渐隐
  const hintOpacity = useTransform(scrollYProgress, [0.85, 1], [1, 0])
  // WORKS title fades out progressively as user scrolls toward Contact
  const worksTitleOpacity = useTransform(scrollYProgress, [0.75, 0.96], [1, 0])

  // 详情打开时锁滚动 + ESC 关闭
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // If ImageViewer is active, let it close first without closing category
      if (document.querySelector('.wk-viewer-root')) return
      setActive(null)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [active])

  const openDetail = (item: WorkListItem) => {
    setActive(item)
    trackWorkView({
      workId: (item as any).id || (item.slug ? item.slug : item.name.toLowerCase().replace(/\s+/g, '-')),
      title: item.name,
      categoryId: (item as any).categoryId,
      workGroupId: (item as any).workGroupId,
    })
  }

  const closeDetail = () => {
    setActive(null)
  }

  return (
    <section className="works" id="works" lang={lang} ref={innerRef}>
      <div
        className="wk-gallery"
        ref={galleryRef}
        style={{ height: `calc(100vh + ${scrollRange}px)` }}
      >
        <div className="wk-gallery-sticky">
          <motion.span className="wk-gallery-title" style={{ opacity: worksTitleOpacity }}>{resolvedData.title}</motion.span>

          <motion.div className="wk-track" ref={trackRef} style={{ x }}>
            {sections.map((s) => (
              <SectionCard key={s.id} section={s} data={resolvedData} onOpen={openDetail} />
            ))}
            <Contact content={{ ...SITE_CONTENT.contact, ...siteContent.contact }} />
          </motion.div>

          <div className="wk-progress" aria-hidden="true">
            <motion.div className="wk-progress-fill" style={{ scaleX: scrollYProgress }} />
          </div>
          <motion.span className="wk-hint" style={{ opacity: hintOpacity }} aria-hidden="true">
            {resolvedData.hint}
          </motion.span>
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <WorkDetail
            key={active.slug || active.name}
            item={active}
            data={resolvedData}
            onClose={closeDetail}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
