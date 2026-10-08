import { useEffect, useRef, useCallback } from 'react'
import { audioEngine, isSubmergedCategory, type AudioSection } from '../services/audioEngine'
import { useStore } from '../store'

/**
 * useAudioEngineEffects — TOBI XP
 *
 * Context-aware hook that connects the site-wide Audio Engine to the user's
 * navigation, scroll position, Works categories, and overlay states.
 *
 * Provides a continuous, cinematic sonic environment:
 * - Normal crisp full-spectrum beat on Hero
 * - Smoothly and gradually muffles as the user scrolls towards Resume
 * - Deep, resonant underwater/distant acoustic immersion throughout Resume
 * - Gradually emerges from underwater back to normal as user scrolls past Resume
 * - Sleek, warm rolloff through Editorial Stats
 * - Open, spacious exhibition hall reverberation on Works
 * - Deep, atmospheric underwater profile on full-screen About
 * - SUBMERGED audio environment on all open Illustrations & Designs categories:
 *   (Paintings, Sketches, Studies, Branding & Identity, Product Design, STURVS)
 * - Focused background profile on generic modal/case-study viewers
 *
 * All transitions are smooth, subtle, and intentional with zero clicks or pops.
 */
export function useAudioEngineEffects() {
  const isMenuOpen = useStore((s) => s.isMenuOpen)
  const isAboutOpen = useStore((s) => s.isAboutOpen)
  const isModalOpen = useStore((s) => s.isModalOpen)
  const currentView = useStore((s) => s.currentView)
  const selectedCategory = useStore((s) => s.selectedCategory)

  // Sync category state directly to the Audio Engine
  useEffect(() => {
    audioEngine.setSelectedCategory(selectedCategory)
  }, [selectedCategory])

  // Sync menu state directly to the Audio Engine with smooth 500ms underwater transition
  useEffect(() => {
    audioEngine.setMenuOpen(isMenuOpen, 0.5)
  }, [isMenuOpen])

  const isOverlayActiveRef = useRef(false)
  isOverlayActiveRef.current = Boolean(
    isMenuOpen || isAboutOpen || isModalOpen || currentView !== 'home' || Boolean(selectedCategory)
  )

  // Smooth scroll sync with continuous underwater interpolation around Resume
  const syncScrollSection = useCallback((duration = 0.5) => {
    if (isOverlayActiveRef.current) return

    const scrollY = window.scrollY
    const vh = window.innerHeight || 800
    const viewportFocus = scrollY + vh * 0.5

    const resumeEl = document.getElementById('resume')
    const statsEl = document.getElementById('stats')
    const worksEl = document.getElementById('works')

    // If Resume is not in the DOM yet, default to home
    if (!resumeEl) {
      audioEngine.setSection('home')
      return
    }

    const resumeTop = resumeEl.offsetTop
    const resumeHeight = resumeEl.offsetHeight
    const resumeBottom = resumeTop + resumeHeight

    const statsTop = statsEl ? statsEl.offsetTop : resumeBottom + 100
    const worksTop = worksEl ? worksEl.offsetTop : statsTop + 500

    // Transition boundary definitions around Resume
    const entryStart = resumeTop - vh * 0.75
    const entryFull = resumeTop + vh * 0.15
    const exitFull = resumeBottom - vh * 0.15
    const exitEnd = Math.max(exitFull + 100, Math.min(statsTop + vh * 0.35, resumeBottom + vh * 0.75))

    let underwaterFactor: number
    let baseSection: AudioSection

    if (viewportFocus < entryStart) {
      // Well above Resume: Crisp Hero audio
      underwaterFactor = 0
      baseSection = 'home'
    } else if (viewportFocus >= entryStart && viewportFocus < entryFull) {
      // Entering Resume: Smooth gradual muffling diving underwater
      const t = Math.max(0, Math.min(1, (viewportFocus - entryStart) / Math.max(1, entryFull - entryStart)))
      underwaterFactor = t * t * (3 - 2 * t) // smoothstep curve
      baseSection = 'home'
    } else if (viewportFocus >= entryFull && viewportFocus <= exitFull) {
      // Deep submerged underwater throughout the Resume reading zone
      underwaterFactor = 1.0
      baseSection = 'resume'
    } else if (viewportFocus > exitFull && viewportFocus <= exitEnd) {
      // Leaving Resume: Smooth gradual emergence returning towards normal
      const t = Math.max(0, Math.min(1, (exitEnd - viewportFocus) / Math.max(1, exitEnd - exitFull)))
      underwaterFactor = t * t * (3 - 2 * t) // smoothstep curve
      baseSection = viewportFocus >= worksTop ? 'works' : 'stats'
    } else {
      // Below Resume: Emerged from underwater into Stats or Works
      underwaterFactor = 0
      if (viewportFocus >= worksTop) {
        baseSection = 'works'
      } else {
        baseSection = 'stats'
      }
    }

    audioEngine.setScrollUnderwater(underwaterFactor, baseSection, duration)
  }, [])

  // Handle overlay states: Menu, Categories, About page, and Case Study modals
  useEffect(() => {
    // If global Menu is open, SUBMERGED environment takes immediate precedence
    if (isMenuOpen) {
      audioEngine.setMenuOpen(true, 0.5)
      return
    }

    // If an Illustrations or Designs category is open, its SUBMERGED environment takes priority
    if (selectedCategory && isSubmergedCategory(selectedCategory)) {
      audioEngine.setSelectedCategory(selectedCategory)
      return
    }

    if (isAboutOpen) {
      audioEngine.setSection('about')
      return
    }

    if (isModalOpen) {
      // For non-category modals (e.g. PDF case study viewer)
      if (!isSubmergedCategory(selectedCategory)) {
        audioEngine.setSection('modal')
      }
      return
    }

    if (currentView === '404') {
      audioEngine.setSection('stats')
      return
    }

    // Returning to home view: smoothly resync to current scroll position over 500ms
    syncScrollSection(0.5)
  }, [isMenuOpen, isAboutOpen, isModalOpen, currentView, selectedCategory, syncScrollSection])

  // Attach smooth scroll listener
  useEffect(() => {
    if (typeof window === 'undefined') return

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          syncScrollSection()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    // Initial sync
    syncScrollSection()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [syncScrollSection])
}
