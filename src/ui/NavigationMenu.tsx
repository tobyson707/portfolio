import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useStore } from '../store'
import { useContentStore } from '../services/contentStore'
import { scrollToContact } from '../utils/scroll'
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
        if (currentView !== 'about') {
          window.scrollTo({ top: 0, behavior: 'instant' })
          setCurrentView('about')
        }
      } else if (item.id === 'home') {
        if (currentView !== 'home') {
          window.scrollTo({ top: 0, behavior: 'instant' })
          setCurrentView('home')
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } else if (item.id === 'works') {
        if (currentView !== 'home') {
          window.scrollTo({ top: 0, behavior: 'instant' })
          setCurrentView('home')
          setTimeout(() => {
            const target = document.getElementById('works')
            if (target) {
              target.scrollIntoView({ behavior: 'smooth' })
            }
          }, 120)
        } else {
          const target = document.getElementById('works')
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' })
          }
        }
      }
    },
    [currentView, setCurrentView]
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
      {/* Top-right trigger button */}
      <div className="nav-trigger-wrapper">
        <button
          type="button"
          className={`nav-trigger-btn ${isOpen ? 'is-open' : ''}`}
          onClick={() => {
            setIsOpen((prev) => {
              const next = !prev
              if (next) trackMenuInteraction({ action: 'open' })
              return next
            })
          }}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="nav-hamburger-icon" aria-hidden="true">
            <span className="nav-hamburger-line line-1" />
            <span className="nav-hamburger-line line-2" />
            <span className="nav-hamburger-line line-3" />
          </span>
        </button>
      </div>

      {/* Editorial Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="editorial-menu-backdrop"
            initial={{ opacity: 0, pointerEvents: 'none' }}
            animate={{ opacity: 1, pointerEvents: 'auto' }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="editorial-menu-panel"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
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
                  ×
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
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {isContact ? (
                          <button
                            type="button"
                            className="editorial-social-link"
                            onClick={() => {
                              setIsOpen(false)
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
                <a
                  href="/admin"
                  className="editorial-meta-right"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsOpen(false)
                    window.history.pushState({}, '', '/admin')
                    window.dispatchEvent(new PopStateEvent('popstate'))
                  }}
                  title="Admin Console"
                  style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                >
                  TOBI XP
                </a>
              </div>

              {/* Bottom Oversized Scrolling Marquee */}
              <div className="editorial-marquee-container" aria-hidden="true">
                <div className="editorial-marquee-track">
                  <span className="editorial-marquee-text">
                    TOBI XP &nbsp;·&nbsp; ILLUSTRATOR &nbsp;·&nbsp; DESIGNER &nbsp;·&nbsp; DESIGN &nbsp;·&nbsp; ART &nbsp;·&nbsp; PLAY &nbsp;·&nbsp; INTERACTION &nbsp;·&nbsp; EXPERIENCE &nbsp;·&nbsp;&nbsp;
                  </span>
                  <span className="editorial-marquee-text">
                    TOBI XP &nbsp;·&nbsp; ILLUSTRATOR &nbsp;·&nbsp; DESIGNER &nbsp;·&nbsp; DESIGN &nbsp;·&nbsp; ART &nbsp;·&nbsp; PLAY &nbsp;·&nbsp; INTERACTION &nbsp;·&nbsp; EXPERIENCE &nbsp;·&nbsp;&nbsp;
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
