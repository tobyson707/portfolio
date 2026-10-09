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
