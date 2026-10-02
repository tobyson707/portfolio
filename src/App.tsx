import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion, AnimatePresence, useScroll, useTransform, type MotionValue } from 'framer-motion'
import * as THREE from 'three'
import Scene from './scene/Scene'
import Resume from './ui/Resume'
import EditorialStats from './ui/EditorialStats'
import Works from './ui/Works'
import LoadingScreen from './ui/LoadingScreen'
import SoundControl from './ui/SoundControl'
import SoundActivationPrompt from './ui/SoundActivationPrompt'
import NavigationMenu from './ui/NavigationMenu'
import AboutPage from './ui/AboutPage'
import NotFoundPage from './ui/NotFoundPage'
import ThemeToggle from './ui/ThemeToggle'
import { useStore } from './store'
import { SITE_CONTENT } from './data/siteContent'
import { scrollToWorks } from './utils/scroll'
import { useContentStore } from './services/contentStore'
import {
  initAnalytics,
  trackPageView,
  trackScrollMilestone,
  recordEngagementTime,
} from './services/analytics'

class CanvasErrorBoundary extends React.Component<
  { fallback?: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('[TOBI XP] 3D Canvas error caught by boundary:', error, errorInfo)
    try {
      useStore.getState().setHeroModelReady(true)
    } catch {
      // ignore
    }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || null
    }
    return this.props.children
  }
}

function Backdrop() {
  // 点击空白处收起详情
  const setActive = useStore((s) => s.setActive)
  return (
    <mesh position={[0, 0, -40]} onClick={() => setActive(null)}>
      <planeGeometry args={[600, 300]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function Hero({ cueOpacity }: { cueOpacity: MotionValue<number> }) {
  const heroContent = useContentStore((s) => s.site.hero)
  return (
    <section className="hero" id="home">
      {/* 巨大层叠艺术字体：TOBI + 身份标签，XP + I MAKE STUFF... (Hero Foreground Layer - Desktop & Tablet) */}
      <div className="hero-giant-typography hero-desktop-only" aria-hidden="true">
        <div className="hgt-tobi-wrap">
          <span className="hgt-tobi">TOBI</span>
          <span className="hgt-role-under">
            {heroContent.role?.includes('&') ? (
              <>
                {heroContent.role.split('&')[0].trim()} <span className="hgt-amp">&amp;</span> {heroContent.role.split('&')[1].trim()}
              </>
            ) : (
              heroContent.role || (
                <>
                  ILLUSTRATOR <span className="hgt-amp">&amp;</span> DESIGNER
                </>
              )
            )}
          </span>
        </div>
        <div className="hgt-xp-wrap">
          <span className="hgt-xp">XP</span>
          <div className="hgt-statement-annotation">
            <p style={{ whiteSpace: 'pre-line' }}>
              {heroContent.heroStatement || `UHMMM... I DIDN’T REALLY\nKNOW WHAT TO PUT HERE,\nSO THIS IS WHAT WE’RE\nGOING WITH LOL`}
            </p>
          </div>
        </div>
      </div>

      {/* 顶部中心微标语 (Desktop & Tablet) */}
      <div className="hero-micro top-center hero-desktop-only">
        <span>{heroContent.microCopyTop || 'FIGURING IT OUT AS I GO.'}</span>
        <span className="micro-dot-orange" />
      </div>

      {/* 左侧微标语 (Desktop & Tablet) */}
      <div className="hero-micro left-side hero-desktop-only">
        <div className="crosshair-marker">+</div>
        <p className="hero-bio-lines" style={{ whiteSpace: 'pre-line' }}>
          {heroContent.microCopyLeft || 'I DRAW.\nI DESIGN.\nI BUILD THINGS.'}
        </p>
        <span className="micro-line" />
      </div>

      {/* 角色旁微标语 (Desktop & Tablet) */}
      <div className="hero-micro near-character hero-desktop-only">
        <div className="crosshair-marker">+</div>
        <p className="hero-interact-hint" style={{ whiteSpace: 'pre-line' }}>
          {heroContent.microCopyHint || 'GO AHEAD.\nMOVE IT.'}
        </p>
      </div>

      {/* 底部居中精致滚动指示器 (Desktop & Tablet) */}
      <motion.div
        className="scroll-cue hero-desktop-only"
        style={{ opacity: cueOpacity }}
        onClick={() => {
          scrollToWorks()
        }}
        role="button"
        tabIndex={0}
        aria-label="Scroll to content"
      >
        <svg className="scroll-mouse-icon" viewBox="0 0 24 36" width="22" height="32" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="30" rx="9" strokeWidth="2" />
          <circle className="scroll-mouse-wheel" cx="12" cy="10" r="2.5" fill="currentColor" stroke="none" />
        </svg>
        <span className="scroll-cue-label">SCROLL</span>
      </motion.div>

      {/* 移动端专属极简居中底部布局 (Mobile Hero Only) */}
      <div className="hero-mobile-gradient" aria-hidden="true" />
      <div className="hero-mobile-layout">
        <div className="hero-mobile-branding">
          <h1 className="hero-mobile-title">
            TOBI <span className="hero-mobile-orange">XP</span>
          </h1>
          <p className="hero-mobile-subtitle">
            ILLUSTRATOR <span className="hero-mobile-orange">&amp;</span> DESIGNER
          </p>
        </div>
        <motion.div
          className="hero-mobile-scroll-cue"
          style={{ opacity: cueOpacity }}
          onClick={() => {
            scrollToWorks()
          }}
          role="button"
          tabIndex={0}
          aria-label="Scroll to content"
        >
          <svg className="scroll-mouse-icon" viewBox="0 0 24 36" width="20" height="28" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="30" rx="9" strokeWidth="2" />
            <circle className="scroll-mouse-wheel" cx="12" cy="10" r="2.5" fill="currentColor" stroke="none" />
          </svg>
          <span className="scroll-cue-label">SCROLL</span>
        </motion.div>
      </div>
    </section>
  )
}

function HomeView() {
  const theme = useStore((s) => s.theme)
  const isAboutOpen = useStore((s) => s.isAboutOpen)
  const heroContent = useContentStore((s) => s.site.hero)
  const pendingScrollTarget = useStore((s) => s.pendingScrollTarget)
  const setPendingScrollTarget = useStore((s) => s.setPendingScrollTarget)
  const { scrollY } = useScroll()

  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle pending scroll target when HomeView mounts into DOM or transitions from About
  useEffect(() => {
    if (pendingScrollTarget === 'works') {
      let cancelled = false
      const rafId = requestAnimationFrame(() => {
        if (cancelled) return
        scrollToWorks('smooth')
        setPendingScrollTarget(null)

        // Secondary check once layout completes
        setTimeout(() => {
          if (!cancelled) {
            scrollToWorks('smooth')
          }
        }, 180)
      })

      return () => {
        cancelled = true
        cancelAnimationFrame(rafId)
      }
    }
  }, [pendingScrollTarget, setPendingScrollTarget])

  // 作品区蒙层：以作品区顶部从视口底进入到视口中部的进度，驱动 3D 柔化
  const worksRef = useRef<HTMLElement>(null)
  const { scrollYProgress: worksProgress } = useScroll({
    target: worksRef,
    offset: ['start end', 'start center'],
  })
  const isDark = theme === 'dark'
  const fogBg = useTransform(
    worksProgress,
    [0, 1],
    isDark
      ? ['rgba(13, 13, 15, 0)', 'rgba(13, 13, 15, 0.8)']
      : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.88)']
  )
  // 滚动后柔和提亮/压暗背景，保证履历与统计文字在任何背景下皆清晰易读
  const scrimOpacity = useTransform(scrollY, [0, 520], [0, isDark ? 0.65 : 0.75])
  // 首屏滚动提示随之淡出
  const cueOpacity = useTransform(scrollY, [0, 160], [1, 0])
  // 磨砂右轨：进入履历区后淡入（首屏不磨砂）
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const railOpacity = useTransform(scrollY, [vh * 0.5, vh * 1.1], [0, 1])
  // 首屏装饰画框/角标：滚动后淡出
  const heroChromeOpacity = useTransform(scrollY, [0, 280], [1, 0])

  return (
    <motion.div
      key="home-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
    >

      {/* 固定的 3D 背景 (在移动端打开 About 时释放背景 WebGL 避免双 Context 竞争与 GPU 崩溃) */}
      <div className="scene-bg">
        <CanvasErrorBoundary>
          {!(isAboutOpen && isMobileScreen) ? (
            <Canvas
              frameloop={isAboutOpen ? 'never' : 'always'}
              shadows={{ type: THREE.PCFShadowMap }}
              dpr={[1, 1.5]}
              camera={{ position: [0, 5, 19], fov: 39, near: 0.1, far: 500 }}
              gl={{ alpha: true, antialias: false, stencil: false, depth: true, toneMapping: THREE.ACESFilmicToneMapping }}
            >
              <Suspense fallback={null}>
                <Backdrop />
                <Scene />
              </Suspense>
            </Canvas>
          ) : (
            <div className="canvas-fallback" />
          )}
        </CanvasErrorBoundary>
      </div>

      {/* 滚动渐暗蒙层 */}
      <motion.div className="scrim" style={{ opacity: scrimOpacity }} aria-hidden="true" />

      {/* 作品区固定蒙层 */}
      <motion.div
        className="stage-fog"
        style={{ background: fogBg }}
        aria-hidden="true"
      />

      {/* 固定磨砂右轨 */}
      <motion.div className="glass-rail" style={{ opacity: railOpacity }} aria-hidden="true" />

      {/* 首屏装饰：发丝内框 + 四角定位标 + 角标元数据 + 左上角主品牌 xp.png 徽标（随滚动淡出） */}
      <motion.div className="hero-chrome" style={{ opacity: heroChromeOpacity }} aria-hidden="true">
        <div className="hero-frame" />
        <span className="hero-mark tl">+</span>
        <span className="hero-mark tr">+</span>
        <span className="hero-mark bl">+</span>
        <span className="hero-mark br">+</span>
        <div className="hero-meta hm-tl">
          <img
            src="/images/xp.png"
            alt="TOBI XP"
            className="hero-xp-logo"
          />
        </div>
        <div className="hero-meta hm-bl">{heroContent.disciplines || SITE_CONTENT.hero.disciplines}</div>
        <div className="hero-meta hm-right">{heroContent.statusLine || SITE_CONTENT.hero.statusLine}</div>
      </motion.div>

      {/* 可滚动内容 */}
      <main className="content">
        <Hero cueOpacity={cueOpacity} />
        <Resume />
        <EditorialStats />
        <Works lang="en" innerRef={worksRef} />
      </main>
    </motion.div>
  )
}

function PublicPortfolio() {
  const currentView = useStore((s) => s.currentView)
  const isAboutOpen = useStore((s) => s.isAboutOpen)
  const setIsAboutOpen = useStore((s) => s.setIsAboutOpen)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)

  // Initialize analytics & check initial route
  useEffect(() => {
    initAnalytics()
    const path = window.location.pathname
    if (path === '/about' || path === '/about/') {
      // Direct access or reload on /about: keep /about in URL and open About without hamburger menu
      useStore.getState().setCameFromHome(false)
      useStore.getState().setSavedHomeScrollY(0)
      setIsAboutOpen(true)
    } else if (path && path !== '/' && path !== '/index.html') {
      useStore.getState().setCurrentView('404')
    }
  }, [setIsAboutOpen])

  // Support browser Back and Forward navigation smoothly
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const path = window.location.pathname
      if (path === '/about' || path === '/about/') {
        setIsAboutOpen(true)
      } else if (path === '/' || path === '/index.html') {
        setIsAboutOpen(false)
        const state = e.state as { fromHome?: boolean } | null
        const came = useStore.getState().cameFromHome || Boolean(state?.fromHome)
        const savedY = useStore.getState().savedHomeScrollY
        if (came && savedY > 0) {
          window.scrollTo({ top: savedY, behavior: 'instant' })
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' })
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setIsAboutOpen])

  useEffect(() => {
    if (currentView === '404') {
      trackPageView('404 Not Found', '/404')
      return
    }

    const pageName = isAboutOpen ? 'About' : 'Home'
    const pagePath = isAboutOpen ? '/about' : '/'
    trackPageView(pageName, pagePath)

    const startTime = Date.now()
    return () => {
      const elapsedSeconds = (Date.now() - startTime) / 1000
      if (elapsedSeconds > 1) {
        recordEngagementTime(elapsedSeconds, pageName)
      }
    }
  }, [isAboutOpen, currentView])

  // Track meaningful scroll milestones on home page (25%, 50%, 75%, 90%)
  useEffect(() => {
    if (currentView !== 'home' || isAboutOpen) return

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      const scrolled = (window.scrollY / docHeight) * 100

      if (scrolled >= 90) {
        trackScrollMilestone(90, 'Home')
      } else if (scrolled >= 75) {
        trackScrollMilestone(75, 'Home')
      } else if (scrolled >= 50) {
        trackScrollMilestone(50, 'Home')
      } else if (scrolled >= 25) {
        trackScrollMilestone(25, 'Home')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentView, isAboutOpen])

  // Theme persistence & system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('tobi-xp-theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [setTheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('tobi-xp-theme', theme)
  }, [theme])

  return (
    <>
      {/* 加载遮罩：模型全部加载完成前覆盖全屏，完成后淡出 */}
      <LoadingScreen />

      {/* 主视图：404 独立渲染，首页常驻挂载以维持 3D 场景与滚动状态 */}
      {currentView === '404' ? (
        <NotFoundPage />
      ) : (
        <HomeView key="home-view" />
      )}

      {/* 全屏电影感 About 页面 / 遮罩层 (Full-Screen About Page) */}
      <AnimatePresence>
        {isAboutOpen && (
          <AboutPage
            key="about-overlay"
            onClose={() => {
              setIsAboutOpen(false)
              if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                try {
                  window.history.pushState(null, '', '/')
                } catch {
                  // ignore
                }
              }
              const came = useStore.getState().cameFromHome
              const savedY = useStore.getState().savedHomeScrollY
              if (came && savedY > 0) {
                window.scrollTo({ top: savedY, behavior: 'instant' })
              } else {
                window.scrollTo({ top: 0, behavior: 'instant' })
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* 顶部右侧常驻电影感导航菜单 (Navigation Menu) — ONLY rendered on homepage, completely excluded/unmounted on /about */}
      {currentView === 'home' && !isAboutOpen && <NavigationMenu />}

      {/* 底部右侧常驻声音控制 (Sound Control) */}
      <div className="global-controls">
        <ThemeToggle />
        <SoundControl />
      </div>

      {/* 首屏鼠标跟随/触屏声音激活提示卡片 */}
      <SoundActivationPrompt />
    </>
  )
}

export default function App() {
  return <PublicPortfolio />
}
