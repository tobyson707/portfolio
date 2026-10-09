import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useProgress, useGLTF } from '@react-three/drei'
import { useStore } from '../store'
import { heroModelManager } from '../scene/heroModelManager'

type LoadingScreenProps = {
  onComplete?: () => void
}

type LoadingState = 'LOADING' | 'COMPLETE' | 'EXITING'

const getLoadingMessage = (progress: number, status: string, error?: string | null) => {
  if (status === 'error') return error ? `character load issue: ${error.toLowerCase()}` : '3d character could not be loaded'
  if (progress >= 100) return "alright, let's go."
  if (progress >= 85) return "okay, we're getting somewhere"
  if (progress >= 60) return 'almost there'
  if (progress >= 40) return 'putting some things together'
  if (progress >= 20) return 'getting things ready'

  return 'okay, give me a second...'
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const enter = useStore((s) => s.enter)
  const entered = useStore((s) => s.entered)
  const heroModelReady = useStore((s) => s.heroModelReady)
  const heroModelStatus = useStore((s) => s.heroModelStatus)
  const heroModelProgress = useStore((s) => s.heroModelProgress)
  const heroModelError = useStore((s) => s.heroModelError)
  const theme = useStore((s) => s.theme)

  // Drei useProgress tracks all Three.js DefaultLoadingManager items (e.g. env.hdr)
  const { progress: dreiProgress, errors: dreiErrors } = useProgress()

  const [loadingState, setLoadingState] = useState<LoadingState>('LOADING')
  const [isRemoved, setIsRemoved] = useState(() => entered)
  const [progressValue, setProgressValue] = useState(0)
  const hasTriggeredCompleteRef = useRef(false)

  // Calculate genuine progress percentage:
  // - While model is loading/parsing, reflects real byte progress up to 94%
  // - 100% is REACHED ONLY when heroModelReady is true (model loaded, mounted, and first frame rendered)
  // - In error state, does not reach 100%
  useEffect(() => {
    if (loadingState !== 'LOADING') return

    if (heroModelReady && heroModelStatus === 'ready') {
      setProgressValue(100)
      return
    }

    if (heroModelStatus === 'error') {
      // Keep at whatever was loaded without claiming completion
      setProgressValue((prev) => Math.min(prev, 90))
      return
    }

    // Measure genuine progress from actual model download events
    const modelPct = heroModelProgress || 0
    const envPct = Number.isFinite(dreiProgress) ? Math.min(dreiProgress, 90) : 0
    const currentGenuine = Math.max(modelPct, envPct)

    // Cap at 94% until WebGL renderer confirms the first drawn frame containing the character
    const capped = Math.min(94, Math.max(0, Math.round(currentGenuine)))
    setProgressValue((prev) => Math.max(prev, capped))
  }, [heroModelReady, heroModelStatus, heroModelProgress, dreiProgress, loadingState])

  const displayProgress = loadingState === 'LOADING' ? progressValue : 100

  const message = useMemo(
    () => getLoadingMessage(displayProgress, heroModelStatus, heroModelError),
    [displayProgress, heroModelStatus, heroModelError]
  )

  // Gracefully log any asset loading errors in development
  useEffect(() => {
    if (dreiErrors.length > 0) {
      console.warn('[TOBI XP] Three.js asset loading notices:', dreiErrors)
    }
  }, [dreiErrors])

  // Completion detection:
  // Reaches COMPLETE only when the 3D model is confirmed loaded, scene-mounted, and rendered
  useEffect(() => {
    if (loadingState !== 'LOADING') return

    if (heroModelReady && heroModelStatus === 'ready' && !hasTriggeredCompleteRef.current) {
      hasTriggeredCompleteRef.current = true
      setProgressValue(100)
      setLoadingState('COMPLETE')
    }
  }, [heroModelReady, heroModelStatus, loadingState])

  // Safety fallback: prevents the portfolio from ever remaining permanently stuck
  useEffect(() => {
    if (loadingState !== 'LOADING') return

    const safetyTimer = setTimeout(() => {
      console.info('[TOBI XP] Loading safety timer triggered')
      if (heroModelStatus === 'error') {
        heroModelManager.proceedWithFallback()
      } else {
        heroModelManager.markModelReady()
      }
      setProgressValue(100)
      setLoadingState('COMPLETE')
    }, 9000)

    return () => clearTimeout(safetyTimer)
  }, [loadingState, heroModelStatus])

  // Hold completed state briefly so the user sees 100% and "alright, let's go.",
  // before smoothly sliding up the loading curtain
  useEffect(() => {
    if (loadingState !== 'COMPLETE') return

    const holdTimer = setTimeout(() => {
      const frame = requestAnimationFrame(() => {
        setLoadingState('EXITING')
        enter()
      })
      return () => cancelAnimationFrame(frame)
    }, 420)

    return () => clearTimeout(holdTimer)
  }, [loadingState, enter])

  // Lock body scroll while loading screen is active, restore upon exit
  useEffect(() => {
    if (loadingState === 'LOADING' || loadingState === 'COMPLETE') {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [loadingState])

  const handleProceedFallback = useCallback(() => {
    heroModelManager.proceedWithFallback()
    setProgressValue(100)
    setLoadingState('COMPLETE')
  }, [])

  const handleRetry = useCallback(() => {
    try {
      useGLTF.clear(`${import.meta.env.BASE_URL}models/tbxp.glb`)
    } catch {
      // ignore
    }
    heroModelManager.retry()
    setProgressValue(0)
    setLoadingState('LOADING')
    hasTriggeredCompleteRef.current = false
  }, [])

  if (isRemoved || entered) return null

  return (
    <motion.div
      className="loading-screen"
      data-theme={theme}
      initial={{ y: 0 }}
      animate={{
        y: loadingState === 'EXITING' ? '-100%' : '0%',
      }}
      style={{
        pointerEvents: loadingState === 'EXITING' ? 'none' : 'auto',
      }}
      transition={{
        duration: 1.05,
        ease: [0.76, 0, 0.24, 1],
      }}
      onAnimationComplete={() => {
        if (loadingState === 'EXITING') {
          setIsRemoved(true)
          onComplete?.()
        }
      }}
    >
      <div className="loading-screen__top">
        <div className="loading-screen__name">
          TOBI
        </div>

        <div className="loading-screen__top-right">
          <div className="loading-screen__xp">
            XP
          </div>
          <div className="loading-screen__descriptor">
            FIGURING IT OUT AS I GO.
          </div>
        </div>
      </div>

      <div className="loading-screen__bottom">
        <div className="loading-screen__progress-info">
          <div className="loading-screen__percentage">
            {displayProgress}%
          </div>

          <div
            className="loading-screen__message"
            aria-live="polite"
          >
            {message}
            {heroModelStatus === 'error' && (
              <div className="loading-screen__fallback-actions">
                <button
                  type="button"
                  className="loading-screen__fallback-btn"
                  onClick={handleProceedFallback}
                >
                  Continue with fallback
                </button>
                <button
                  type="button"
                  className="loading-screen__fallback-btn"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="loading-screen__progress">
          <div className="loading-screen__progress-track">
            <div
              className="loading-screen__progress-fill"
              style={{
                width: `${displayProgress}%`,
              }}
            />
          </div>

          <div className="loading-screen__ticks" aria-hidden="true">
            {Array.from({ length: 40 }).map((_, index) => (
              <span
                key={index}
                className={index < (displayProgress / 100) * 40 ? 'is-active' : ''}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
