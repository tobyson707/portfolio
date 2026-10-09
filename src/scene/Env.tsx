import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import * as THREE from 'three'

// Module-level cached texture singleton to avoid duplicate downloads and redundant GPU VRAM allocations
let cachedTexture: THREE.Texture | null = null
let activeUsersCount = 0

// Robust environment map loader with error fallback to prevent crash on invalid HDR format
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
  const [texture, setTexture] = useState<THREE.Texture | null>(() => cachedTexture)

  // Invalidate cached texture if the WebGL context is lost
  useEffect(() => {
    const dom = gl?.domElement
    if (!dom) return
    const handleContextLost = () => {
      console.warn('[Env] WebGL Context lost, resetting environment texture cache')
      if (cachedTexture) {
        try {
          cachedTexture.dispose()
        } catch {
          // ignore
        }
        cachedTexture = null
      }
    }
    dom.addEventListener('webglcontextlost', handleContextLost)
    return () => dom.removeEventListener('webglcontextlost', handleContextLost)
  }, [gl])

  useEffect(() => {
    let isMounted = true
    activeUsersCount++

    if (cachedTexture) {
      setTexture(cachedTexture)
      return () => {
        activeUsersCount = Math.max(0, activeUsersCount - 1)
        if (activeUsersCount === 0 && cachedTexture) {
          cachedTexture.dispose()
          cachedTexture = null
        }
      }
    }

    const loader = new RGBELoader()
    loader.load(
      `${import.meta.env.BASE_URL}textures/env.hdr`,
      (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping
        cachedTexture = tex
        if (isMounted) {
          setTexture(tex)
        }
      },
      undefined,
      (err) => {
        console.warn('[Env] Failed to load env.hdr, using fallback lighting:', err)
      }
    )

    return () => {
      isMounted = false
      activeUsersCount = Math.max(0, activeUsersCount - 1)
      if (activeUsersCount === 0 && cachedTexture) {
        cachedTexture.dispose()
        cachedTexture = null
      }
    }
  }, [])

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
