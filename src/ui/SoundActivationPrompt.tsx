import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'
import { audioManager } from '../services/audioManager'
import { useStore } from '../store'

// In-memory session dismissal flag (resets ONLY on full page reload)
let hasBeenDismissedInSession = false

export default function SoundActivationPrompt() {
  const entered = useStore((s) => s.entered)
  const currentView = useStore((s) => s.currentView)
  
  const [isDismissed, setIsDismissed] = useState<boolean>(() => hasBeenDismissedInSession)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [hasPointerMoved, setHasPointerMoved] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Motion values for smooth cursor tracking on desktop
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  // Spring physics for responsive yet smooth floating feel
  const springConfig = { damping: 24, stiffness: 280, mass: 0.35 }
  const springX = useSpring(cursorX, springConfig)
  const springY = useSpring(cursorY, springConfig)

  const isDismissedRef = useRef(isDismissed)
  isDismissedRef.current = isDismissed

  // Check touch device & reduced motion preference on mount
  useEffect(() => {
    const checkTouch = () => {
      const isCoarse = window.matchMedia('(pointer: coarse)').matches
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsTouchDevice(isCoarse || hasTouch)
    }

    const checkReducedMotion = () => {
      setPrefersReducedMotion(
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
    }

    checkTouch()
    checkReducedMotion()

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    motionQuery.addEventListener('change', handleMotionChange)

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // Dismiss handler that triggers audio playback and dismisses card in-memory
  const handleActivation = useCallback(() => {
    if (isDismissedRef.current || hasBeenDismissedInSession) return

    hasBeenDismissedInSession = true
    setIsDismissed(true)

    // Trigger audio playback through centralized audioManager
    try {
      const state = audioManager.getState()
      if (!state.isPlaying && !state.isMuted) {
        audioManager.play(true)
      }
    } catch (err) {
      console.info('[TOBI XP] Background audio initial play handler notice:', err)
    }
  }, [])

  // Global window listener for first user interaction (click, tap, pointerdown)
  useEffect(() => {
    if (isDismissed || hasBeenDismissedInSession) return

    const onUserInteraction = (_e: MouseEvent | TouchEvent | PointerEvent) => {
      // Allow the click to propagate normally to any underlying interactive elements
      handleActivation()
    }

    // Capture phase ensures we receive the event even if stopped or prevented by children
    window.addEventListener('click', onUserInteraction, { capture: true, passive: true })
    window.addEventListener('touchend', onUserInteraction, { capture: true, passive: true })
    window.addEventListener('pointerdown', onUserInteraction, { capture: true, passive: true })

    return () => {
      window.removeEventListener('click', onUserInteraction, { capture: true })
      window.removeEventListener('touchend', onUserInteraction, { capture: true })
      window.removeEventListener('pointerdown', onUserInteraction, { capture: true })
    }
  }, [isDismissed, handleActivation])

  // Track cursor movement on desktop
  useEffect(() => {
    if (isDismissed || hasBeenDismissedInSession || isTouchDevice) return

    const handleMouseMove = (e: MouseEvent) => {
      // Offset card slightly so it never blocks the pointer (20px right, 20px down)
      const targetX = e.clientX + 20
      const targetY = e.clientY + 20

      // Keep within viewport boundaries
      const cardEstimatedWidth = 240
      const cardEstimatedHeight = 50
      const maxX = window.innerWidth - cardEstimatedWidth - 12
      const maxY = window.innerHeight - cardEstimatedHeight - 12

      const clampedX = Math.min(Math.max(12, targetX), maxX)
      const clampedY = Math.min(Math.max(12, targetY), maxY)

      cursorX.set(clampedX)
      cursorY.set(clampedY)

      if (!hasPointerMoved) {
        setHasPointerMoved(true)
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isDismissed, isTouchDevice, hasPointerMoved, cursorX, cursorY])

  // Also auto-dismiss if sound is started via SoundControl before first screen click
  useEffect(() => {
    const unsubscribe = audioManager.subscribe((state) => {
      if (state.isPlaying && !hasBeenDismissedInSession) {
        hasBeenDismissedInSession = true
        setIsDismissed(true)
      }
    })
    return () => unsubscribe()
  }, [])

  // If already dismissed, don't render anything
  if (isDismissed || hasBeenDismissedInSession) {
    return null
  }

  // Only show on home view once loading curtain has lifted (entered is true)
  const isVisible = entered && currentView === 'home'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="sound-activation-prompt"
          className={`sound-activation-prompt ${isTouchDevice ? 'is-touch' : 'is-desktop'}`}
          initial={{ opacity: 0, scale: 0.92, y: isTouchDevice ? 16 : 0 }}
          animate={{
            opacity: (!isTouchDevice && !hasPointerMoved) ? 0 : 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.94,
            transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
          }}
          transition={{
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
            delay: isTouchDevice ? 0.3 : 0.1,
          }}
          style={
            !isTouchDevice
              ? prefersReducedMotion
                ? {
                    position: 'fixed',
                    left: cursorX,
                    top: cursorY,
                    pointerEvents: 'none',
                    zIndex: 9999,
                  }
                : {
                    position: 'fixed',
                    left: springX,
                    top: springY,
                    pointerEvents: 'none',
                    zIndex: 9999,
                  }
              : {
                  position: 'fixed',
                  top: 'max(80px, calc(env(safe-area-inset-top, 20px) + 64px))',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none',
                  zIndex: 9999,
                }
          }
          aria-hidden="true"
        >
          <div className="sound-prompt-inner">
            <span className="sound-prompt-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </span>
            <span className="sound-prompt-text">
              {isTouchDevice ? 'Tap anywhere to play sound' : 'Click anywhere to play sound'}
            </span>
            <span className="sound-prompt-pulse" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
