import { createContext, useContext } from 'react'
import type { ArchiveTab } from './pages/ArchivePage'
import type { SettingsTab } from './pages/SettingsPage'

export type AdminRoute =
  | { name: 'login' }
  | { name: 'dashboard' }
  | { name: 'analytics' }
  | { name: 'works-list' }
  | { name: 'work-new' }
  | { name: 'work-edit'; id: string }
  | { name: 'categories'; categoryId?: string; workGroupId?: string }
  | { name: 'assets' }
  | { name: 'media' }
  | { name: 'archive'; tab?: ArchiveTab }
  | { name: 'settings'; tab?: SettingsTab }
  | { name: 'site'; tab?: 'hero' | 'about' | 'contact' | 'social' }
  | { name: 'resume' }
  | { name: 'stats' }
  | { name: 'not-found' }

export interface RouterContextType {
  currentPath: string
  route: AdminRoute
  navigate: (path: string, options?: { replace?: boolean }) => void
}

export const RouterContext = createContext<RouterContextType | null>(null)

export function parseAdminRoute(rawPath: string): AdminRoute {
  // Normalize path removing trailing slash and hashes if any
  let clean = rawPath.split('?')[0].split('#')[0].replace(/\/+$/, '')
  if (!clean || clean === '') clean = '/'

  // Also support hash based routes like #/admin/works
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#/admin')) {
    clean = window.location.hash.slice(1).split('?')[0].replace(/\/+$/, '')
  }

  if (clean === '/admin') {
    return { name: 'login' }
  }
  if (clean === '/admin/dashboard') {
    return { name: 'dashboard' }
  }
  if (clean === '/admin/analytics') {
    return { name: 'analytics' }
  }
  if (clean === '/admin/works') {
    return { name: 'works-list' }
  }
  if (clean === '/admin/works/new') {
    return { name: 'work-new' }
  }
  const editMatch = clean.match(/^\/admin\/works\/([^/]+)$/)
  if (editMatch) {
    return { name: 'work-edit', id: decodeURIComponent(editMatch[1]) }
  }
  
  const catMatch = clean.match(/^\/admin\/categories(?:\/([^/]+)(?:\/([^/]+))?)?$/)
  if (catMatch) {
    return {
      name: 'categories',
      categoryId: catMatch[1] ? decodeURIComponent(catMatch[1]) : undefined,
      workGroupId: catMatch[2] ? decodeURIComponent(catMatch[2]) : undefined,
    }
  }

  if (clean === '/admin/assets' || clean === '/admin/media') {
    return { name: 'assets' }
  }

  const archiveMatch = clean.match(/^\/admin\/archive(?:\/(all|works|categories|subcategories|media))?$/)
  if (archiveMatch) {
    return { name: 'archive', tab: (archiveMatch[1] as ArchiveTab) || 'all' }
  }

  const settingsMatch = clean.match(/^\/admin\/settings(?:\/(general|appearance|audio|analytics|portfolio|media|admin|security))?$/)
  if (settingsMatch) {
    return { name: 'settings', tab: (settingsMatch[1] as SettingsTab) || 'general' }
  }

  if (clean === '/admin/resume' || clean === '/admin/site/resume') {
    return { name: 'resume' }
  }

  if (clean === '/admin/stats' || clean === '/admin/site/stats') {
    return { name: 'stats' }
  }

  const siteMatch = clean.match(/^\/admin\/site(?:\/(hero|about|resume|stats|contact|social))?$/)
  if (siteMatch) {
    if (siteMatch[1] === 'resume') {
      return { name: 'resume' }
    }
    if (siteMatch[1] === 'stats') {
      return { name: 'stats' }
    }
    return { name: 'site', tab: (siteMatch[1] as any) || 'hero' }
  }

  return { name: 'not-found' }
}

export function useAdminRouter() {
  const ctx = useContext(RouterContext)
  if (!ctx) {
    throw new Error('useAdminRouter must be used within an AdminRouterProvider')
  }
  return ctx
}
