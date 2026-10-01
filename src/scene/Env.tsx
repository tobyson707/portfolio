import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import * as THREE from 'three'

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
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let isMounted = true
    const loader = new RGBELoader()
    loader.load(
      `${import.meta.env.BASE_URL}textures/env.hdr`,
      (tex) => {
        if (!isMounted) return
        tex.mapping = THREE.EquirectangularReflectionMapping
        setTexture(tex)
      },
      undefined,
      (err) => {
        console.warn('[Env] Failed to load env.hdr, using fallback lighting:', err)
      }
    )
    return () => {
      isMounted = false
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
