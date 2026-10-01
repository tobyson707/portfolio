import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react'
import { useContentStore } from '../services/contentStore'
import { trackAudioInteraction } from '../services/analytics'

export interface SoundControlProps {
  /** Optional controlled state for future audio integration */
  isSoundOn?: boolean
  /** Callback fired when the sound button is toggled */
  onToggle?: (nextState: boolean) => void
  /** Optional custom class name */
  className?: string
}

const LOCAL_STORAGE_VOLUME_KEY = 'tobi_xp_volume'
const LOCAL_STORAGE_MUTED_KEY = 'tobi_xp_muted'

/**
 * SoundControl — TOBI XP
 * Persistent background audio control connected to Admin Settings.
 * Supports uploaded Firebase Storage background audio with ambient soundscape fallback.
 */
export default function SoundControl({
  isSoundOn: controlledSoundOn,
  onToggle,
  className = '',
}: SoundControlProps) {
  const audioConfig = useContentStore((s) => s.settings.audio)
  const isAudioGloballyEnabled = audioConfig?.enabled !== false
  const audioUrl = audioConfig?.backgroundSoundUrl || ''

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return true
    const savedMuted = localStorage.getItem(LOCAL_STORAGE_MUTED_KEY)
    return savedMuted !== null ? savedMuted === 'true' : true
  })
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 0.7
    const savedVol = localStorage.getItem(LOCAL_STORAGE_VOLUME_KEY)
    return savedVol !== null ? parseFloat(savedVol) : (audioConfig?.defaultVolume ?? 0.7)
  })
  const [isCardOpen, setIsCardOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // HTML5 Audio element reference for uploaded tracks
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // Web Audio fallback synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const nodesRef = useRef<OscillatorNode[]>([])

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

  // Initialize or update HTML5 Audio when audioUrl changes
  useEffect(() => {
    if (!audioUrl) {
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current.src = ''
        audioElementRef.current = null
      }
      return
    }

    const prevAudio = audioElementRef.current
    if (prevAudio && prevAudio.src === audioUrl) {
      return
    }

    if (prevAudio) {
      prevAudio.pause()
      prevAudio.src = ''
    }

    const audio = new Audio(audioUrl)
    audio.loop = true
    audio.preload = 'auto'
    audioElementRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [audioUrl])

  // Web Audio synthesizer fallback when no custom audio file is uploaded
  const initSynthFallback = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }
      return
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0, ctx.currentTime)
      masterGain.connect(ctx.destination)
      masterGainRef.current = masterGain

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(320, ctx.currentTime)
      filter.connect(masterGain)

      const freqs = [130.81, 196.0, 261.63]
      const oscs = freqs.map((freq, i) => {
        const osc = ctx.createOscillator()
        osc.type = i === 1 ? 'triangle' : 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        osc.detune.setValueAtTime((i - 1) * 3, ctx.currentTime)

        const oscGain = ctx.createGain()
        oscGain.gain.setValueAtTime(0.06 / (i + 1), ctx.currentTime)

        osc.connect(oscGain)
        oscGain.connect(filter)
        osc.start()
        return osc
      })

      nodesRef.current = oscs
    } catch (err) {
      console.warn('[TOBI XP] Audio context initialization:', err)
    }
  }, [])

  // Start sound playback (either file or synthesizer)
  const startPlayback = useCallback(() => {
    if (!isAudioGloballyEnabled) return

    if (audioUrl && audioElementRef.current) {
      audioElementRef.current.volume = isMuted ? 0 : volume
      audioElementRef.current.play().catch((err) => {
        console.warn('[TOBI XP Sound] Playback start error:', err)
      })
    } else {
      initSynthFallback()
    }
    setIsPlaying(true)
  }, [audioUrl, isAudioGloballyEnabled, isMuted, volume, initSynthFallback])

  // Sync volume & mute changes to both audio element and fallback gain node
  useEffect(() => {
    const targetVolume = !isMuted && isPlaying && isAudioGloballyEnabled ? volume : 0

    if (audioElementRef.current) {
      audioElementRef.current.volume = Math.max(0, Math.min(1, targetVolume))
      if (targetVolume > 0 && audioElementRef.current.paused && isPlaying) {
        audioElementRef.current.play().catch(() => {})
      } else if (targetVolume === 0 && !audioElementRef.current.paused) {
        audioElementRef.current.pause()
      }
    }

    if (audioCtxRef.current && masterGainRef.current) {
      const ctx = audioCtxRef.current
      const gainVal = targetVolume * 0.12
      try {
        masterGainRef.current.gain.setTargetAtTime(gainVal, ctx.currentTime, 0.06)
      } catch {
        masterGainRef.current.gain.value = gainVal
      }
    }

    localStorage.setItem(LOCAL_STORAGE_VOLUME_KEY, String(volume))
    localStorage.setItem(LOCAL_STORAGE_MUTED_KEY, String(isMuted))
  }, [isMuted, isPlaying, volume, isAudioGloballyEnabled])

  // Controlled prop sync
  useEffect(() => {
    if (controlledSoundOn !== undefined) {
      if (controlledSoundOn && isAudioGloballyEnabled) {
        startPlayback()
        setIsMuted(false)
      } else {
        setIsMuted(true)
      }
    }
  }, [controlledSoundOn, isAudioGloballyEnabled, startPlayback])

  const handleToggle = useCallback(() => {
    setIsCardOpen((prev) => !prev)

    if (!isAudioGloballyEnabled) {
      // Audio is disabled in Admin Settings
      return
    }

    if (isMuted || !isPlaying || volume === 0) {
      setIsMuted(false)
      if (volume === 0) {
        setVolume(audioConfig?.defaultVolume ?? 0.7)
      }
      startPlayback()
      trackAudioInteraction({ action: 'play' })
      onToggle?.(true)
    } else {
      setIsMuted(true)
      trackAudioInteraction({ action: 'mute' })
      onToggle?.(false)
    }
  }, [isAudioGloballyEnabled, isMuted, isPlaying, volume, audioConfig, startPlayback, onToggle])

  const handleVolumeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      setVolume(val)
      if (val > 0) {
        if (isMuted) {
          setIsMuted(false)
          startPlayback()
          trackAudioInteraction({ action: 'unmute' })
          onToggle?.(true)
        }
      } else {
        setIsMuted(true)
        trackAudioInteraction({ action: 'mute' })
        onToggle?.(false)
      }
    },
    [isMuted, startPlayback, onToggle]
  )

  const isAnimating = isPlaying && !isMuted && volume > 0 && isAudioGloballyEnabled
  const isSoundActive = !isMuted && volume > 0 && isAudioGloballyEnabled

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
            value={isMuted || !isAudioGloballyEnabled ? 0 : volume}
            onChange={handleVolumeChange}
            className="sound-volume-slider"
            aria-label="Background audio volume"
            disabled={!isAudioGloballyEnabled}
          />
        </div>
      </div>

      <button
        type="button"
        className={`sound-control-btn ${isSoundActive ? 'is-active' : 'is-muted'}`}
        onClick={handleToggle}
        aria-label={
          !isAudioGloballyEnabled
            ? 'Background audio disabled'
            : isSoundActive
            ? 'Mute background audio'
            : 'Turn background audio on'
        }
        aria-pressed={isSoundActive}
        title={!isAudioGloballyEnabled ? 'Sound disabled in admin settings' : undefined}
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
