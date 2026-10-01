import React, { useEffect, useState, useCallback } from 'react'
import { RouterContext, parseAdminRoute } from './routerContext'

export type { AdminRoute, RouterContextType } from './routerContext'

export function AdminRouterProvider({ children }: { children: React.ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/admin'
    if (window.location.hash.startsWith('#/admin')) {
      return window.location.hash.slice(1)
    }
    return window.location.pathname || '/admin'
  })

  useEffect(() => {
    const handlePopState = () => {
      let path = window.location.pathname
      if (window.location.hash.startsWith('#/admin')) {
        path = window.location.hash.slice(1)
      }
      setCurrentPath(path)
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [])

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    if (typeof window === 'undefined') return

    if (to === '/' || !to.startsWith('/admin')) {
      // Navigating back to public site
      if (options?.replace) {
        window.history.replaceState({}, '', to)
      } else {
        window.history.pushState({}, '', to)
      }
      setCurrentPath(to)
      window.dispatchEvent(new PopStateEvent('popstate'))
      return
    }

    if (options?.replace) {
      window.history.replaceState({}, '', to)
    } else {
      window.history.pushState({}, '', to)
    }
    setCurrentPath(to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])

  const route = parseAdminRoute(currentPath)

  return (
    <RouterContext.Provider value={{ currentPath, route, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}
