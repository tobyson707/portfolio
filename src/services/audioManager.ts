/**
 * TOBI XP — Central Background Audio Manager
 * Manages background music playback with smooth fade-in/fade-out, continuous looping,
 * persistent volume/mute state, and auto-initiation on first user interaction.
 */

const AUDIO_URL = '/audio/beat%20(1).mp3'
const LOCAL_STORAGE_VOLUME_KEY = 'tobi_xp_volume'
const LOCAL_STORAGE_MUTED_KEY = 'tobi_xp_muted'
const DEFAULT_VOLUME = 0.4
const FADE_IN_DURATION_MS = 1000
const FADE_OUT_DURATION_MS = 600

export interface AudioState {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  isReady: boolean
}

type AudioListener = (state: AudioState) => void

class AudioManager {
  private audio: HTMLAudioElement | null = null
  private listeners = new Set<AudioListener>()
  private fadeAnimationId: number | null = null
  private isUserInteracted = false
  private duckMultiplier = 1.0

  private state: AudioState = {
    isPlaying: false,
    isMuted: false,
    volume: DEFAULT_VOLUME,
    isReady: false,
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initFromStorage()
      this.initAudio()
      this.setupInteractionListeners()
    }
  }

  private initFromStorage() {
    try {
      const savedVol = localStorage.getItem(LOCAL_STORAGE_VOLUME_KEY)
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol)
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.state.volume = parsed
        }
      }

      const savedMuted = localStorage.getItem(LOCAL_STORAGE_MUTED_KEY)
      if (savedMuted !== null) {
        this.state.isMuted = savedMuted === 'true'
      }
    } catch {
      // Storage access may be restricted in private browsing mode
    }
  }

  private initAudio() {
    if (this.audio) return
    const audio = new Audio()
    audio.src = AUDIO_URL
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    this.audio = audio
    this.state.isReady = true

    audio.addEventListener('play', () => {
      this.state.isPlaying = true
      this.notify()
    })

    audio.addEventListener('pause', () => {
      this.state.isPlaying = false
      this.notify()
    })

    audio.addEventListener('error', (e) => {
      console.warn('[TOBI XP Audio] Background music playback notice:', e)
    })
  }

  private setupInteractionListeners() {
    const handleFirstInteraction = () => {
      this.isUserInteracted = true
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
      window.removeEventListener('touchstart', handleFirstInteraction)
      window.removeEventListener('pointerdown', handleFirstInteraction)

      // Start playback with smooth fade-in if not muted and not already playing
      if (!this.state.isMuted && this.state.volume > 0) {
        this.play(true)
      }
    }

    window.addEventListener('click', handleFirstInteraction, { passive: true })
    window.addEventListener('keydown', handleFirstInteraction, { passive: true })
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true })
    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true })
  }

  private cancelFade() {
    if (this.fadeAnimationId !== null) {
      cancelAnimationFrame(this.fadeAnimationId)
      this.fadeAnimationId = null
    }
  }

  private fadeVolumeTo(targetVolume: number, durationMs: number, onComplete?: () => void) {
    if (!this.audio) return
    this.cancelFade()

    const startVolume = this.audio.volume
    const startTime = performance.now()
    const diff = targetVolume - startVolume

    if (Math.abs(diff) < 0.001 || durationMs <= 0) {
      this.audio.volume = Math.max(0, Math.min(1, targetVolume))
      onComplete?.()
      return
    }

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / durationMs)
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = startVolume + diff * ease

      if (this.audio) {
        this.audio.volume = Math.max(0, Math.min(1, current))
      }

      if (progress < 1) {
        this.fadeAnimationId = requestAnimationFrame(step)
      } else {
        if (this.audio) {
          this.audio.volume = Math.max(0, Math.min(1, targetVolume))
        }
        this.fadeAnimationId = null
        onComplete?.()
      }
    }

    this.fadeAnimationId = requestAnimationFrame(step)
  }

  public play(withFade = true) {
    if (!this.audio) this.initAudio()
    if (!this.audio) return

    const effectiveTarget = this.state.isMuted ? 0 : this.state.volume * this.duckMultiplier

    if (this.audio.paused) {
      if (withFade) {
        this.audio.volume = 0
      }
      const playPromise = this.audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.state.isPlaying = true
            this.notify()
            if (withFade) {
              this.fadeVolumeTo(effectiveTarget, FADE_IN_DURATION_MS)
            } else {
              this.audio!.volume = effectiveTarget
            }
          })
          .catch((err) => {
            // Autoplay blocked by browser until user gesture
            console.info('[TOBI XP Audio] Autoplay pending user interaction:', err?.message || err)
          })
      }
    } else {
      if (withFade) {
        this.fadeVolumeTo(effectiveTarget, FADE_IN_DURATION_MS)
      } else {
        this.audio.volume = effectiveTarget
      }
    }
  }

  public pause(withFade = true) {
    if (!this.audio || this.audio.paused) return

    if (withFade) {
      this.fadeVolumeTo(0, FADE_OUT_DURATION_MS, () => {
        if (this.audio) {
          this.audio.pause()
          this.state.isPlaying = false
          this.notify()
        }
      })
    } else {
      this.cancelFade()
      this.audio.pause()
      this.audio.volume = 0
      this.state.isPlaying = false
      this.notify()
    }
  }

  public toggle() {
    if (this.state.isMuted || !this.state.isPlaying || this.state.volume === 0) {
      if (this.state.volume === 0) {
        this.setVolume(DEFAULT_VOLUME)
      }
      this.setMuted(false)
      this.play(true)
    } else {
      this.setMuted(true)
      this.pause(true)
    }
  }

  public setVolume(newVolume: number) {
    const clamped = Math.max(0, Math.min(1, newVolume))
    this.state.volume = clamped
    try {
      localStorage.setItem(LOCAL_STORAGE_VOLUME_KEY, String(clamped))
    } catch {
      // Storage access may be restricted
    }

    if (clamped === 0) {
      this.state.isMuted = true
      try {
        localStorage.setItem(LOCAL_STORAGE_MUTED_KEY, 'true')
      } catch {
        // Storage access may be restricted
      }
      this.pause(true)
    } else {
      if (this.state.isMuted) {
        this.state.isMuted = false
        try {
          localStorage.setItem(LOCAL_STORAGE_MUTED_KEY, 'false')
        } catch {
          // Storage access may be restricted
        }
      }
      if (this.audio) {
        if (this.audio.paused) {
          this.play(true)
        } else {
          this.fadeVolumeTo(clamped * this.duckMultiplier, 150)
        }
      }
    }
    this.notify()
  }

  public setMuted(muted: boolean) {
    this.state.isMuted = muted
    try {
      localStorage.setItem(LOCAL_STORAGE_MUTED_KEY, String(muted))
    } catch {
      // Storage access may be restricted
    }

    if (muted) {
      this.pause(true)
    } else {
      if (this.state.volume === 0) {
        this.setVolume(DEFAULT_VOLUME)
      } else {
        this.play(true)
      }
    }
    this.notify()
  }

  public duckAudio(factor = 0.25) {
    this.duckMultiplier = Math.max(0, Math.min(1, factor))
    if (this.audio && !this.audio.paused && !this.state.isMuted) {
      this.fadeVolumeTo(this.state.volume * this.duckMultiplier, 300)
    }
  }

  public restoreAudio() {
    this.duckMultiplier = 1.0
    if (this.audio && !this.audio.paused && !this.state.isMuted) {
      this.fadeVolumeTo(this.state.volume, 400)
    }
  }

  public getState(): AudioState {
    return { ...this.state }
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener)
    listener(this.getState())
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    const currentState = this.getState()
    this.listeners.forEach((listener) => listener(currentState))
  }
}

export const audioManager = new AudioManager()
