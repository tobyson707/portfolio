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
  private registeredLoaders = new WeakSet<GLTFLoader>()
  private listeners: Array<() => void> = []

  constructor() {
    // Sync initial state with store
    if (typeof window !== 'undefined') {
      const state = useStore.getState()
      this.isReady = state.heroModelReady
      this.status = state.heroModelStatus || 'idle'
      this.progress = state.heroModelProgress || 0
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
   * Called by the 3D Scene / Man2 component once:
   * 1. The model has loaded and cloned successfully
   * 2. Materials and textures are initialized
   * 3. Model is added to the scene graph
   * 4. The WebGL renderer has executed the first rendered frame containing the character
   */
  public markModelReady() {
    if (this.isReady) return
    this.isReady = true
    this.hasRenderedFrame = true
    this.setStatus('ready')
    this.setProgress(100)

    try {
      const store = useStore.getState()
      store.setHeroModelReady(true)
      store.setHeroModelStatus('ready')
      store.setHeroModelProgress(100)
    } catch {
      // ignore
    }

    this.notify()
  }

  /**
   * Called when the 3D model fails to load or WebGL fails.
   * Does NOT report 100% completion; marks error and activates procedural fallback.
   */
  public markModelError(error: any) {
    if (this.isReady) return
    const errorMsg = error instanceof Error ? error.message : String(error || 'Model loading error')
    console.error('[TOBI XP] 3D Hero character model failed to load:', error)

    this.setError(errorMsg)
    this.isFallback = true

    try {
      const store = useStore.getState()
      store.setHeroModelStatus('error', errorMsg)
      store.setFallbackActive(true)
      // heroModelReady remains FALSE to never falsely claim completion
      store.setHeroModelReady(false)
    } catch {
      // ignore
    }

    this.notify()
  }

  /**
   * Allows recovery with the procedural crystalline fallback.
   */
  public proceedWithFallback() {
    this.isFallback = true
    try {
      const store = useStore.getState()
      store.setFallbackActive(true)
      store.setHeroModelStatus('ready')
      store.setHeroModelReady(true)
      store.enter()
    } catch {
      // ignore
    }
    this.notify()
  }

  /**
   * Reset state for retry
   */
  public retry() {
    this.status = 'loading'
    this.progress = 0
    this.error = null
    this.isReady = false
    this.isFallback = false
    this.hasRenderedFrame = false

    try {
      const store = useStore.getState()
      store.setHeroModelStatus('loading', null)
      store.setHeroModelProgress(0)
      store.setHeroModelReady(false)
      store.setFallbackActive(false)
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
