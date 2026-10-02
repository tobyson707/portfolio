import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useStore } from '../store'
import { useContentStore } from '../services/contentStore'
import { scrollToContact, scrollToWorks } from '../utils/scroll'
import { trackMenuInteraction, trackSocialClick } from '../services/analytics'

export type NavSection = 'home' | 'about' | 'works' | 'store'

interface NavItem {
  id: NavSection
  label: string
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'HOME' },
  { id: 'about', label: 'ABOUT' },
  { id: 'works', label: 'WORKS' },
  { id: 'store', label: 'STORE', disabled: true },
]



const HOVER_CARD_TEXTS: Record<NavSection, string> = {
  home: 'YEP, THIS IS HOME LOL',
  about: 'OH, YOU WANNA KNOW ABOUT ME?',
  works: "OKAY, LET'S SEE WHAT I MADE",
  store: 'COMING SOON... I PROMISE LOL',
}

export default function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const currentView = useStore((s) => s.currentView)
  const setCurrentView = useStore((s) => s.setCurrentView)
  const setPendingScrollTarget = useStore((s) => s.setPendingScrollTarget)
  const isModalOpen = useStore((s) => s.isModalOpen)
  const isAboutOpen = useStore((s) => s.isAboutOpen)
  const setIsAboutOpen = useStore((s) => s.setIsAboutOpen)
  const social = useContentStore((s) => s.site.social)
  const contact = useContentStore((s) => s.site.contact)

  const dynamicSocialLinks = useMemo(() => {
    const instagramUrl = social?.instagram || 'https://instagram.com/tobi.xp/'
    const email = contact?.email || social?.email || 'businesstobixp@gmail.com'
    const mailto = email.startsWith('mailto:') ? email : `mailto:${email}`
    return [
      { label: 'INSTAGRAM', href: instagramUrl },
      { label: 'EMAIL', href: mailto },
    ]
  }, [social, contact])

  // Universal nav hover, focus & tap tracking state
  const [hoveredItemId, setHoveredItemId] = useState<NavSection | null>(null)
  const [focusedItemId, setFocusedItemId] = useState<NavSection | null>(null)
  const [mobileTappedId, setMobileTappedId] = useState<NavSection | null>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { damping: 26, stiffness: 280, mass: 0.4 })
  const smoothY = useSpring(mouseY, { damping: 26, stiffness: 280, mass: 0.4 })

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Reset hover/focus state when menu closes
  useEffect(() => {
    if (!isOpen) {
      setHoveredItemId(null)
      setFocusedItemId(null)
      setMobileTappedId(null)
    }
  }, [isOpen])

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  const handleNavigate = useCallback(
    (item: NavItem) => {
      if (item.disabled || item.id === 'store') {
        return
      }

      trackMenuInteraction({ action: 'click', item: item.id })
      setIsOpen(false)

      if (item.id === 'about') {
        if (currentView === '404') {
          setCurrentView('home')
        }
        setIsAboutOpen(true)
      } else if (item.id === 'home') {
        if (isAboutOpen) {
          setIsAboutOpen(false)
        }
        if (currentView !== 'home') {
          setCurrentView('home')
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (item.id === 'works') {
        if (isAboutOpen) {
          setIsAboutOpen(false)
        }
        if (currentView !== 'home') {
          setPendingScrollTarget('works')
          setCurrentView('home')
        } else {
          document.body.style.overflow = ''
          document.documentElement.style.overflow = ''
          scrollToWorks('smooth')
          requestAnimationFrame(() => {
            scrollToWorks('smooth')
          })
        }
      }
    },
    [currentView, setCurrentView, setPendingScrollTarget, isAboutOpen, setIsAboutOpen]
  )

  const handleItemMouseMove = (
    id: NavSection,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const text = HOVER_CARD_TEXTS[id] || ''
    const estimatedCardWidth = Math.max(140, Math.min(340, text.length * 8.5 + 32))
    const cardHeight = 34
    const padding = 12
    let targetX = e.clientX + 16
    let targetY = e.clientY + 12

    if (typeof window !== 'undefined') {
      if (targetX + estimatedCardWidth > window.innerWidth - padding) {
        targetX = Math.max(padding, e.clientX - estimatedCardWidth - 12)
      }
      if (targetY + cardHeight > window.innerHeight - padding) {
        targetY = Math.max(padding, e.clientY - cardHeight - 8)
      }
    }

    mouseX.set(targetX)
    mouseY.set(targetY)
  }

  const handleItemMouseEnter = (
    id: NavSection,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    handleItemMouseMove(id, e)
    setHoveredItemId(id)
  }

  const handleItemMouseLeave = () => {
    setHoveredItemId(null)
  }

  const handleItemFocus = (
    id: NavSection,
    target: HTMLButtonElement
  ) => {
    if (target && typeof window !== 'undefined') {
      const rect = target.getBoundingClientRect()
      const text = HOVER_CARD_TEXTS[id] || ''
      const estimatedCardWidth = Math.max(140, Math.min(340, text.length * 8.5 + 32))
      let targetX = rect.right + 20
      if (targetX + estimatedCardWidth > window.innerWidth - 16) {
        targetX = Math.max(16, window.innerWidth - estimatedCardWidth - 16)
      }
      const targetY = rect.top + rect.height / 2 - 16
      mouseX.set(targetX)
      mouseY.set(targetY)
    }
    setFocusedItemId(id)
  }

  const handleItemBlur = () => {
    setFocusedItemId(null)
  }

  const handleStoreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (e.currentTarget && typeof window !== 'undefined') {
      const rect = e.currentTarget.getBoundingClientRect()
      const text = HOVER_CARD_TEXTS.store
      const estimatedCardWidth = Math.max(140, Math.min(340, text.length * 8.5 + 32))
      const targetX = Math.min(window.innerWidth - estimatedCardWidth - 16, Math.max(16, rect.left + 12))
      const targetY = rect.bottom + 8
      mouseX.set(targetX)
      mouseY.set(targetY)
    }
    setMobileTappedId('store')
    setTimeout(() => {
      setMobileTappedId(null)
    }, 1600)
  }

  const activeItemId = hoveredItemId || focusedItemId || mobileTappedId
  const currentCardText = activeItemId ? HOVER_CARD_TEXTS[activeItemId] : null
  const showHoverCard = Boolean(isOpen && activeItemId && currentCardText)

  return (
    <>
      {/* Top-right trigger button (only visible when menu is closed and no modal is open) */}
      <AnimatePresence>
        {!isOpen && !isModalOpen && (
          <motion.div
            className="nav-trigger-wrapper"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              className="nav-trigger-btn"
              onClick={() => {
                setIsOpen(true)
                trackMenuInteraction({ action: 'open' })
              }}
              aria-expanded={false}
              aria-label="Open menu"
            >
              <span className="nav-hamburger-icon" aria-hidden="true">
                <span className="nav-hamburger-line line-1" />
                <span className="nav-hamburger-line line-2" />
                <span className="nav-hamburger-line line-3" />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editorial Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="editorial-menu-backdrop"
            initial={{ opacity: 0, pointerEvents: 'none' }}
            animate={{ opacity: 1, pointerEvents: 'auto', transition: { duration: 0.4, ease: [0.55, 0.05, 0.8, 0.2] } }}
            exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOpen(false)
              }
            }}
          >
            <motion.div
              className="editorial-menu-panel"
              initial={{ opacity: 0, scale: 0.95, y: 18, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.55, 0.05, 0.8, 0.2] } }}
              exit={{ opacity: 0, scale: 0.92, y: 22, filter: 'blur(4px)', transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
            >
              {/* Top Header: Logo & Close Button */}
              <div className="editorial-panel-header">
                <div className="editorial-panel-logo">
                  <img src="/images/xp.png" alt="TOBI XP" className="hero-xp-logo" />
                </div>
                <button
                  type="button"
                  className="editorial-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Center Body: Left Nav + Right Social Links */}
              <div className="editorial-panel-body">
                <nav className="editorial-nav-group" aria-label="Main Navigation">
                  {NAV_ITEMS.map((item, index) => {
                    const isStore = item.id === 'store'
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.08 + index * 0.05, duration: 0.38, ease: [0.55, 0.05, 0.8, 0.2] } }}
                        exit={{ opacity: 0, y: 16, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
                      >
                        {isStore ? (
                          <button
                            type="button"
                            className="editorial-nav-link store-nav-link"
                            aria-label="Store — coming soon"
                            onMouseEnter={(e) => handleItemMouseEnter(item.id, e)}
                            onMouseMove={(e) => handleItemMouseMove(item.id, e)}
                            onMouseLeave={handleItemMouseLeave}
                            onFocus={(e) => handleItemFocus(item.id, e.currentTarget)}
                            onBlur={handleItemBlur}
                            onClick={handleStoreClick}
                          >
                            {item.label}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="editorial-nav-link"
                            onMouseEnter={(e) => handleItemMouseEnter(item.id, e)}
                            onMouseMove={(e) => handleItemMouseMove(item.id, e)}
                            onMouseLeave={handleItemMouseLeave}
                            onFocus={(e) => handleItemFocus(item.id, e.currentTarget)}
                            onBlur={handleItemBlur}
                            onClick={() => handleNavigate(item)}
                          >
                            {item.label}
                          </button>
                        )}
                      </motion.div>
                    )
                  })}
                </nav>

                <div className="editorial-social-group">
                  {dynamicSocialLinks.map((link, index) => {
                    const isContact = link.href === '#contact' || link.href.endsWith('#contact')
                    return (
                      <motion.div
                        key={link.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.12 + index * 0.04, duration: 0.35, ease: [0.55, 0.05, 0.8, 0.2] } }}
                        exit={{ opacity: 0, y: 12, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } }}
                      >
                        {isContact ? (
                          <button
                            type="button"
                            className="editorial-social-link"
                            onClick={() => {
                              setIsOpen(false)
                              if (isAboutOpen) {
                                setIsAboutOpen(false)
                              }
                              if (currentView !== 'home') {
                                setCurrentView('home')
                                setTimeout(() => {
                                  scrollToContact()
                                }, 140)
                              } else {
                                setTimeout(() => {
                                  scrollToContact()
                                }, 80)
                              }
                            }}
                          >
                            <span>{link.label}</span>
                            <span className="editorial-link-arrow">↗</span>
                          </button>
                        ) : (
                          <a
                            href={link.href}
                            className="editorial-social-link"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              trackSocialClick(link.label.toLowerCase())
                              setIsOpen(false)
                            }}
                          >
                            <span>{link.label}</span>
                            <span className="editorial-link-arrow">↗</span>
                          </a>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Main Divider */}
              <div className="editorial-panel-divider" />

              {/* Lower Utility Area */}
              <div className="editorial-panel-footer-meta">
                <span className="editorial-meta-left">DESIGN · ART · PLAY</span>
                <span className="editorial-meta-right">TOBI XP</span>
              </div>

              {/* Bottom Oversized Scrolling Marquee */}
              <div className="editorial-marquee-container" aria-hidden="true">
                <div className="editorial-marquee-track">
                  <span className="editorial-marquee-text">
                    TOBI XP &nbsp;·&nbsp; DESIGN &nbsp;·&nbsp; ART &nbsp;·&nbsp; PLAY &nbsp;·&nbsp; INTERACTION &nbsp;·&nbsp; EXPERIENCE &nbsp;·&nbsp;&nbsp;
                  </span>
                  <span className="editorial-marquee-text">
                    TOBI XP &nbsp;·&nbsp; DESIGN &nbsp;·&nbsp; ART &nbsp;·&nbsp; PLAY &nbsp;·&nbsp; INTERACTION &nbsp;·&nbsp; EXPERIENCE &nbsp;·&nbsp;&nbsp;
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mouse-Following Contextual Card */}
      <AnimatePresence>
        {showHoverCard && currentCardText && (
          <motion.div
            className="store-coming-soon-card nav-hover-card"
            style={{
              x: smoothX,
              y: smoothY,
            }}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            <span>{currentCardText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
