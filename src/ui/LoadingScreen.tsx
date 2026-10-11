import { useEffect, useMemo, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { useStore } from '../store'

type LoadingScreenProps = {
  onComplete?: () => void
}

type LoadingState = 'LOADING' | 'COMPLETE' | 'EXITING'

const getLoadingMessage = (progress: number, isIncomplete: boolean) => {
  if (isIncomplete) {
    return 'INITIALISATION INCOMPLETE'
  }
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
  const heroEnvReady = useStore((s) => s.heroEnvReady)
  const heroEnvStatus = useStore((s) => s.heroEnvStatus)
  const heroEnvProgress = useStore((s) => s.heroEnvProgress)
  const theme = useStore((s) => s.theme)

  // Drei useProgress tracks all Three.js DefaultLoadingManager items (e.g. env.hdr)
  const { progress: dreiProgress, errors: dreiErrors } = useProgress()

  const [loadingState, setLoadingState] = useState<LoadingState>('LOADING')
  const [isRemoved, setIsRemoved] = useState(() => entered)
  const [progressValue, setProgressValue] = useState(0)
  const [isTimedOut, setIsTimedOut] = useState(false)
  const hasTriggeredCompleteRef = useRef(false)

  // Strict Authoritative Readiness: requires original model AND complete lighting environment rendered
  const isOverallError = heroModelStatus === 'error' || heroEnvStatus === 'error' || isTimedOut
  const isOverallReady = heroModelReady && heroModelStatus === 'ready' && heroEnvReady && heroEnvStatus === 'ready'

  // Timeout handler: if initialization times out, keep loading screen displayed indefinitely
  // without retry buttons, fallbacks, or bypasses.
  useEffect(() => {
    if (loadingState !== 'LOADING') return
    const timeoutDuration = 35000 // 35 seconds
    const timer = setTimeout(() => {
      if (!isOverallReady) {
        setIsTimedOut(true)
      }
    }, timeoutDuration)
    return () => clearTimeout(timer)
  }, [loadingState, isOverallReady])

  // Calculate genuine progress percentage reflecting BOTH mandatory dependencies
  useEffect(() => {
    if (loadingState !== 'LOADING') return

    if (isOverallReady) {
      setProgressValue(100)
      return
    }

    if (isOverallError) {
      // Keep at whatever was loaded without claiming completion
      setProgressValue((prev) => Math.min(prev, 90))
      return
    }

    // Measure genuine progress from actual model and environment download/decode events
    const modelPct = heroModelProgress || 0
    const envBytePct = Number.isFinite(dreiProgress) ? Math.min(dreiProgress, 90) : 0
    const envPct = Math.max(heroEnvProgress || 0, envBytePct)

    // True composite progress of both mandatory initial dependencies
    const combinedGenuine = Math.round(modelPct * 0.5 + envPct * 0.5)

    // Strictly capped at 95% until WebGL renderer confirms the first frame with model + lighting
    const capped = Math.min(95, Math.max(0, combinedGenuine))
    setProgressValue((prev) => Math.max(prev, capped))
  }, [isOverallReady, isOverallError, heroModelProgress, heroEnvProgress, dreiProgress, loadingState])

  const displayProgress = loadingState === 'LOADING' ? progressValue : 100

  const message = useMemo(
    () => getLoadingMessage(displayProgress, isOverallError),
    [displayProgress, isOverallError]
  )

  // Gracefully log any asset loading errors in development
  useEffect(() => {
    if (dreiErrors.length > 0) {
      console.warn('[TOBI XP] Three.js asset loading notices:', dreiErrors)
    }
  }, [dreiErrors])

  // Completion detection:
  // Reaches COMPLETE only when BOTH the 3D model and the complete lighting environment
  // are confirmed loaded, scene-mounted, and successfully rendered together
  useEffect(() => {
    if (loadingState !== 'LOADING') return

    if (isOverallReady && !hasTriggeredCompleteRef.current) {
      hasTriggeredCompleteRef.current = true
      setProgressValue(100)
      setLoadingState('COMPLETE')
    }
  }, [isOverallReady, loadingState])

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
