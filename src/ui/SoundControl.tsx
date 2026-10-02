import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react'
import { trackAudioInteraction } from '../services/analytics'
import { audioManager, type AudioState } from '../services/audioManager'

export interface SoundControlProps {
  /** Optional controlled state for future audio integration */
  isSoundOn?: boolean
  /** Callback fired when the sound button is toggled */
  onToggle?: (nextState: boolean) => void
  /** Optional custom class name */
  className?: string
}

/**
 * SoundControl — TOBI XP
 * Persistent background audio control with smooth fade transitions and volume slider.
 */
export default function SoundControl({
  isSoundOn: controlledSoundOn,
  onToggle,
  className = '',
}: SoundControlProps) {
  const [audioState, setAudioState] = useState<AudioState>(() => audioManager.getState())
  const [isCardOpen, setIsCardOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { isPlaying, isMuted, volume } = audioState

  // Subscribe to central audio manager state updates
  useEffect(() => {
    const unsubscribe = audioManager.subscribe((newState) => {
      setAudioState(newState)
    })
    return unsubscribe
  }, [])

  // Close hover card on outside click (touch devices)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsCardOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [])

  // Controlled prop sync
  useEffect(() => {
    if (controlledSoundOn !== undefined) {
      if (controlledSoundOn) {
        audioManager.setMuted(false)
        audioManager.play(true)
      } else {
        audioManager.setMuted(true)
      }
    }
  }, [controlledSoundOn])

  const handleToggle = useCallback(() => {
    setIsCardOpen((prev) => !prev)

    if (isMuted || !isPlaying || volume === 0) {
      audioManager.toggle()
      trackAudioInteraction({ action: 'play' })
      onToggle?.(true)
    } else {
      audioManager.toggle()
      trackAudioInteraction({ action: 'mute' })
      onToggle?.(false)
    }
  }, [isMuted, isPlaying, volume, onToggle])

  const handleVolumeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      audioManager.setVolume(val)
      if (val > 0) {
        trackAudioInteraction({ action: 'unmute' })
        onToggle?.(true)
      } else {
        trackAudioInteraction({ action: 'mute' })
        onToggle?.(false)
      }
    },
    [onToggle]
  )

  const isSoundActive = !isMuted && volume > 0 && isPlaying
  const isAnimating = isSoundActive

  return (
    <div
      ref={wrapperRef}
      className={`sound-control-wrapper ${className}`.trim()}
      onMouseEnter={() => setIsCardOpen(true)}
      onMouseLeave={() => setIsCardOpen(false)}
    >
      {/* Floating Hover Volume Card */}
      <div
        className={`sound-volume-card ${isCardOpen ? 'is-open' : ''}`}
        aria-hidden={!isCardOpen}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sound-volume-slider-wrap">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="sound-volume-slider"
            aria-label="Background audio volume"
          />
        </div>
      </div>

      <button
        type="button"
        className={`sound-control-btn ${isSoundActive ? 'is-active' : 'is-muted'}`}
        onClick={handleToggle}
        aria-label={
          isSoundActive
            ? 'Mute background audio'
            : 'Turn background audio on'
        }
        aria-pressed={isSoundActive}
      >
        <span className="sound-icon-box" aria-hidden="true">
          {/* Speaker icon */}
          <svg
            className="sound-speaker-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            {(!isSoundActive || volume === 0) && (
              <>
                <line x1="22" y1="9" x2="16" y2="15" />
                <line x1="16" y1="9" x2="22" y2="15" />
              </>
            )}
          </svg>

          {/* Minimal 3-bar animated playback indicator */}
          <div
            className={`sound-indicator ${isAnimating ? 'is-playing' : ''}`}
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </div>
        </span>
      </button>
    </div>
  )
}
