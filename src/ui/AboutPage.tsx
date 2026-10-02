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

class AboutModelErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('[TOBI XP] About 3D Model load error, switching to fallback:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
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

// 3D 展品模型组件 (Exhibition Model scaled down by ~2x for comfortable framing)
function ExhibitionModelContent() {
  const { scene } = useGLTF(
    `${import.meta.env.BASE_URL}models/mask.glb`,
    `${import.meta.env.BASE_URL}draco/gltf/`
  )
  const groupRef = useRef<THREE.Group>(null)

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o: any) => {
      // Ensure any embedded key light in the loaded model is removed
      if (o.isLight && (/key/i.test(o.name) || /main/i.test(o.name))) {
        o.parent?.remove(o)
      }
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        if (o.geometry) {
          o.geometry.computeVertexNormals()
        }
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material]
          mats.forEach((m: any) => {
            m.needsUpdate = true
          })
        }
      }
    })
    return clone
  }, [scene])

  // 微幅待机呼吸摆动
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime()
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.015
    }
  })

  return (
    <group ref={groupRef} scale={0.42}>
      <Center position={[0, 0, 0]}>
        <primitive object={clonedScene} />
      </Center>
    </group>
  )
}

function ExhibitionModel() {
  return (
    <AboutModelErrorBoundary fallback={<AboutFallbackModel />}>
      <ExhibitionModelContent />
    </AboutModelErrorBoundary>
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
        {/* 左栏：交互式 3D 展台 */}
        <section
          className="about-model-col"
          onPointerDown={handleInteraction}
          onTouchStart={handleInteraction}
          aria-label="3D Model Viewer"
        >
          <div className="about-canvas-wrapper">
            <Canvas
              shadows
              dpr={typeof window !== 'undefined' && window.innerWidth <= 768 ? [1, 1.25] : [1, 1.5]}
              camera={{ position: [0, 0.05, 3.2], fov: 38, near: 0.1, far: 50 }}
              gl={{
                antialias: true,
                powerPreference: 'default',
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.08,
              }}
            >
              <color attach="background" args={[theme === 'dark' ? '#0D0D0F' : '#ffffff']} />

              {/* 摄影棚灯光系统 (Key Light completely removed) */}
              <ambientLight intensity={1.25} color="#ffffff" />
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

              <Suspense fallback={null}>
                <ExhibitionModel />
                <ContactShadows
                  position={[0, -1.05, 0]}
                  opacity={0.42}
                  scale={3.6}
                  blur={2.2}
                  far={2.5}
                  color="#161c18"
                />
              </Suspense>

              <OrbitControls
                makeDefault
                enableZoom={true}
                enablePan={false}
                enableRotate={true}
                minDistance={1.8}
                maxDistance={4.8}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2 + 0.05}
                dampingFactor={0.06}
                rotateSpeed={0.8}
                onStart={handleInteraction}
              />
            </Canvas>
          </div>

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
                  'Simulation Design',
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
