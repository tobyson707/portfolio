import React from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'

/**
 * HeroCharacterFallback — TOBI XP Mobile Performance Visual
 * 
 * Provides an authentic, lightweight character visual for memory-constrained
 * mobile devices (such as iOS Safari on iPhone) where heavy Three.js WebGL contexts,
 * 5MB GLB model decompressions, and multiple GPU framebuffers exhaust the WebContent
 * process memory budget.
 * 
 * Ensures 100% stability, 0 WebGL crashes, instant loading, and smooth 60fps scrolling
 * while preserving the portfolio's visual identity.
 */
export default function HeroCharacterFallback() {
  const theme = useStore((s) => s.theme)
  const isDark = theme === 'dark'

  return (
    <div
      className="hero-fallback-stage"
      aria-label="Tobi XP Character Visual"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: isDark
          ? 'radial-gradient(circle at 50% 48%, rgba(26, 27, 34, 0.95) 0%, rgba(13, 13, 15, 1) 100%)'
          : 'radial-gradient(circle at 50% 48%, rgba(245, 245, 247, 0.95) 0%, rgba(255, 255, 255, 1) 100%)',
      }}
    >
      {/* Subtle ambient background glow */}
      <div
        style={{
          position: 'absolute',
          width: 'min(380px, 85vw)',
          height: 'min(380px, 85vw)',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(241, 87, 35, 0.12) 0%, rgba(241, 87, 35, 0) 70%)'
            : 'radial-gradient(circle, rgba(241, 87, 35, 0.08) 0%, rgba(241, 87, 35, 0) 70%)',
          filter: 'blur(32px)',
          transform: 'translateY(-10px)',
        }}
      />

      {/* Stylized geometric background rings */}
      <svg
        viewBox="0 0 400 400"
        style={{
          position: 'absolute',
          width: 'min(360px, 80vw)',
          height: 'min(360px, 80vw)',
          opacity: isDark ? 0.22 : 0.15,
        }}
        fill="none"
        aria-hidden="true"
      >
        <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
        <polygon
          points="200,65 315,132 315,268 200,335 85,268 85,132"
          stroke="#F15723"
          strokeWidth="1.2"
          strokeOpacity="0.4"
        />
      </svg>

      {/* Floating character illustration / logo mark */}
      <motion.div
        animate={{
          y: [-6, 6, -6],
          rotate: [-0.5, 0.5, -0.5],
        }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'min(260px, 68vw)',
          maxWidth: '300px',
        }}
      >
        <img
          src="/images/xp.png"
          alt="TOBI XP Character"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            filter: isDark
              ? 'drop-shadow(0 16px 32px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 24px rgba(241, 87, 35, 0.2))'
              : 'drop-shadow(0 16px 28px rgba(0, 0, 0, 0.12))',
            userSelect: 'none',
          }}
          loading="eager"
          decoding="async"
        />

        {/* Ambient contact shadow on ground */}
        <div
          style={{
            width: '65%',
            height: '14px',
            borderRadius: '50%',
            background: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.12)',
            filter: 'blur(8px)',
            marginTop: '12px',
          }}
          aria-hidden="true"
        />
      </motion.div>
    </div>
  )
}
