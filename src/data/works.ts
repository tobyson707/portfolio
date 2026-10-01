import worksContent from './works.json'

export interface GalleryImage {
  image: string
  title: string
}

export interface WorkListItem {
  id?: string
  name: string
  meta?: string
  tags?: string[]
  link?: string
  slug?: string
  categoryId?: string
  workGroupId?: string
  gallery?: GalleryImage[]
}

export interface WorkGroup {
  heading: string
  items: string[]
}

export interface WorkSection {
  id: string
  no: string
  title: string
  tagline: string
  cover?: string
  items?: WorkListItem[]
  groups?: WorkGroup[]
  awards?: string[]
  tools?: string[]
  footer?: string
  isComingSoon?: boolean
  comingSoonMessage?: string
}

export interface WorksLang {
  title: string
  closeLabel: string
  openLabel: string
  hint: string
  awardsLabel: string
  visitLabel: string
  detailPlaceholder: string
  phImageLabel: string
  phButtonLabel: string
  countLabel: (n: number) => string
  sections: WorkSection[]
}

export const WORKS: { en: WorksLang } = {
  en: {
    ...(worksContent as Omit<WorksLang, 'countLabel'>),
    countLabel: (n) => `${n} works`,
  },
}

export function assetUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

export function sectionCount(section: WorkSection): number {
  return section.items?.length ?? 0
}
