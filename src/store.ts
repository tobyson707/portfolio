import { create } from 'zustand'

// 全站交互状态：当前展开的领域 / 悬停的领域 / 是否已进入 / 当前页面视图 / 主题
interface StoreState {
  active: string | null
  hovered: string | null
  entered: boolean
  currentView: 'home' | 'about' | '404'
  theme: 'light' | 'dark'
  heroModelReady: boolean
  isModalOpen: boolean
  pendingScrollTarget: string | null
  isAboutOpen: boolean
  savedHomeScrollY: number
  setActive: (id: string | null) => void
  setHovered: (id: string | null) => void
  enter: () => void
  setCurrentView: (view: 'home' | 'about' | '404') => void
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setHeroModelReady: (ready: boolean) => void
  setIsModalOpen: (open: boolean) => void
  setPendingScrollTarget: (target: string | null) => void
  setIsAboutOpen: (open: boolean) => void
  setSavedHomeScrollY: (y: number) => void
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  const saved = (localStorage.getItem('tobi-xp-theme') || localStorage.getItem('theme')) as 'light' | 'dark' | null
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyThemeToDOM = (theme: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme
    document.documentElement.setAttribute('data-theme', theme)
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('tobi-xp-theme', theme)
    localStorage.setItem('theme', theme)
  }
}

const initialTheme = getInitialTheme()
applyThemeToDOM(initialTheme)

export const useStore = create<StoreState>((set) => ({
  active: null,
  hovered: null,
  entered: false,
  currentView: 'home',
  theme: initialTheme,
  heroModelReady: false,
  isModalOpen: false,
  pendingScrollTarget: null,
  isAboutOpen: false,
  savedHomeScrollY: 0,
  setActive: (id) => set({ active: id }),
  setHovered: (id) => set({ hovered: id }),
  enter: () => set({ entered: true }),
  setCurrentView: (view) => set({ currentView: view }),
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light'
      applyThemeToDOM(nextTheme)
      return { theme: nextTheme }
    }),
  setTheme: (theme) => {
    applyThemeToDOM(theme)
    set({ theme })
  },
  setHeroModelReady: (ready) => set({ heroModelReady: ready }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setPendingScrollTarget: (target) => set({ pendingScrollTarget: target }),
  setIsAboutOpen: (open) =>
    set((state) => {
      if (state.isAboutOpen === open) return state
      if (open && typeof window !== 'undefined') {
        return { isAboutOpen: true, savedHomeScrollY: window.scrollY }
      }
      return { isAboutOpen: open }
    }),
  setSavedHomeScrollY: (y) => set({ savedHomeScrollY: y }),
}))

// 开发期调试钩子：可在 console 用 __store.getState().setActive('ads')
declare global {
  interface Window {
    __store?: typeof useStore
  }
}
if (import.meta.env.DEV) window.__store = useStore
