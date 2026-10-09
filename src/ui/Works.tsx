import { useEffect, useRef, useState, useCallback, type Ref } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
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
import BrandingGallery from './BrandingGallery'
import ProductDesignView from './ProductDesignView'
import SturvsCanvas from './SturvsCanvas'
import { CategoryList, CategoryRow, FloatingCategoryCard } from './CategoryList'
import {
  type CategoryPersonality,
  getCategoryPersonality,
} from '../data/categoryPersonality'
import { SITE_CONTENT } from '../data/siteContent'
import { scrollToContact, scrollToWorks } from '../utils/scroll'
import { useContentStore } from '../services/contentStore'
import { trackWorkView } from '../services/analytics'
import { isMobileDevice } from '../utils/device'
import { useStore } from '../store'

const EASE = [0.22, 1, 0.36, 1]

// 一张全高板块卡：左侧分类信息，右侧配图，下方紧跟作品清单
function SectionCard({
  section,
  data,
  onOpen,
  onHoverItem,
  innerRef,
}: {
  section: WorkSection
  data: WorksLang
  onOpen: (item: WorkListItem) => void
  onHoverItem: (item: WorkListItem | null) => void
  innerRef?: Ref<HTMLDivElement>
}) {
  const isIllustrations =
    section.id === 'ad' ||
    section.no === '01' ||
    section.title?.toUpperCase().includes('ILLUSTRATION')

  const isDesigns =
    section.id === 'maker' ||
    section.no === '02' ||
    section.title?.toUpperCase().includes('DESIGN')

  const [coverError, setCoverError] = useState(false)
  const cover = isIllustrations
    ? '/images/works/Illustrations/Illustrations.webp'
    : isDesigns
    ? '/images/works/Illustrations/designs.webp'
    : section.cover
    ? assetUrl(section.cover)
    : undefined
  const altText = isIllustrations ? 'Illustration portfolio preview' : `${section.title} cover`

  return (
    <div className="wk-card" ref={innerRef}>
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
              {!isDesigns && <span className="wk-card-cover-no">{section.no}</span>}
            </div>
          )}
        </div>
      </div>
      <SectionWorks
        section={section}
        data={data}
        onOpen={onOpen}
        onHoverItem={onHoverItem}
      />
    </div>
  )
}

// 板块内的作品清单（items 扁平 / groups 分组 / awards · footer 底部小字）
function SectionWorks({
  section,
  data,
  onOpen,
  onHoverItem,
}: {
  section: WorkSection
  data: WorksLang
  onOpen: (item: WorkListItem) => void
  onHoverItem: (item: WorkListItem | null) => void
}) {
  const isComingSoon = section.isComingSoon || (!section.items?.length && !section.groups?.length)
  const isIllustrations =
    section.id === 'ad' ||
    section.no === '01' ||
    (section.title ? section.title.toUpperCase().includes('ILLUSTRATION') : false)
  const isDesigns = section.id === 'maker' || (section.title ? section.title.toUpperCase().includes('DESIGN') : false)

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
        <CategoryList
          items={section.items}
          onOpen={onOpen}
          onHover={onHoverItem}
        />
      )}

      {section.groups &&
        section.groups.map((g, gi) => (
          <div key={gi} className="wk-sub">
            <div className="wk-sub-head">{g.heading}</div>
            <ul className="wk-cat-list" role="list">
              {g.items.map((it, i) => (
                <CategoryRow
                  key={i}
                  item={{ name: it }}
                  onOpen={onOpen}
                  onHover={onHoverItem}
                />
              ))}
            </ul>
          </div>
        ))}

      {((section.awards?.length ?? 0) > 0 ||
        (!isIllustrations && (section.tools?.length ?? 0) > 0) ||
        Boolean(section.footer)) && (
        <div className="wk-foot">
          {section.awards && section.awards.length > 0 && (
            <p className="wk-foot-line">
              <span className="wk-foot-label">{data.awardsLabel}</span>
              <span className="wk-foot-val accent">{section.awards.join('  ·  ')}</span>
            </p>
          )}
          {!isIllustrations && section.tools && section.tools.length > 0 && (
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

const SUBCATEGORY_CLOSING_NOTES: Record<string, string> = {
  paintings: 'That’s all the paint for now. Or is it?',
  sketches: 'A few rough ideas made it out of my head.',
  studies: 'Still figuring things out. That’s the fun part.',
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

  useEffect(() => {
    const catName =
      activeCategory === 'sketches'
        ? 'SKETCHES'
        : activeCategory === 'studies'
        ? 'STUDIES'
        : 'PAINTINGS'
    useStore.getState().setSelectedCategory(catName)
  }, [activeCategory])

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
  const closingNote = isIllustrationSection ? SUBCATEGORY_CLOSING_NOTES[activeCategory] || null : null

  // On memory-constrained mobile devices, progressively load images in batches of 24 to prevent WebKit memory exhaustion
  const isMobile = isMobileDevice()
  const [visibleCount, setVisibleCount] = useState(() => (isMobile ? 24 : 1000))

  useEffect(() => {
    setVisibleCount(isMobile ? 24 : 1000)
  }, [activeCategory, isMobile])

  const displayedImages = isMobile ? images.slice(0, visibleCount) : images
  const hasMoreImages = isMobile && visibleCount < images.length

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
            {!isIllustrationSection && item.meta && (
              <div className="wk-detail-sub">{item.meta}</div>
            )}

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
                    </button>
                  )
                })}
              </div>
            )}
          </header>

          {/* Pinterest-style dynamic masonry gallery */}
          {displayedImages.length > 0 ? (
            <>
              <div className="wk-masonry-gallery">
                {displayedImages.map((image, idx) => (
                  <button
                    className="wk-masonry-tile"
                    key={image.id || image.src}
                    type="button"
                    aria-label="View artwork"
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
                        alt=""
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

              {hasMoreImages && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
                  <button
                    type="button"
                    className="wk-detail-filter-btn"
                    style={{ padding: '10px 24px', fontSize: '0.85rem', cursor: 'pointer' }}
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                  >
                    <span className="wk-filter-name">
                      LOAD MORE WORKS ({images.length - visibleCount} REMAINING)
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="wk-masonry-empty">
              <p className="wk-masonry-empty-text">No works currently published in this category.</p>
            </div>
          )}

          {closingNote && (
            <div className="wk-category-closing">
              <p className="wk-category-closing-text">{closingNote}</p>
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

function getCategoryNameFromItem(item: WorkListItem | null): string | null {
  if (!item) return null
  const slug = (item.slug || '').toLowerCase().trim()
  const name = (item.name || '').trim()
  const id = ((item as any).id || '').toLowerCase().trim()

  if (slug === 'paintings' || name.toLowerCase() === 'paintings' || (item as any).workGroupId === 'wg-paint') {
    return 'PAINTINGS'
  }
  if (slug === 'sketches' || name.toLowerCase() === 'sketches' || (item as any).workGroupId === 'wg-sketch') {
    return 'SKETCHES'
  }
  if (slug === 'studies' || name.toLowerCase() === 'studies' || (item as any).workGroupId === 'wg-studies') {
    return 'STUDIES'
  }
  if (
    slug === 'branding-identity' ||
    id === 'maker-branding' ||
    name.toLowerCase().includes('branding')
  ) {
    return 'BRANDING & IDENTITY'
  }
  if (
    slug === 'product-design' ||
    id === 'maker-product' ||
    name.toLowerCase().includes('product')
  ) {
    return 'PRODUCT DESIGN'
  }
  if (
    slug === 'sturvs' ||
    id === 'maker-sturvs' ||
    name.toLowerCase().includes('sturvs')
  ) {
    return 'STURVS'
  }
  if (slug === 'all' || name.toLowerCase().includes('illustration')) {
    return 'PAINTINGS'
  }
  return name.toUpperCase()
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
  const firstCardRef = useRef<HTMLDivElement>(null)
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

  // Listen for hash navigation e.g. #contact or #works
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#contact') {
        scrollToContact()
      } else if (window.location.hash === '#works') {
        scrollToWorks()
      }
    }
    window.addEventListener('hashchange', handleHash)
    if (window.location.hash === '#contact' || window.location.hash === '#works') {
      setTimeout(handleHash, 400)
    }
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  // px 数值插值（比 vw 字符串更顺）；竖滚行程与横移 1:1
  const x = useTransform(scrollYProgress, [0, 1], [0, -scrollRange])
  
  // Works horizontal scroll cue: remains fully visible while project cards are outside the viewport,
  // and smoothly fades out (300-500ms) only when the first project card begins meaningfully entering the visible viewport
  const [isFirstCardEntering, setIsFirstCardEntering] = useState(false)
  const isFirstCardEnteringRef = useRef(false)

  const checkCardIntersection = useCallback(() => {
    if (!firstCardRef.current) return
    const rect = firstCardRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1000

    // Measure how much of the first project card has entered from the right edge into the visible viewport
    const visibleWidth = viewportWidth - rect.left

    // Enter threshold: starts fading as soon as a small, meaningful portion (~24px) of the card enters
    // Re-entry threshold: returns to visible if the card slides back out beyond the viewport edge (< 10px)
    if (!isFirstCardEnteringRef.current && visibleWidth >= 24) {
      isFirstCardEnteringRef.current = true
      setIsFirstCardEntering(true)
    } else if (isFirstCardEnteringRef.current && visibleWidth < 10) {
      isFirstCardEnteringRef.current = false
      setIsFirstCardEntering(false)
    }
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', checkCardIntersection)

  useEffect(() => {
    checkCardIntersection()
    const rafId = requestAnimationFrame(checkCardIntersection)
    window.addEventListener('scroll', checkCardIntersection, { passive: true })
    window.addEventListener('resize', checkCardIntersection)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', checkCardIntersection)
      window.removeEventListener('resize', checkCardIntersection)
    }
  }, [checkCardIntersection])

  // WORKS title fades out progressively as user scrolls toward Contact
  const worksTitleOpacity = useTransform(scrollYProgress, [0.75, 0.96], [1, 0])

  // 详情打开时锁滚动 + ESC 关闭 + 隐藏全局浮动控件 (如 Back to Top 和 Navigation Menu) + 音频分类环境联动
  useEffect(() => {
    useStore.getState().setIsModalOpen(Boolean(active))

    if (!active) {
      useStore.getState().setSelectedCategory(null)
      return
    }

    const catName = getCategoryNameFromItem(active)
    useStore.getState().setSelectedCategory(catName)

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // If ImageViewer is active, let it close first without closing category
      if (document.querySelector('.wk-viewer-root')) return
      closeDetail()
    }

    const handlePopState = () => {
      // If user swipes back or clicks browser back, dismiss the modal
      if (document.querySelector('.wk-viewer-root')) {
        // If image viewer open, it handles its own popstate or ESC
        return
      }
      setActive(null)
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('popstate', handlePopState)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', handlePopState)
      document.body.style.overflow = prev
      useStore.getState().setIsModalOpen(false)
      useStore.getState().setSelectedCategory(null)
    }
  }, [active])

  const isModalOpen = useStore((s) => s.isModalOpen)

  // One shared cursor personality state for category row hovers
  const [activePersonality, setActivePersonality] = useState<CategoryPersonality | null>(null)
  const leaveTimerRef = useRef<number | null>(null)

  // Ensure cursor card is immediately cleared when detail modal opens
  useEffect(() => {
    if (active || isModalOpen) {
      setActivePersonality(null)
    }
  }, [active, isModalOpen])

  const openDetail = (item: WorkListItem) => {
    setActivePersonality(null)
    setActive(item)
    if (typeof window !== 'undefined') {
      try {
        const hash = item.slug || (item as any).id || 'detail'
        window.history.pushState({ modal: hash }, '', `#${hash}`)
      } catch {
        // ignore
      }
    }
    trackWorkView({
      workId: (item as any).id || (item.slug ? item.slug : item.name.toLowerCase().replace(/\s+/g, '-')),
      title: item.name,
      categoryId: (item as any).categoryId,
      workGroupId: (item as any).workGroupId,
    })
  }

  const closeDetail = () => {
    setActive(null)
    if (typeof window !== 'undefined' && window.location.hash) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      } catch {
        // ignore
      }
    }
  }

  const handleHoverItem = useCallback((item: WorkListItem | null) => {
    if (leaveTimerRef.current) {
      window.clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }

    if (active || isModalOpen) {
      setActivePersonality(null)
      return
    }

    if (item) {
      const personality = getCategoryPersonality(item)
      setActivePersonality(personality)
    } else {
      // Brief debounce so moving between adjacent category rows is seamless
      leaveTimerRef.current = window.setTimeout(() => {
        setActivePersonality(null)
      }, 50)
    }
  }, [active, isModalOpen])

  const isBranding =
    active &&
    (active.slug === 'branding-identity' ||
      active.id === 'maker-branding' ||
      active.name?.toLowerCase().includes('branding'))

  const isProductDesign =
    active &&
    (active.slug === 'product-design' ||
      active.id === 'maker-product' ||
      active.name?.toLowerCase().includes('product'))

  const isSturvs =
    active &&
    (active.slug === 'sturvs' ||
      active.id === 'maker-sturvs' ||
      active.name?.toLowerCase().includes('sturvs'))

  return (
    <section className="works" id="works" lang={lang} ref={innerRef}>
      {/* One shared cursor-following personality card rendered via body portal */}
      {!active && !isModalOpen && <FloatingCategoryCard personality={activePersonality} />}

      <div
        className="wk-gallery"
        ref={galleryRef}
        style={{ height: `calc(100vh + ${scrollRange}px)` }}
      >
        <div className="wk-gallery-sticky">
          <motion.span className="wk-gallery-title" style={{ opacity: worksTitleOpacity }}>{resolvedData.title}</motion.span>

          <motion.div className="wk-track" ref={trackRef} style={{ x }}>
            {sections.map((s, idx) => (
              <SectionCard
                key={s.id}
                section={s}
                data={resolvedData}
                onOpen={openDetail}
                onHoverItem={handleHoverItem}
                innerRef={idx === 0 ? firstCardRef : undefined}
              />
            ))}
            <Contact content={{ ...SITE_CONTENT.contact, ...siteContent.contact }} />
          </motion.div>

          <div className="wk-progress" aria-hidden="true">
            <motion.div className="wk-progress-fill" style={{ scaleX: scrollYProgress }} />
          </div>

          {/* Conversational Horizontal Scroll Cue (Tobi's personal invitation to keep exploring) */}
          <motion.div
            className="wk-scroll-cue"
            animate={{ opacity: isFirstCardEntering ? 0 : 1 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{
              pointerEvents: isFirstCardEntering ? 'none' : 'auto',
            }}
            aria-label="Don’t stop... keep scrolling"
            aria-hidden={isFirstCardEntering}
          >
            <div className="wk-scroll-cue-inner">
              <span className="wk-scroll-cue-line">DON’T STOP...</span>
              <span className="wk-scroll-cue-line wk-scroll-cue-lead">
                KEEP SCROLLING
                <span className="wk-scroll-cue-arrow" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {active && isBranding && <BrandingGallery key="branding-gallery" onClose={closeDetail} />}
        {active && isProductDesign && (
          <ProductDesignView key="product-design-view" onClose={closeDetail} />
        )}
        {active && isSturvs && <SturvsCanvas key="sturvs-canvas" onClose={closeDetail} />}
        {active && !isBranding && !isProductDesign && !isSturvs && (
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
