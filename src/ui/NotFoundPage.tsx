import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { trackPageView } from '../services/analytics'

const EASE = [0.16, 1, 0.3, 1]

export default function NotFoundPage() {
  const setCurrentView = useStore((state) => state.setCurrentView)

  useEffect(() => {
    document.title = '404 — Page Not Found | Tobi XP'
    trackPageView('404 Not Found', '/404')
    return () => {
      document.title = 'Tobi XP | Illustrator, Character Designer & Product Designer'
    }
  }, [])

  const handleBackHome = () => {
    setCurrentView('home')
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/')
    }
  }

  return (
    <div className="not-found-root" lang="en">
      {/* Top Header Logo */}
      <header className="about-top-bar">
        <button
          type="button"
          className="about-logo-btn"
          onClick={handleBackHome}
          aria-label="Return to Home"
          title="Return to Home"
        >
          <img
            src={`${import.meta.env.BASE_URL}images/xp.png`}
            alt="TOBI XP"
            className="hero-xp-logo"
          />
        </button>
      </header>

      {/* Main Content Container */}
      <main className="not-found-container">
        <motion.div
          className="not-found-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {/* Eyebrow */}
          <motion.span
            className="not-found-eyebrow"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
          >
            ERROR 404
          </motion.span>

          {/* Oversized 404 Typography */}
          <motion.h1
            className="not-found-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15, ease: EASE }}
          >
            4<span className="not-found-orange">0</span>4
          </motion.h1>

          {/* Primary Message */}
          <motion.h2
            className="not-found-heading"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          >
            Looks like you took a wrong turn.
          </motion.h2>

          {/* Supporting Text */}
          <motion.p
            className="not-found-desc"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: EASE }}
          >
            Nothing to see here. Let&apos;s get you back on track.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            className="not-found-action"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
          >
            <button
              type="button"
              className="not-found-btn"
              onClick={handleBackHome}
            >
              <span>BACK TO HOME</span>
              <span className="not-found-arrow">↗</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Playful Floating XP badge accent */}
        <motion.div
          className="not-found-badge"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
          aria-hidden="true"
        >
          <span>TOBI XP &middot; 404</span>
        </motion.div>
      </main>
    </div>
  )
}
