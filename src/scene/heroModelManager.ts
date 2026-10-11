import { useStore } from '../store'
import type { GLTFLoader } from 'three-stdlib'

/**
 * HeroModelManager
 * 
 * Authoritative lifecycle and readiness coordinator for the TOBI XP 3D hero character model.
 * Connects the loading screen progress directly to actual byte download events,
 * Draco decompression, scene attachment, and the WebGL renderer's first frame.
 */
class HeroModelManager {
  private status: 'idle' | 'loading' | 'loaded' | 'ready' | 'error' = 'idle'
  private progress: number = 0
  private error: string | null = null
  private isReady: boolean = false
  private isFallback: boolean = false
  private hasRenderedFrame: boolean = false

  // Environment readiness tracking
  private envStatus: 'idle' | 'loading' | 'loaded' | 'ready' | 'error' = 'idle'
  private envProgress: number = 0
  private envError: string | null = null
  private isEnvReady: boolean = false

  // Model readiness tracking
  private isModelLoaded: boolean = false

  private registeredLoaders = new WeakSet<GLTFLoader>()
  private listeners: Array<() => void> = []

  constructor() {
    // Sync initial state with store
    if (typeof window !== 'undefined') {
      const state = useStore.getState()
      this.isReady = state.heroModelReady && (state.heroEnvReady ?? false)
      this.status = state.heroModelStatus || 'idle'
      this.progress = state.heroModelProgress || 0
      this.isEnvReady = state.heroEnvReady ?? false
      this.envStatus = state.heroEnvStatus ?? 'idle'
      this.envProgress = state.heroEnvProgress ?? 0
    }
  }

  public getStatus() {
    return this.status
  }

  public getProgress() {
    return this.progress
  }

  public getError() {
    return this.error
  }

  public getIsReady() {
    return this.isReady
  }

  public getIsFallback() {
    return this.isFallback
  }

  public getEnvStatus() {
    return this.envStatus
  }

  public getEnvProgress() {
    return this.envProgress
  }

  public getEnvError() {
    return this.envError
  }

  public getIsEnvReady() {
    return this.isEnvReady
  }

  /**
   * Registers a GLTFLoader instance to intercept load events for the hero model.
   * Extracts real ProgressEvent byte progress (event.loaded / event.total).
   */
  public registerLoader(loader: GLTFLoader) {
    if (this.registeredLoaders.has(loader)) return
    this.registeredLoaders.add(loader)

    const originalLoad = loader.load.bind(loader)

    loader.load = (url: string, onLoad, onProgress, onError) => {
      const isHeroModel =
        typeof url === 'string' &&
        (url.includes('tbxp.glb') || url.endsWith('tbxp.glb'))

      if (!isHeroModel) {
        return originalLoad(url, onLoad, onProgress, onError)
      }

      // Mark model as actively loading
      if (this.status !== 'ready') {
        this.setStatus('loading')
      }

      const wrappedOnProgress = (event: ProgressEvent) => {
        if (onProgress) {
          try {
            onProgress(event)
          } catch {
            // ignore consumer callback errors
          }
        }

        // Only update progress if not already completed
        if (this.status === 'ready') return

        if (event.lengthComputable && event.total > 0) {
          // Map bytes downloaded to 0..92%.
          // 93..100% is reserved for Draco decompression, scene setup, and WebGL first frame draw.
          const rawPct = (event.loaded / event.total) * 92
          const pct = Math.min(92, Math.max(1, Math.round(rawPct)))
          this.setProgress(pct)
        }
      }

      const wrappedOnLoad = (gltf: any) => {
        // Asset download and GLTF parse complete
        this.isModelLoaded = true
        if (this.status !== 'ready') {
          this.setStatus('loaded')
          this.setProgress(94)
        }

        if (onLoad) {
          try {
            onLoad(gltf)
          } catch (e) {
            console.error('[TOBI XP] Error in GLTF onLoad callback:', e)
          }
        }
      }

      const wrappedOnError = (err: any) => {
        console.error('[TOBI XP] Failed to load 3D hero character model (tbxp.glb):', err)
        this.setError(err?.message || 'Failed to load 3D model')
        if (onError) {
          try {
            onError(err)
          } catch {
            // ignore
          }
        }
      }

      return originalLoad(url, wrappedOnLoad, wrappedOnProgress, wrappedOnError)
    }
  }

  /**
   * Called when the 3D model asset has downloaded, parsed, and cloned into the scene.
   */
  public markModelLoaded() {
    this.isModelLoaded = true
    if (this.status !== 'ready') {
      this.setStatus('loaded')
      this.setProgress(94)
    }
    this.notify()
  }

  /**
   * Progress update for environment HDR loading and PMREM processing.
   */
  public setEnvProgress(pct: number) {
    const normalized = Math.min(100, Math.max(this.envProgress, Math.round(pct)))
    if (normalized === this.envProgress) return
    this.envProgress = normalized
    try {
      useStore.getState().setHeroEnvProgress(normalized)
    } catch {
      // ignore
    }
    this.notify()
  }

  /**
   * Status update for environment map loading and PMREM generation.
   */
  public setEnvStatus(status: 'idle' | 'loading' | 'loaded' | 'ready' | 'error', error: string | null = null) {
    this.envStatus = status
    this.envError = error
    if (status === 'ready') {
      this.isEnvReady = true
      this.envProgress = 100
    }
    try {
      useStore.getState().setHeroEnvStatus(status, error)
      if (status === 'ready') {
        useStore.getState().setHeroEnvReady(true)
        useStore.getState().setHeroEnvProgress(100)
      }
    } catch {
      // ignore
    }
    this.notify()
  }

  /**
   * Called when the complete lighting environment (HDR + PMREM prefiltering)
   * is successfully generated and bound to scene.environment.
   */
  public markEnvReady() {
    this.isEnvReady = true
    this.setEnvStatus('ready')
  }

  /**
   * Called when environment loading or PMREM generation fails.
   */
  public markEnvError(error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error || 'Environment loading error')
    console.error('[TOBI XP] Lighting environment failed to load:', error)
    this.isEnvReady = false
    this.setEnvStatus('error', errorMsg)
  }

  /**
   * Authoritative confirmation that the complete hero scene (model + lighting environment)
   * has successfully rendered at least one frame in the WebGL renderer.
   * Can ONLY succeed when BOTH model and environment are completely ready.
   */
  public markSceneRendered(hasModel: boolean, hasEnvironment: boolean) {
    if (!hasModel || !hasEnvironment) {
      return
    }

    if (this.isReady) return
    this.isReady = true
    this.hasRenderedFrame = true
    this.isModelLoaded = true
    this.isEnvReady = true
    this.setStatus('ready')
    this.setProgress(100)
    this.setEnvStatus('ready')

    try {
      const store = useStore.getState()
      store.setHeroModelReady(true)
      store.setHeroModelStatus('ready')
      store.setHeroModelProgress(100)
      store.setHeroEnvReady(true)
      store.setHeroEnvStatus('ready')
      store.setHeroEnvProgress(100)
    } catch {
      // ignore
    }

    this.notify()
  }

  /**
   * Called when model resources are parsed and instantiated.
   * Gated: Does not bypass the scene render gate or declare readiness prematurely.
   */
  public markModelReady() {
    this.isModelLoaded = true
    if (this.status !== 'ready') {
      this.setStatus('loaded')
      this.setProgress(94)
    }
    this.notify()
  }

  /**
   * Called when the 3D model fails to load or WebGL fails.
   * Keeps heroModelReady FALSE so loading screen never opens into missing model.
   */
  public markModelError(error: any) {
    if (this.isReady) return
    const errorMsg = error instanceof Error ? error.message : String(error || 'INITIALISATION INCOMPLETE')
    console.error('[TOBI XP] 3D Hero character model failed to load:', error)

    this.setError(errorMsg)
    this.isFallback = false

    try {
      const store = useStore.getState()
      store.setHeroModelStatus('error', errorMsg)
      store.setHeroModelReady(false)
    } catch {
      // ignore
    }

    this.notify()
  }

  public setProgress(pct: number) {
    // Ensure monotonic progress (never jumps backward)
    const normalized = Math.min(100, Math.max(this.progress, Math.round(pct)))
    if (normalized === this.progress) return
    this.progress = normalized

    try {
      useStore.getState().setHeroModelProgress(normalized)
    } catch {
      // ignore
    }
    this.notify()
  }

  public setStatus(status: 'idle' | 'loading' | 'loaded' | 'ready' | 'error') {
    if (this.status === status) return
    this.status = status

    try {
      useStore.getState().setHeroModelStatus(status, this.error)
    } catch {
      // ignore
    }
    this.notify()
  }

  public setError(msg: string | null) {
    this.error = msg
    this.status = 'error'
    try {
      useStore.getState().setHeroModelStatus('error', msg)
    } catch {
      // ignore
    }
    this.notify()
  }

  public subscribe(fn: () => void) {
    this.listeners.push(fn)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn)
    }
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn()
      } catch {
        // ignore
      }
    })
  }
}

export const heroModelManager = new HeroModelManager()

export const extendHeroLoader = (loader: GLTFLoader) => {
  heroModelManager.registerLoader(loader)
}
