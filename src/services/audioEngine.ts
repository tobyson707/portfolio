/**
 * TOBI XP — Site-Wide Central Audio Engine
 *
 * Owns the complete Web Audio API pipeline for the portfolio:
 * Audio File -> AudioContext -> SourceNode -> Pre-Gain -> Highpass -> Lowpass EQ ->
 * Stereo Panning -> Dry/Wet Convolver Reverb -> Master Gain -> Audio Output
 *
 * Provides context-aware spatial & sonic effects that smoothly, subtly, and
 * cinematically transform as the user journeys through the website.
 * Features a seamless scroll-responsive underwater effect around the Resume section.
 */

export type AudioSection =
  | 'home'
  | 'resume'
  | 'stats'
  | 'works'
  | 'about'
  | 'modal'
  | 'submerged'
  | 'SUBMERGED'
  | 'menu'
  | string

export type AudioEnvironment = 'DEFAULT' | 'SUBMERGED' | string

export interface AudioEffectParams {
  /** Lowpass filter cutoff frequency in Hz (e.g. 450 to 20000) */
  filterCutoff: number
  /** Lowpass filter resonance Q (e.g. 0.707 to 2.5) */
  filterQ: number
  /** Highpass filter cutoff frequency in Hz (e.g. 20 to 80) */
  highpassCutoff: number
  /** Stereo pan value (-1 to 1) */
  pan: number
  /** Reverb wet level (0 to 1) */
  reverbWet: number
  /** Dry signal level (0 to 1) */
  dryLevel: number
  /** Section-specific gain multiplier (0 to 1) */
  gainMultiplier: number
}

export interface AudioEngineState {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  isReady: boolean
  currentSection: string
  activeEffect: AudioEffectParams
  selectedCategory: string | null
  isSubmerged: boolean
  isMenuOpen: boolean
  environment: AudioEnvironment
}

export type AudioEngineListener = (state: AudioEngineState) => void

const getAudioUrl = (): string => {
  const baseUrl = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/'
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${cleanBase}audio/beat%20(1).mp3`
}

const LOCAL_STORAGE_VOLUME_KEY = 'tobi_xp_volume'
const LOCAL_STORAGE_MUTED_KEY = 'tobi_xp_muted'
const DEFAULT_VOLUME = 0.3 // Default volume preserved at 30%

/**
 * Peak immersive underwater / submerged reading and focus atmosphere preset.
 */
export const SUBMERGED_PRESET: AudioEffectParams = {
  filterCutoff: 480,
  filterQ: 2.2,
  highpassCutoff: 75,
  pan: 0.0,
  dryLevel: 0.45,
  reverbWet: 0.48,
  gainMultiplier: 0.82,
}

/**
 * Illustrations and Designs categories that activate the SUBMERGED audio environment.
 */
export const SUBMERGED_CATEGORIES = [
  'PAINTINGS',
  'SKETCHES',
  'STUDIES',
  'BRANDING & IDENTITY',
  'PRODUCT DESIGN',
  'STURVS',
] as const

/**
 * Returns true if the provided category name or slug is an Illustrations or Designs category
 * that activates the SUBMERGED environment.
 */
export function isSubmergedCategory(category: string | null | undefined): boolean {
  if (!category) return false
  const norm = category.trim().toUpperCase()
  if (
    norm === 'PAINTINGS' ||
    norm === 'SKETCHES' ||
    norm === 'STUDIES' ||
    norm === 'BRANDING & IDENTITY' ||
    norm === 'BRANDING AND IDENTITY' ||
    norm === 'PRODUCT DESIGN' ||
    norm === 'STURVS'
  ) {
    return true
  }
  const slug = norm.toLowerCase().replace(/[^a-z0-9]/g, '')
  return (
    slug === 'paintings' ||
    slug === 'painting' ||
    slug === 'sketches' ||
    slug === 'sketch' ||
    slug === 'studies' ||
    slug === 'study' ||
    slug === 'brandingidentity' ||
    slug === 'productdesign' ||
    slug === 'sturvs' ||
    slug === 'allillustrations' ||
    slug === 'illustrations'
  )
}

/**
 * Standard preset sonic environments for site sections
 */
export const SECTION_PRESETS: Record<string, AudioEffectParams> = {
  // Hero / Home: Crisp, punchy, direct, intimate, full-spectrum 20kHz
  home: {
    filterCutoff: 20000,
    filterQ: 0.707,
    highpassCutoff: 20,
    pan: 0.0,
    dryLevel: 1.0,
    reverbWet: 0.0,
    gainMultiplier: 1.0,
  },
  // Resume & Submerged: Peak immersive underwater / submerged reading atmosphere
  resume: SUBMERGED_PRESET,
  submerged: SUBMERGED_PRESET,
  SUBMERGED: SUBMERGED_PRESET,
  // Global Menu: Submerged underwater environment
  menu: SUBMERGED_PRESET,
  // Stats / Editorial: Sleek, transitional, softened highs, warm presence
  stats: {
    filterCutoff: 9500,
    filterQ: 0.75,
    highpassCutoff: 25,
    pan: 0.0,
    dryLevel: 0.94,
    reverbWet: 0.12,
    gainMultiplier: 0.94,
  },
  // Works: Creative exhibition hall! Lush spatial width and room reverb
  works: {
    filterCutoff: 14000,
    filterQ: 0.75,
    highpassCutoff: 25,
    pan: 0.0,
    dryLevel: 0.88,
    reverbWet: 0.22,
    gainMultiplier: 0.92,
  },
  // About: Deep, dreamlike, muffled, underwater/distant acoustic signature
  about: {
    filterCutoff: 520,
    filterQ: 2.0,
    highpassCutoff: 70,
    pan: 0.0,
    dryLevel: 0.50,
    reverbWet: 0.45,
    gainMultiplier: 0.80,
  },
  // Modal / Detail views: Subdued, focused background for reading/video
  modal: {
    filterCutoff: 2000,
    filterQ: 0.85,
    highpassCutoff: 40,
    pan: 0.0,
    dryLevel: 0.72,
    reverbWet: 0.22,
    gainMultiplier: 0.65,
  },
}

/**
 * Generates an algorithmic stereo impulse response buffer for the ConvolverNode.
 * Completely self-contained with band-limited 1-pole smoothing and RMS energy normalization
 * to eliminate harsh clipping, distortion, and abrasive digital fuzz.
 */
function createSyntheticImpulseResponse(ctx: AudioContext, duration = 1.8, decay = 2.8): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const impulse = ctx.createBuffer(2, length, sampleRate)
  const left = impulse.getChannelData(0)
  const right = impulse.getChannelData(1)

  let lastL = 0
  let lastR = 0
  let totalEnergy = 0

  for (let i = 0; i < length; i++) {
    const t = i / length
    // Exponential decay envelope
    const envelope = Math.exp(-t * decay)
    // Random noise
    const rawL = (Math.random() * 2 - 1) * envelope
    const rawR = (Math.random() * 2 - 1) * envelope
    // 1-pole gentle smoothing to suppress harsh high-frequency grain
    lastL = lastL * 0.45 + rawL * 0.55
    lastR = lastR * 0.45 + rawR * 0.55
    left[i] = lastL
    right[i] = lastR
    totalEnergy += lastL * lastL + lastR * lastR
  }

  // RMS energy normalization so convolver wet output is smooth, clean, and spacious
  const rms = Math.sqrt(totalEnergy / length) || 1
  const targetGain = 0.15 / rms
  for (let i = 0; i < length; i++) {
    left[i] *= targetGain
    right[i] *= targetGain
  }

  return impulse
}

export class AudioEngine {
  private audio: HTMLAudioElement | null = null
  private ctx: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private inputGain: GainNode | null = null
  private highpassFilter: BiquadFilterNode | null = null
  private filter: BiquadFilterNode | null = null
  private panner: StereoPannerNode | null = null
  private convolver: ConvolverNode | null = null
  private dryGain: GainNode | null = null
  private wetGain: GainNode | null = null
  private masterGain: GainNode | null = null

  private listeners = new Set<AudioEngineListener>()
  private duckMultiplier = 1.0
  private sectionGainMultiplier = 1.0
  private currentSection: string = 'home'
  private pauseTimeoutId: ReturnType<typeof setTimeout> | null = null

  private selectedCategory: string | null = null
  private scrollUnderwaterFactor = 0
  private scrollBaseSection: AudioSection = 'home'
  private isAboutActive = false
  private isModalActive = false
  private isMenuActive = false

  private activeEffect: AudioEffectParams = { ...SECTION_PRESETS.home }

  private state: AudioEngineState = {
    isPlaying: false,
    isMuted: false,
    volume: DEFAULT_VOLUME,
    isReady: false,
    currentSection: 'home',
    activeEffect: { ...SECTION_PRESETS.home },
    selectedCategory: null,
    isSubmerged: false,
    isMenuOpen: false,
    environment: 'DEFAULT',
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initFromStorage()
      this.initAudioElement()
    }
  }

  /**
   * Initializes or loads persisted volume/mute settings from localStorage.
   */
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
      // Storage access may be restricted
    }
  }

  /**
   * Creates the underlying HTMLAudioElement for playback.
   */
  private initAudioElement() {
    if (this.audio) return
    const audio = new Audio()
    audio.src = getAudioUrl()
    audio.loop = true
    audio.preload = 'auto'
    // Do NOT set crossOrigin='anonymous' for same-origin local assets
    // Setting crossOrigin without explicit Access-Control headers silences MediaElementSource
    audio.volume = 1 // Volume is managed via Web Audio API masterGain
    this.audio = audio
    this.state.isReady = true

    audio.addEventListener('play', () => {
      this.state.isPlaying = true
      this.notify()
    })

    audio.addEventListener('pause', () => {
      // Only set isPlaying = false if not muted or if intentional
      this.state.isPlaying = false
      this.notify()
    })

    audio.addEventListener('error', (e) => {
      console.warn('[TOBI XP AudioEngine] Playback error:', e)
      this.state.isPlaying = false
      this.notify()
    })
  }

  /**
   * Lazily initializes and routes the Web Audio API processing graph.
   * Safe to call multiple times; will only build the pipeline once.
   */
  public initialize(): void {
    if (typeof window === 'undefined') return
    if (this.ctx && this.sourceNode) return

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) {
      console.warn('[TOBI XP AudioEngine] Web Audio API is not supported in this browser.')
      return
    }

    try {
      if (!this.ctx) {
        this.ctx = new AudioContextClass()
      }

      if (!this.audio) {
        this.initAudioElement()
      }

      if (this.audio && !this.sourceNode) {
        this.sourceNode = this.ctx.createMediaElementSource(this.audio)

        this.inputGain = this.ctx.createGain()
        this.inputGain.gain.setValueAtTime(1.0, this.ctx.currentTime)

        this.highpassFilter = this.ctx.createBiquadFilter()
        this.highpassFilter.type = 'highpass'
        this.highpassFilter.frequency.setValueAtTime(this.activeEffect.highpassCutoff, this.ctx.currentTime)
        this.highpassFilter.Q.setValueAtTime(0.707, this.ctx.currentTime)

        this.filter = this.ctx.createBiquadFilter()
        this.filter.type = 'lowpass'
        this.filter.frequency.setValueAtTime(this.activeEffect.filterCutoff, this.ctx.currentTime)
        this.filter.Q.setValueAtTime(this.activeEffect.filterQ, this.ctx.currentTime)

        if (typeof this.ctx.createStereoPanner === 'function') {
          this.panner = this.ctx.createStereoPanner()
          this.panner.pan.setValueAtTime(this.activeEffect.pan, this.ctx.currentTime)
        }

        this.convolver = this.ctx.createConvolver()
        this.convolver.buffer = createSyntheticImpulseResponse(this.ctx)

        this.dryGain = this.ctx.createGain()
        this.dryGain.gain.setValueAtTime(this.activeEffect.dryLevel, this.ctx.currentTime)

        this.wetGain = this.ctx.createGain()
        this.wetGain.gain.setValueAtTime(this.activeEffect.reverbWet, this.ctx.currentTime)

        this.masterGain = this.ctx.createGain()
        const initialMaster = this.getEffectiveMasterGain()
        this.masterGain.gain.setValueAtTime(initialMaster, this.ctx.currentTime)

        // Connect audio graph
        this.sourceNode.connect(this.inputGain)
        this.inputGain.connect(this.highpassFilter)
        this.highpassFilter.connect(this.filter)

        const postFilter: AudioNode = this.panner ? this.panner : this.filter
        if (this.panner) {
          this.filter.connect(this.panner)
        }

        // Dry path
        postFilter.connect(this.dryGain)
        this.dryGain.connect(this.masterGain)

        // Wet spatial reverb path
        postFilter.connect(this.convolver)
        this.convolver.connect(this.wetGain)
        this.wetGain.connect(this.masterGain)

        // Output to hardware speakers
        this.masterGain.connect(this.ctx.destination)
      }
    } catch (err) {
      console.warn('[TOBI XP AudioEngine] Error constructing Web Audio graph:', err)
    }
  }

  /**
   * Calculates the combined master output level.
   */
  private getEffectiveMasterGain(): number {
    if (this.state.isMuted) return 0
    return Math.max(0, Math.min(1, this.state.volume * this.duckMultiplier * this.sectionGainMultiplier))
  }

  /**
   * Smoothly updates the master gain node without audio clicks or pops.
   */
  private updateMasterGain(durationSeconds = 0.4) {
    if (!this.ctx || !this.masterGain) {
      if (this.audio) {
        this.audio.volume = this.getEffectiveMasterGain()
      }
      return
    }
    const now = this.ctx.currentTime
    const target = this.getEffectiveMasterGain()
    const timeConstant = Math.max(0.04, durationSeconds / 3)

    try {
      this.masterGain.gain.cancelScheduledValues(now)
      this.masterGain.gain.setTargetAtTime(target, now, timeConstant)
    } catch {
      this.masterGain.gain.value = target
    }
  }

  /**
   * Starts playback with an optional smooth fade-in.
   */
  public async play(withFade = true): Promise<boolean> {
    if (this.pauseTimeoutId) {
      clearTimeout(this.pauseTimeoutId)
      this.pauseTimeoutId = null
    }

    this.initialize()
    if (!this.audio) return false

    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        // May be prevented if without user gesture
      }
    }

    this.state.isMuted = false
    this.saveMutedState(false)

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime
      const target = this.getEffectiveMasterGain()
      if (withFade) {
        this.masterGain.gain.cancelScheduledValues(now)
        this.masterGain.gain.setValueAtTime(0.0001, now)
        this.masterGain.gain.setTargetAtTime(target, now, 0.25)
      } else {
        this.updateMasterGain(0.05)
      }
    }

    try {
      await this.audio.play()
      this.state.isPlaying = true
      this.notify()
      return true
    } catch (err) {
      console.info('[TOBI XP AudioEngine] Autoplay waiting for user gesture:', err)
      this.state.isPlaying = false
      this.notify()
      return false
    }
  }

  /**
   * Starts playback specifically triggered by a user gesture.
   */
  public async playFromUserGesture(withFade = true): Promise<boolean> {
    if (this.pauseTimeoutId) {
      clearTimeout(this.pauseTimeoutId)
      this.pauseTimeoutId = null
    }

    this.initialize()

    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch (err) {
        console.warn('[TOBI XP AudioEngine] AudioContext resume failed:', err)
      }
    }

    this.state.isMuted = false
    this.saveMutedState(false)

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime
      const target = this.getEffectiveMasterGain()
      if (withFade) {
        this.masterGain.gain.cancelScheduledValues(now)
        this.masterGain.gain.setValueAtTime(0.0001, now)
        this.masterGain.gain.setTargetAtTime(target, now, 0.25)
      } else {
        this.updateMasterGain(0.05)
      }
    }

    if (!this.audio) return false

    try {
      await this.audio.play()
      this.state.isPlaying = true
      this.notify()
      return true
    } catch (err) {
      console.warn('[TOBI XP AudioEngine] User gesture play error:', err)
      this.state.isPlaying = false
      this.notify()
      return false
    }
  }

  /**
   * Pauses playback with an optional smooth fade-out.
   */
  public pause(withFade = true): void {
    if (this.pauseTimeoutId) {
      clearTimeout(this.pauseTimeoutId)
      this.pauseTimeoutId = null
    }

    if (!this.audio || this.audio.paused) {
      this.state.isPlaying = false
      this.notify()
      return
    }

    if (withFade && this.ctx && this.masterGain) {
      const now = this.ctx.currentTime
      this.masterGain.gain.cancelScheduledValues(now)
      this.masterGain.gain.setTargetAtTime(0, now, 0.15)

      this.pauseTimeoutId = setTimeout(() => {
        if (this.audio && this.state.isMuted) {
          this.audio.pause()
          this.state.isPlaying = false
          this.notify()
        }
        this.pauseTimeoutId = null
      }, 500)
    } else {
      this.audio.pause()
      this.state.isPlaying = false
      this.notify()
    }
  }

  /**
   * Toggles playback on and off cleanly.
   */
  public toggle(): void {
    if (this.state.isMuted || !this.state.isPlaying || this.state.volume === 0) {
      if (this.state.volume === 0) {
        this.setVolume(DEFAULT_VOLUME)
      }
      this.setMuted(false)
    } else {
      this.setMuted(true)
    }
  }

  /**
   * Adjusts volume level (0.0 to 1.0).
   */
  public setVolume(newVolume: number): void {
    const clamped = Math.max(0, Math.min(1, newVolume))
    this.state.volume = clamped
    this.saveVolumeState(clamped)

    if (clamped === 0) {
      this.setMuted(true)
    } else {
      if (this.state.isMuted) {
        this.state.isMuted = false
        this.saveMutedState(false)
      }
      if (this.audio) {
        if (this.audio.paused) {
          this.playFromUserGesture(true)
        } else {
          this.updateMasterGain(0.2)
        }
      }
    }
    this.notify()
  }

  /**
   * Mutes all audio output.
   */
  public mute(): void {
    this.setMuted(true)
  }

  /**
   * Unmutes audio output and restores previous level.
   */
  public unmute(): void {
    this.setMuted(false)
  }

  /**
   * Sets mute state.
   */
  public setMuted(muted: boolean): void {
    this.state.isMuted = muted
    this.saveMutedState(muted)

    if (muted) {
      this.pause(true)
    } else {
      if (this.state.volume === 0) {
        this.setVolume(DEFAULT_VOLUME)
      } else {
        this.playFromUserGesture(true)
      }
    }
    this.notify()
  }

  /**
   * Sets or clears the active Works category (e.g. 'PAINTINGS', 'SKETCHES', 'STUDIES',
   * 'BRANDING & IDENTITY', 'PRODUCT DESIGN', 'STURVS').
   * If any Illustrations or Designs category is open, smoothly transitions to SUBMERGED.
   * When cleared (null), smoothly transitions back to DEFAULT unless another submerged
   * condition (e.g. Resume section) is active.
   */
  public setSelectedCategory(category: string | null): void {
    this.selectedCategory = category
    this.state.selectedCategory = category
    this.syncEnvironment(1.4)
  }

  /**
   * Alias for setSelectedCategory.
   */
  public setCategory(category: string | null): void {
    this.setSelectedCategory(category)
  }

  /**
   * Sets or clears the Menu open state.
   * When Menu opens, smoothly transitions to the SUBMERGED audio treatment over 300-700ms (default 0.5s).
   * When Menu closes, smoothly returns to normal audio unless another submerged state (e.g. Category, Resume, About) is active.
   */
  public setMenuOpen(open: boolean, transitionDuration = 0.5): void {
    if (this.isMenuActive === open) return
    this.isMenuActive = open
    this.state.isMenuOpen = open
    this.syncEnvironment(transitionDuration)
  }

  /**
   * Returns true if the global menu is currently open.
   */
  public isMenuOpen(): boolean {
    return this.isMenuActive
  }

  /**
   * Returns the currently active Works category, or null if none is open.
   */
  public getSelectedCategory(): string | null {
    return this.selectedCategory
  }

  /**
   * Returns true if the audio engine is currently in the SUBMERGED environment.
   */
  public isSubmerged(): boolean {
    return Boolean(this.state.isSubmerged)
  }

  /**
   * Returns the current active environment name ('DEFAULT' | 'SUBMERGED' | 'MODAL' | 'ABOUT').
   */
  public getEnvironment(): AudioEnvironment {
    return this.state.environment
  }

  /**
   * Priority-aware audio environment reconciler:
   * 1. Menu open (SUBMERGED environment takes immediate precedence)
   * 2. Category SUBMERGED trigger (Illustrations / Designs categories)
   * 3. Scroll-based SUBMERGED trigger (Resume section)
   * 4. About page ('about' submerged acoustic profile)
   * 5. Generic modal ('modal')
   * 6. Baseline section ('home' | 'stats' | 'works')
   *
   * Ensures subtle, cinematic transitions with zero pops or clicks.
   */
  public syncEnvironment(transitionDuration = 1.4): void {
    if (this.isMenuActive) {
      // Priority 1: Menu is open -> submerged audio treatment
      this.currentSection = 'menu'
      this.state.currentSection = 'menu'
      this.state.isSubmerged = true
      this.state.environment = 'SUBMERGED'
      this.setEffect(SUBMERGED_PRESET, transitionDuration)
      return
    }

    const isCatSubmerged = isSubmergedCategory(this.selectedCategory)

    if (isCatSubmerged) {
      // Priority 2: Illustrations or Designs category is open
      this.currentSection = 'submerged'
      this.state.currentSection = 'submerged'
      this.state.isSubmerged = true
      this.state.environment = 'SUBMERGED'
      this.setEffect(SUBMERGED_PRESET, transitionDuration)
      return
    }

    // Category is NOT submerged. Check if other submerged triggers are active:
    if (this.scrollUnderwaterFactor >= 0.999) {
      // Priority 3a: User is fully submerged in Resume reading zone
      this.currentSection = 'resume'
      this.state.currentSection = 'resume'
      this.state.isSubmerged = true
      this.state.environment = 'SUBMERGED'
      this.setEffect(SUBMERGED_PRESET, transitionDuration)
      return
    }

    if (this.scrollUnderwaterFactor > 0.001) {
      // Priority 3b: User is in the transition boundary around Resume
      this.applyScrollUnderwaterInterpolation(this.scrollUnderwaterFactor, this.scrollBaseSection, transitionDuration)
      return
    }

    if (this.isAboutActive) {
      // Priority 4: About page overlay
      this.currentSection = 'about'
      this.state.currentSection = 'about'
      this.state.isSubmerged = true
      this.state.environment = 'ABOUT'
      this.setEffect(SECTION_PRESETS.about, transitionDuration)
      return
    }

    if (this.isModalActive) {
      // Priority 5: Generic modal
      this.currentSection = 'modal'
      this.state.currentSection = 'modal'
      this.state.isSubmerged = false
      this.state.environment = 'MODAL'
      this.setEffect(SECTION_PRESETS.modal, transitionDuration)
      return
    }

    // Priority 6: Default section (home / stats / works)
    const basePreset = SECTION_PRESETS[this.scrollBaseSection] || SECTION_PRESETS.home
    this.currentSection = this.scrollBaseSection
    this.state.currentSection = this.scrollBaseSection
    this.state.isSubmerged = false
    this.state.environment = 'DEFAULT'
    this.setEffect(basePreset, transitionDuration)
  }

  /**
   * Continuous Scroll-Responsive Underwater Effect Controller.
   *
   * Smoothly interpolates audio parameters based on the underwater factor (0 to 1),
   * blending seamlessly between normal crisp audio and full resonant submerged audio.
   *
   * @param underwaterFactor 0 = normal audio, 1 = deep underwater
   * @param baseSection Target baseline section when not underwater ('home' | 'stats' | 'works')
   * @param transitionDuration Optional duration for parameter ramping
   */
  public setScrollUnderwater(
    underwaterFactor: number,
    baseSection: AudioSection = 'home',
    transitionDuration?: number
  ): void {
    this.scrollUnderwaterFactor = Math.max(0, Math.min(1, underwaterFactor))
    this.scrollBaseSection = baseSection

    // If Menu is open, submerged category is open, or about is active, ignore scroll interpolation
    if (
      this.isMenuActive ||
      isSubmergedCategory(this.selectedCategory) ||
      this.isAboutActive ||
      this.isModalActive
    ) {
      return
    }

    this.applyScrollUnderwaterInterpolation(this.scrollUnderwaterFactor, baseSection, transitionDuration)
  }

  /**
   * Applies the continuous scroll-based underwater interpolation.
   */
  private applyScrollUnderwaterInterpolation(
    u: number,
    baseSection: AudioSection = 'home',
    transitionDuration = 0.2
  ): void {
    const basePreset = SECTION_PRESETS[baseSection] || SECTION_PRESETS.home
    const underwaterPreset = SUBMERGED_PRESET

    this.currentSection = u > 0.5 ? 'resume' : baseSection
    this.state.currentSection = this.currentSection
    this.state.isSubmerged = u > 0.5
    this.state.environment = u > 0.5 ? 'SUBMERGED' : 'DEFAULT'

    if (u <= 0.001) {
      // Pure baseline section
      this.setEffect(basePreset, transitionDuration)
      return
    }

    if (u >= 0.999) {
      // Pure underwater
      this.setEffect(underwaterPreset, transitionDuration)
      return
    }

    // Logarithmic/exponential frequency interpolation across octaves
    const logBaseCutoff = Math.log(basePreset.filterCutoff)
    const logUnderCutoff = Math.log(underwaterPreset.filterCutoff)
    const filterCutoff = Math.exp(logBaseCutoff + (logUnderCutoff - logBaseCutoff) * u)

    const filterQ = basePreset.filterQ + (underwaterPreset.filterQ - basePreset.filterQ) * u
    const highpassCutoff = basePreset.highpassCutoff + (underwaterPreset.highpassCutoff - basePreset.highpassCutoff) * u
    const dryLevel = basePreset.dryLevel + (underwaterPreset.dryLevel - basePreset.dryLevel) * u
    const reverbWet = basePreset.reverbWet + (underwaterPreset.reverbWet - basePreset.reverbWet) * u
    const gainMultiplier = basePreset.gainMultiplier + (underwaterPreset.gainMultiplier - basePreset.gainMultiplier) * u

    this.setEffect(
      {
        filterCutoff,
        filterQ,
        highpassCutoff,
        pan: 0,
        dryLevel,
        reverbWet,
        gainMultiplier,
      },
      transitionDuration
    )
  }

  /**
   * Context-Aware Audio Section Controller.
   *
   * Smoothly transitions the audio parameters to match the specified site section.
   *
   * @param sectionName The target section ('home' | 'resume' | 'stats' | 'works' | 'about' | 'modal' | 'menu')
   */
  public setSection(sectionName: AudioSection): void {
    if (sectionName === 'about') {
      this.isAboutActive = true
    } else if (sectionName === 'modal') {
      this.isModalActive = true
    } else if (sectionName === 'menu') {
      this.isMenuActive = true
      this.state.isMenuOpen = true
    } else {
      this.isAboutActive = false
      this.isModalActive = false
      this.scrollBaseSection = sectionName
    }

    if (this.isMenuActive) {
      // Menu is open: keep SUBMERGED environment
      this.currentSection = 'menu'
      this.state.currentSection = 'menu'
      this.state.isSubmerged = true
      this.state.environment = 'SUBMERGED'
      this.setEffect(SUBMERGED_PRESET, 0.5)
      return
    }

    if (isSubmergedCategory(this.selectedCategory)) {
      // Category is open: keep SUBMERGED environment
      return
    }

    this.currentSection = sectionName
    this.state.currentSection = sectionName
    const isSub =
      sectionName === 'resume' ||
      sectionName === 'submerged' ||
      sectionName === 'SUBMERGED' ||
      sectionName === 'menu'
    this.state.isSubmerged = isSub
    this.state.environment = isSub
      ? 'SUBMERGED'
      : sectionName === 'modal'
      ? 'MODAL'
      : sectionName === 'about'
      ? 'ABOUT'
      : 'DEFAULT'

    const preset = SECTION_PRESETS[sectionName] || SECTION_PRESETS.home
    const transitionDuration =
      sectionName === 'about'
        ? 1.8
        : sectionName === 'modal'
        ? 1.2
        : sectionName === 'menu'
        ? 0.5
        : 1.4
    this.setEffect(preset, transitionDuration)
  }

  /**
   * Applies custom or preset audio effect parameters with smooth, click-free parameter ramping.
   *
   * @param effect Partial or full audio effect configuration
   * @param transitionDuration Transition time in seconds (default 1.2s)
   */
  public setEffect(effect: Partial<AudioEffectParams>, transitionDuration = 1.2): void {
    this.activeEffect = {
      ...this.activeEffect,
      ...effect,
    }
    this.state.activeEffect = { ...this.activeEffect }

    if (!this.ctx) return

    const now = this.ctx.currentTime
    const timeConstant = Math.max(0.06, transitionDuration / 3)

    try {
      if (this.filter && effect.filterCutoff !== undefined) {
        const clampedCutoff = Math.max(200, Math.min(22000, effect.filterCutoff))
        this.filter.frequency.cancelScheduledValues(now)
        this.filter.frequency.setTargetAtTime(clampedCutoff, now, timeConstant)
      }

      if (this.filter && effect.filterQ !== undefined) {
        this.filter.Q.cancelScheduledValues(now)
        this.filter.Q.setTargetAtTime(effect.filterQ, now, timeConstant)
      }

      if (this.highpassFilter && effect.highpassCutoff !== undefined) {
        const clampedHp = Math.max(10, Math.min(500, effect.highpassCutoff))
        this.highpassFilter.frequency.cancelScheduledValues(now)
        this.highpassFilter.frequency.setTargetAtTime(clampedHp, now, timeConstant)
      }

      if (this.panner && effect.pan !== undefined) {
        const clampedPan = Math.max(-1, Math.min(1, effect.pan))
        this.panner.pan.cancelScheduledValues(now)
        this.panner.pan.setTargetAtTime(clampedPan, now, timeConstant)
      }

      if (this.dryGain && effect.dryLevel !== undefined) {
        const clampedDry = Math.max(0, Math.min(1, effect.dryLevel))
        this.dryGain.gain.cancelScheduledValues(now)
        this.dryGain.gain.setTargetAtTime(clampedDry, now, timeConstant)
      }

      if (this.wetGain && effect.reverbWet !== undefined) {
        const clampedWet = Math.max(0, Math.min(1, effect.reverbWet))
        this.wetGain.gain.cancelScheduledValues(now)
        this.wetGain.gain.setTargetAtTime(clampedWet, now, timeConstant)
      }

      if (effect.gainMultiplier !== undefined) {
        this.sectionGainMultiplier = Math.max(0, Math.min(1, effect.gainMultiplier))
        this.updateMasterGain(transitionDuration)
      }
    } catch (err) {
      console.warn('[TOBI XP AudioEngine] Parameter ramping warning:', err)
    }

    this.notify()
  }

  /**
   * Temporarily ducks the background audio (e.g. for video preview playback).
   */
  public duckAudio(factor = 0.25): void {
    this.duckMultiplier = Math.max(0, Math.min(1, factor))
    this.updateMasterGain(0.3)
  }

  /**
   * Restores audio to normal level following a duck.
   */
  public restoreAudio(): void {
    this.duckMultiplier = 1.0
    this.updateMasterGain(0.4)
  }

  /**
   * Destroys and cleans up the audio engine, stopping playback and closing the audio context.
   */
  public destroy(): void {
    if (this.pauseTimeoutId) {
      clearTimeout(this.pauseTimeoutId)
      this.pauseTimeoutId = null
    }

    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio = null
    }

    if (this.ctx) {
      try {
        this.ctx.close()
      } catch {
        // ignore
      }
      this.ctx = null
    }

    this.sourceNode = null
    this.inputGain = null
    this.highpassFilter = null
    this.filter = null
    this.panner = null
    this.convolver = null
    this.dryGain = null
    this.wetGain = null
    this.masterGain = null

    this.listeners.clear()
    this.state.isPlaying = false
    this.state.isReady = false
  }

  /**
   * Returns a snapshot of the current audio state.
   */
  public getState(): AudioEngineState {
    return { ...this.state }
  }

  /**
   * Subscribes to audio state changes.
   */
  public subscribe(listener: AudioEngineListener): () => void {
    this.listeners.add(listener)
    listener(this.getState())
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    const currentState = this.getState()
    this.listeners.forEach((listener) => listener(currentState))
  }

  private saveVolumeState(vol: number): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_VOLUME_KEY, String(vol))
    } catch {
      // ignore
    }
  }

  private saveMutedState(muted: boolean): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_MUTED_KEY, String(muted))
    } catch {
      // ignore
    }
  }
}

/**
 * Singleton Audio Engine instance for site-wide use.
 */
export const audioEngine = new AudioEngine()
