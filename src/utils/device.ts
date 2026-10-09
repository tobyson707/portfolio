/**
 * Device & Platform Capability Detection Utility
 * 
 * Provides robust identification of mobile platforms (specifically iOS Safari on iPhone/iPad)
 * to intelligently adjust WebGL renderer settings, device pixel ratios, and post-processing passes.
 * Protects constrained mobile GPU processes from out-of-memory terminations.
 */

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  const ua = navigator.userAgent || ''
  
  // Specific mobile OS detection (including iPhone, iPad, iPod, Android)
  const isMobileUA = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  
  // iPadOS on Safari reports as MacIntel with multi-touch points
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  
  // Touch screen with small-to-medium viewport
  const isTouchDevice = (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) && window.innerWidth <= 1024
  
  // CSS media query coarse pointer check
  const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches === true && window.innerWidth <= 1024

  return isMobileUA || isIPadOS || isTouchDevice || isCoarsePointer
}

export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false

  const ua = navigator.userAgent || ''
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isWebKit = /WebKit/i.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua)

  return isIOS && isWebKit
}

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2', { powerPreference: 'low-power' }) ||
      canvas.getContext('webgl', { powerPreference: 'low-power' })
    const isSupported = Boolean(gl)
    if (gl) {
      const ext = gl.getExtension('WEBGL_lose_context')
      ext?.loseContext()
    }
    return isSupported
  } catch {
    return false
  }
}

/**
 * Determines whether the device is hardware- or memory-constrained
 * (e.g., iPhone / iPad running Mobile Safari with strict WebContent process memory limits,
 * or low-spec mobile device with <=4GB RAM / <=4 cores), where heavy 3D canvases
 * trigger process crashes or memory termination.
 */
export function isConstrainedMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  // 1. iOS Safari (iPhone / iPad) has strict WebContent process crash ceilings (~288MB VRAM/RAM)
  if (isIOSSafari()) return true

  // 2. WebGL unsupported or context creation failure
  if (!isWebGLAvailable()) return true

  // 3. Low device memory or low CPU concurrency on touch/mobile
  const nav = navigator as any
  if (isMobileDevice()) {
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return true
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) return true
  }

  return false
}

export function shouldUseMobilePerformanceMode(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const manualMode = sessionStorage.getItem('tobi_xp_perf_mode')
    if (manualMode === 'true') return true
  } catch {
    // ignore storage access issues
  }
  return isConstrainedMobileDevice()
}

/**
 * Returns an optimal, memory-safe device pixel ratio:
 * - Mobile / iOS devices: strictly 1.0 (or max 1.0) to prevent 3x Retina framebuffer crashes
 * - Desktop displays: capped between 1.0 and 1.5
 */
export function getSafeDpr(): number | [number, number] {
  if (typeof window === 'undefined') return 1
  if (isMobileDevice()) return 1
  return [1, 1.5]
}
