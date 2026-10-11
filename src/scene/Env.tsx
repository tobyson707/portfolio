import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import * as THREE from 'three'
import { heroModelManager } from './heroModelManager'

// Module-level cached prefiltered environment map singleton to prevent redundant GPU allocations
let cachedEnvMap: THREE.Texture | null = null
let activeUsersCount = 0

/**
 * Strict Environment Map Loader & Pre-filtered Mipmapped Radiance Environment Map (PMREM) Generator.
 * 
 * Mandatory hero lighting dependency:
 * 1. Downloads original env.hdr with real byte progress reporting
 * 2. Decodes 32-bit floating point HDR data
 * 3. Uses WebGLRenderer PMREMGenerator to produce prefiltered mipmapped radiance texture
 * 4. Binds to scene.environment and scene.environmentIntensity
 * 5. Notifies heroModelManager upon completion, without any fallback or silent downgrade
 */
export default function Env({
  intensity,
  rotationX,
  rotationY,
  rotationZ,
  asBackground,
  bgIntensity,
  bgBlur,
}: {
  intensity: number
  rotationX: number
  rotationY: number
  rotationZ: number
  asBackground: boolean
  bgIntensity: number
  bgBlur: number
}) {
  void bgIntensity
  void bgBlur

  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)
  const [texture, setTexture] = useState<THREE.Texture | null>(() => cachedEnvMap)

  // Invalidate cached texture if the WebGL context is lost
  useEffect(() => {
    const dom = gl?.domElement
    if (!dom) return
    const handleContextLost = () => {
      console.warn('[Env] WebGL Context lost, resetting environment texture cache')
      if (cachedEnvMap) {
        try {
          cachedEnvMap.dispose()
        } catch {
          // ignore
        }
        cachedEnvMap = null
      }
      heroModelManager.setEnvStatus('loading')
    }
    dom.addEventListener('webglcontextlost', handleContextLost)
    return () => dom.removeEventListener('webglcontextlost', handleContextLost)
  }, [gl])

  const [retryTrigger, setRetryTrigger] = useState(0)

  useEffect(() => {
    return heroModelManager.onRetry(() => {
      if (cachedEnvMap) {
        try {
          cachedEnvMap.dispose()
        } catch {
          // ignore
        }
        cachedEnvMap = null
      }
      setTexture(null)
      setRetryTrigger((v) => v + 1)
    })
  }, [])

  useEffect(() => {
    let isMounted = true
    activeUsersCount++

    if (cachedEnvMap) {
      setTexture(cachedEnvMap)
      heroModelManager.setEnvProgress(100)
      heroModelManager.markEnvReady()
      return () => {
        activeUsersCount = Math.max(0, activeUsersCount - 1)
        if (activeUsersCount === 0 && cachedEnvMap) {
          cachedEnvMap.dispose()
          cachedEnvMap = null
        }
      }
    }

    heroModelManager.setEnvStatus('loading')

    const loader = new RGBELoader()
    loader.setDataType(THREE.HalfFloatType)

    loader.load(
      `${import.meta.env.BASE_URL}textures/env.hdr`,
      (hdrTexture) => {
        if (!isMounted) {
          hdrTexture.dispose()
          return
        }

        try {
          heroModelManager.setEnvProgress(90)
          // Generate PMREM for accurate PBR specular reflections and diffuse irradiance
          const pmremGenerator = new THREE.PMREMGenerator(gl)
          pmremGenerator.compileEquirectangularShader()

          const renderTarget = pmremGenerator.fromEquirectangular(hdrTexture)
          const envMap = renderTarget.texture

          // Dispose source equirectangular texture and generator to free memory
          hdrTexture.dispose()
          pmremGenerator.dispose()

          cachedEnvMap = envMap
          setTexture(envMap)

          heroModelManager.setEnvProgress(95)
          // Mark environment completely ready and decoded on GPU
          heroModelManager.markEnvReady()
        } catch (err) {
          console.error('[Env] Failed to generate PMREM from env.hdr:', err)
          heroModelManager.markEnvError(err)
        }
      },
      (event: ProgressEvent) => {
        if (event.lengthComputable && event.total > 0) {
          // Map download bytes to 0..85%
          const pct = Math.min(85, Math.max(1, Math.round((event.loaded / event.total) * 85)))
          heroModelManager.setEnvProgress(pct)
        }
      },
      (err: any) => {
        console.error('[Env] Failed to load env.hdr:', err)
        heroModelManager.markEnvError(err)
      }
    )

    return () => {
      isMounted = false
      activeUsersCount = Math.max(0, activeUsersCount - 1)
      if (activeUsersCount === 0 && cachedEnvMap) {
        cachedEnvMap.dispose()
        cachedEnvMap = null
      }
    }
  }, [gl, retryTrigger])

  const initialBg = useRef<any>(null)
  useEffect(() => {
    initialBg.current = scene.background
  }, [scene])

  useEffect(() => {
    if (!texture) return
    scene.environment = texture
    return () => {
      scene.environment = null
    }
  }, [scene, texture])

  useEffect(() => {
    scene.environmentIntensity = intensity
  }, [scene, intensity])

  useEffect(() => {
    const x = THREE.MathUtils.degToRad(rotationX)
    const y = THREE.MathUtils.degToRad(rotationY)
    const z = THREE.MathUtils.degToRad(rotationZ)
    if (scene.environmentRotation) {
      scene.environmentRotation.set(x, y, z)
    }
    if (scene.backgroundRotation) {
      scene.backgroundRotation.set(x, y, z)
    }
  }, [scene, rotationX, rotationY, rotationZ])

  useEffect(() => {
    if (asBackground && texture) {
      scene.background = texture
    } else {
      scene.background = initialBg.current
    }
    return () => {
      scene.background = initialBg.current
    }
  }, [scene, asBackground, texture])

  return null
}
