import type { WorkListItem } from './works'

export interface CategoryPersonality {
  id: string
  text: string
  title: string
  description?: string
}

export const CATEGORY_PERSONALITIES: Record<string, CategoryPersonality> = {
  paintings: {
    id: 'paintings',
    text: 'some polished stuffs',
    title: 'some polished stuffs',
  },
  sketches: {
    id: 'sketches',
    text: 'the quick ones',
    title: 'the quick ones',
  },
  studies: {
    id: 'studies',
    text: 'random studies',
    title: 'random studies',
  },
  'branding-identity': {
    id: 'branding-identity',
    text: 'making brands look right',
    title: 'making brands look right',
  },
  'product-design': {
    id: 'product-design',
    text: 'making things useful',
    title: 'making things useful',
  },
  sturvs: {
    id: 'sturvs',
    text: 'random stuff',
    title: 'random stuff',
  },
}

export function getCategoryPersonality(item: WorkListItem): CategoryPersonality | null {
  const raw = `${item.slug || ''} ${item.id || ''} ${item.name || ''}`.toLowerCase()
  if (raw.includes('paint')) return CATEGORY_PERSONALITIES['paintings']
  if (raw.includes('sketch')) return CATEGORY_PERSONALITIES['sketches']
  if (raw.includes('stud')) return CATEGORY_PERSONALITIES['studies']
  if (raw.includes('brand')) return CATEGORY_PERSONALITIES['branding-identity']
  if (raw.includes('product')) return CATEGORY_PERSONALITIES['product-design']
  if (raw.includes('sturv')) return CATEGORY_PERSONALITIES['sturvs']
  return null
}

export function getCategoryDisplayLabel(item: WorkListItem): string {
  const raw = (item.name || item.slug || '').trim()
  if (raw.toLowerCase() === 'sturvs') return 'STURVS'
  return raw.toUpperCase()
}
