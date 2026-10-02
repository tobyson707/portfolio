import React, { Suspense, useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, useGLTF, Center } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import TypingNarrative from './TypingNarrative'
import { useStore } from '../store'
import { useContentStore } from '../services/contentStore'
import {
  trackMediaInteraction,
  trackSocialClick,
} from '../services/analytics'

/**
 * Checks whether WebGL is safely supported by the browser/GPU.
 */
function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    return Boolean(
      gl &&
        (gl instanceof WebGLRenderingContext ||
          (window.WebGL2RenderingContext && gl instanceof WebGL2RenderingContext))
    )
  } catch {
    return false
  }
}

/**
 * Top-level Error Boundary around the 3D Canvas to catch any WebGL initialization,
 * shader compilation, or resource crashes and fall back smoothly without breaking the page.
 */
class AboutCanvasErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[TOBI XP] About 3D Canvas error, switching to graceful fallback:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/**
 * High-fidelity static visual fallback representing the 3D character sculpture.
 * Used when WebGL is unsupported, context is lost, or memory is constrained on low-end mobile devices.
 */
function AboutCharacterFallback({ onInteract }: { onInteract?: () => void }) {
  return (
    <div className="about-fallback-container" onClick={onInteract}>
      <div className="about-fallback-stage">
        <img
          src="/images/about_character_fallback.jpg"
          alt="TOBI XP 3D Mask Sculpture"
          className="about-fallback-img"
          loading="eager"
          draggable={false}
        />
        <div className="about-fallback-shadow" aria-hidden="true" />
      </div>
      <div className="about-fallback-badge">
        <span className="about-drag-cue-dot" />
        <span className="about-drag-cue-text">3D MASK SCULPTURE</span>
      </div>
    </div>
  )
}

function AboutFallbackModel() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime()
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.02
      groupRef.current.rotation.y = t * 0.25
    }
  })

  return (
    <group ref={groupRef} scale={0.75}>
      <Center position={[0, 0, 0]}>
        <mesh castShadow receiveShadow>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color="#22252a"
            roughness={0.2}
            metalness={0.8}
            flatShading
          />
        </mesh>
        <mesh scale={0.6}>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial
            color="#F15723"
            emissive="#F15723"
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      </Center>
    </group>
  )
}

// 3D 展品模型组件 (Exhibition Model Content)
function ExhibitionModelContent({ isMobile }: { isMobile: boolean }) {
  const { scene } = useGLTF(
    `${import.meta.env.BASE_URL}models/mask.glb`,
    `${import.meta.env.BASE_URL}draco/gltf/`
  )
  const groupRef = useRef<THREE.Group>(null)

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o: any) => {
      // Remove any embedded key light in the loaded model
      if (o.isLight && (/key/i.test(o.name) || /main/i.test(o.name))) {
        o.parent?.remove(o)
      }
      if (o.isMesh) {
        // Only enable expensive real-time shadow passes on non-mobile
        o.castShadow = !isMobile
        o.receiveShadow = !isMobile
      }
    })
    return clone
  }, [scene, isMobile])

  // Cleanup cloned scene materials on unmount to prevent GPU memory leaks
  useEffect(() => {
    return () => {
      clonedScene.traverse((o: any) => {
        if (o.isMesh && o.material) {
          if (Array.isArray(o.material)) {
            o.material.forEach((m: any) => m.dispose?.())
          } else {
            o.material.dispose?.()
          }
        }
      })
    }
  }, [clonedScene])

  // Subtle breathing idle animation
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime()
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.015
    }
  })

  return (
    <group ref={groupRef} scale={isMobile ? 0.38 : 0.42}>
      <Center position={[0, 0, 0]}>
        <primitive object={clonedScene} />
      </Center>
    </group>
  )
}

function About3DViewer({
  theme,
  onInteract,
  hasInteracted,
}: {
  theme: 'light' | 'dark'
  onInteract: () => void
  hasInteracted: boolean
}) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 960 : false
  )
  const [hasContextLost, setHasContextLost] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 960)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (hasContextLost) {
    return <AboutCharacterFallback onInteract={onInteract} />
  }

  return (
    <div className="about-canvas-wrapper" style={{ touchAction: 'pan-y' }}>
      <Canvas
        shadows={!isMobile}
        dpr={isMobile ? 1 : [1, 1.5]}
        camera={{ position: [0, 0.05, 3.2], fov: isMobile ? 42 : 38, near: 0.1, far: 30 }}
        gl={{
          antialias: !isMobile,
          powerPreference: isMobile ? 'low-power' : 'default',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        onCreated={({ gl }) => {
          const dom = gl.domElement
          const handleLoss = (e: Event) => {
            e.preventDefault()
            console.warn('[TOBI XP] WebGL Context lost in About viewer, falling back to static visual')
            setHasContextLost(true)
          }
          dom.addEventListener('webglcontextlost', handleLoss, false)
        }}
        style={{ touchAction: 'pan-y' }}
      >
        <color attach="background" args={[theme === 'dark' ? '#0D0D0F' : '#ffffff']} />

        {/* Lighting system */}
        <ambientLight intensity={isMobile ? 1.4 : 1.25} color="#ffffff" />
        <directionalLight
          position={[-4.5, 3.8, -2.5]}
          intensity={0.6}
          color="#eef3fc"
        />
        <directionalLight
          position={[0, 3, -4]}
          intensity={0.4}
          color="#ffffff"
        />

        <Suspense fallback={<AboutFallbackModel />}>
          <ExhibitionModelContent isMobile={isMobile} />
          {!isMobile ? (
            <ContactShadows
              position={[0, -1.05, 0]}
              opacity={0.42}
              scale={3.6}
              blur={2.2}
              far={2.5}
              color="#161c18"
            />
          ) : (
            /* Lightweight procedural shadow disc on mobile: 1 simple draw call, 0 FBO passes */
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]}>
              <circleGeometry args={[0.9, 24]} />
              <meshBasicMaterial
                color="#000000"
                transparent
                opacity={theme === 'dark' ? 0.35 : 0.12}
              />
            </mesh>
          )}
        </Suspense>

        <OrbitControls
          makeDefault
          enableZoom={!isMobile}
          enablePan={false}
          enableRotate={true}
          minDistance={1.8}
          maxDistance={4.8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2 + 0.05}
          dampingFactor={0.06}
          rotateSpeed={isMobile ? 0.6 : 0.8}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.PAN,
          }}
          onStart={onInteract}
        />
      </Canvas>

      <AnimatePresence>
        {!hasInteracted && (
          <motion.div
            className="about-drag-cue"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.3 } }}
            transition={{ delay: 0.5, duration: 0.6 }}
            aria-hidden="true"
          >
            <span className="about-drag-cue-dot" />
            <span className="about-drag-cue-text">DRAG TO EXPLORE</span>
            <span className="about-drag-cue-arrow">↻</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AboutModelSection({
  theme,
  onInteract,
  hasInteracted,
}: {
  theme: 'light' | 'dark'
  onInteract: () => void
  hasInteracted: boolean
}) {
  const webGLSupported = useMemo(() => isWebGLAvailable(), [])

  if (!webGLSupported) {
    return <AboutCharacterFallback onInteract={onInteract} />
  }

  return (
    <AboutCanvasErrorBoundary fallback={<AboutCharacterFallback onInteract={onInteract} />}>
      <About3DViewer theme={theme} onInteract={onInteract} hasInteracted={hasInteracted} />
    </AboutCanvasErrorBoundary>
  )
}

interface AboutPageProps {
  onClose?: () => void
}

export default function AboutPage({ onClose }: AboutPageProps) {
  const setIsAboutOpen = useStore((state) => state.setIsAboutOpen)
  const savedHomeScrollY = useStore((state) => state.savedHomeScrollY)
  const cameFromHome = useStore((state) => state.cameFromHome)
  const theme = useStore((state) => state.theme)
  const about = useContentStore((state) => state.site.about)
  const social = useContentStore((state) => state.site.social)
  const [hasInteracted, setHasInteracted] = useState(false)

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    } else {
      setIsAboutOpen(false)
    }

    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      try {
        window.history.pushState(null, '', '/')
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      const targetScroll = cameFromHome && savedHomeScrollY > 0 ? savedHomeScrollY : 0
      window.scrollTo({ top: targetScroll, behavior: 'instant' })
    }
  }, [onClose, setIsAboutOpen, cameFromHome, savedHomeScrollY])

  // ESC key to dismiss overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const isMenuOpen = document.querySelector('.editorial-menu-backdrop')
        if (!isMenuOpen) {
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  // Lock background scrolling while overlay is open, and restore previous scroll on close
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      const pendingScroll = useStore.getState().pendingScrollTarget
      if (!pendingScroll && typeof window !== 'undefined') {
        const came = useStore.getState().cameFromHome
        const savedY = useStore.getState().savedHomeScrollY
        const targetScroll = came && savedY > 0 ? savedY : 0
        window.scrollTo({ top: targetScroll, behavior: 'instant' })
      }
    }
  }, [savedHomeScrollY, cameFromHome])

  const handleInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true)
      trackMediaInteraction({
        mediaId: 'about_3d_mask',
        type: '3d',
        name: '3D Mask Sculpture',
      })
    }
  }, [hasInteracted])

  const narrativeParagraphs = useMemo(() => {
    if (about?.paragraphs && about.paragraphs.length > 0) {
      return about.paragraphs
    }
    const fallback: string[] = []
    if (about?.narrative) fallback.push(about.narrative)
    if (about?.personalityNote) fallback.push(about.personalityNote)
    return fallback.length > 0
      ? fallback
      : [
          'I’m Tobi XP, an illustrator and designer who enjoys turning ideas into things people can see, use, and interact with ;)',
          'From illustration and character design to product design and interactive experiences, I like exploring ideas, figuring things out, and seeing where they lead.',
          'Still learning, still experimenting, and always making something.',
        ]
  }, [about])

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  return (
    <motion.div
      className="about-overlay-wrapper"
      role="dialog"
      aria-modal="true"
      aria-label="About TOBI XP"
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.988 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.988 }}
      transition={
        prefersReducedMotion
          ? { duration: 0.15 }
          : { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
      }
    >
      <div className="about-page-root" lang="en">
        {/* 顶部常驻 Branding Logo + Single Clearly Visible Close Control (X) */}
        <header className="about-top-bar" role="banner">
          <div className="about-brand-logo" aria-hidden="true">
            <img
              src="/images/xp.png"
              alt="TOBI XP"
              className="hero-xp-logo"
            />
          </div>

          <div className="about-top-actions">
            <button
              type="button"
              className="about-close-btn"
              onClick={handleClose}
              aria-label="Close About and return to homepage"
              title="Close [Esc]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

      {/* 两栏主区域 */}
      <div className="about-layout">
        {/* 左栏：交互式 3D 展台 (带 WebGL 支持检测与优雅降级) */}
        <section
          className="about-model-col"
          onPointerDown={handleInteraction}
          onTouchStart={handleInteraction}
          aria-label="3D Model Viewer"
        >
          <AboutModelSection
            theme={theme}
            onInteract={handleInteraction}
            hasInteracted={hasInteracted}
          />
        </section>

        {/* 右栏：About 信息与社交媒体链接 */}
        <section className="about-info-col">
          <motion.div
            className="about-info-content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="about-eyebrow">{about.eyebrow}</span>

            <h1 className="about-main-title" style={{ whiteSpace: 'pre-line' }}>
              {about.heading}
            </h1>

            <TypingNarrative paragraphs={narrativeParagraphs} />



            <section className="about-skills-section" aria-label="Skills">
              <h3 className="about-section-label">SKILLS</h3>
              <ul className="about-skills-list">
                {(about.skills && about.skills.length > 0 ? about.skills : [
                  'Illustration',
                  'Character Design',
                  'UI/UX Design',
                  'Product Design',
                  'Brand Identity',
                  'Interaction Design',
                  'Visual Storytelling',
                  'Concept Art',
                  '3D Design',
                ]).map((skill, index) => (
                  <li key={index} className="about-skill-pill">
                    {skill}
                  </li>
                ))}
              </ul>
            </section>

            {/* Instagram 与 Email 社交链接 */}
            <div className="about-social-links-row">
              <a
                href={social.instagram || 'https://instagram.com'}
                className="about-secondary-link"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick('instagram')}
              >
                <svg className="about-link-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                <span>Instagram</span>
                <span className="about-link-arrow">↗</span>
              </a>
              <a
                href={social.email.startsWith('mailto:') ? social.email : `mailto:${social.email}`}
                className="about-secondary-link"
                onClick={() => trackSocialClick('email')}
              >
                <svg className="about-link-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>Email</span>
                <span className="about-link-arrow">↗</span>
              </a>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  </motion.div>
  )
}

// Preload 3D mask model into memory cache
if (typeof window !== 'undefined') {
  try {
    useGLTF.preload(
      `${import.meta.env.BASE_URL}models/mask.glb`,
      `${import.meta.env.BASE_URL}draco/gltf/`
    )
  } catch {
    // ignore preload errors
  }
}
