import { create } from 'zustand'
import type { WorkSection, WorkListItem } from '../data/works'
import { getCategoryImages } from '../data/worksManifest'
import {
  syncWorkToFirestore,
  deleteWorkFromFirestore,
  syncCategoryToFirestore,
  deleteCategoryFromFirestore,
  syncWorkGroupToFirestore,
  deleteWorkGroupFromFirestore,
  syncMediaToFirestore,
  deleteMediaFromFirestore,
  syncSiteSectionToFirestore,
  collectDataFromFirebase,
  pushAllToFirestore,
  initializeFirestoreSync,
} from './firestoreSync'

export interface GalleryItem {
  image: string
  title: string
}

export interface Work {
  id: string
  title: string
  slug: string
  categoryId: string
  workGroupId?: string
  discipline?: string
  disciplineIds?: string[]
  year: string
  description: string
  coverImage: string
  gallery: GalleryItem[]
  tools: string[]
  client: string
  projectType: string
  externalUrl: string
  content: string
  featured: boolean
  status: 'draft' | 'published' | 'archived' | 'hidden'
  previousStatus?: 'draft' | 'published' | 'hidden'
  archivedAt?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  no?: string
  name: string
  slug: string
  tagline?: string
  description?: string
  cover?: string
  coverMediaId?: string
  imageMediaId?: string
  imageUrl?: string
  tools?: string[]
  awards?: string[]
  footer?: string
  order: number
  status: 'active' | 'published' | 'draft' | 'archived' | 'hidden'
  previousStatus?: 'active' | 'published' | 'draft' | 'hidden'
  archivedAt?: string
  createdAt?: string
  updatedAt?: string
}

export function resolveCategoryCover(cat?: Category | null, mediaList: MediaItem[] = []): string {
  if (!cat) return ''
  if (cat.imageMediaId || cat.coverMediaId) {
    const item = mediaList.find((m) => m.id === (cat.imageMediaId || cat.coverMediaId))
    if (item) {
      return item.optimizedUrl || item.url || ''
    }
  }
  return cat.imageUrl || cat.cover || ''
}

export interface WorkGroupItem {
  id: string
  name: string
  slug: string
  categoryId: string
  discipline?: string
  disciplineIds?: string[]
  description?: string
  cover?: string
  coverMediaId?: string
  order: number
  status: 'active' | 'published' | 'draft' | 'archived' | 'hidden'
  previousStatus?: 'active' | 'published' | 'draft' | 'hidden'
  archivedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface DisciplineItem {
  id: string
  name: string
  slug: string
  categoryId?: string
  workGroupId?: string
  order: number
  status: 'active' | 'archived'
}

export interface ToolItem {
  id: string
  name: string
  slug: string
  status: 'active' | 'archived'
  order: number
}

export interface MediaItem {
  id: string
  name?: string
  filename: string
  originalFileName?: string
  mimeType?: string
  type: 'image' | 'video' | '3d' | 'audio' | 'other'
  mediaType?: 'image' | 'video' | '3d' | 'audio' | 'other'
  url: string
  optimizedUrl?: string
  thumbnailUrl?: string
  width?: number
  height?: number
  size?: string
  duration?: number
  storagePath?: string
  originalPath?: string
  optimizedPath?: string
  source?: string
  sourceFileId?: string
  usageCount?: number
  categoryId?: string
  workGroupId?: string
  disciplineIds?: string[]
  workId?: string
  workIds?: string[]
  tools?: string[]
  status?: 'published' | 'hidden' | 'archived'
  visibility?: 'published' | 'hidden' | 'archived'
  previousStatus?: 'published' | 'hidden'
  archivedAt?: string
  createdAt: string
  updatedAt?: string
}

export interface AdminSiteSettings {
  general: {
    portfolioName: string
    portfolioUrl: string
    adminDisplayName: string
    timezone: string
    locale: string
  }
  appearance: {
    theme: 'light' | 'dark' | 'system'
  }
  audio: {
    enabled: boolean
    backgroundSoundUrl: string
    storagePath?: string
    fileName?: string
    mimeType?: string
    size?: number
    duration?: number
    defaultVolume: number
    updatedAt?: string
  }
  portfolio: {
    defaultWorkStatus: 'published' | 'draft'
    featuredOnlyPublic: boolean
    defaultCategoryOrder: 'manual' | 'alphabetical'
  }
  media: {
    defaultVisibility: 'published' | 'hidden'
    maxUploadSizeMb: number
    allowedTypes: string[]
  }
  analytics?: {
    enabled: boolean
    measurementId?: string
    anonymizeIp: boolean
    trackScrollMilestones: boolean
    trackAudioEvents: boolean
    trackDownloadEvents: boolean
    trackThemeEvents: boolean
    debugMode?: boolean
    updatedAt?: string
  }
  security: {
    authProvider: string
    adminEmail: string
    allowedAdminEmails: string[]
    lastAuthMethod: string
  }
  updatedAt?: string
}

export interface WorksGlobalLabels {
  title: string
  closeLabel: string
  openLabel: string
  hint: string
  awardsLabel: string
  visitLabel: string
  detailPlaceholder: string
  phImageLabel: string
  phButtonLabel: string
}

export interface SiteContentData {
  hero: {
    title: string
    role: string
    disciplines: string
    statusLine: string
    microCopyTop: string
    microCopyLeft: string
    microCopyHint: string
    heroStatement: string
    paragraphs: string[]
  }
  about: {
    eyebrow: string
    heading: string
    narrative: string
    personalityNote: string
    ctaLabel: string
    skills: string[]
  }
  contact: {
    number: string
    title: string
    tagline: string
    email: string
    nameLabel: string
    emailLabel: string
    messageLabel: string
    sendLabel: string
  }
  social: {
    instagram: string
    email: string
    guestbookLabel: string
  }
  resume: {
    title: string
    entries: Array<{
      id: string
      period: string
      place: string
      role?: string
      points?: string[]
      links?: Array<{ id: string; label: string; href: string }>
      order: number
      visible: boolean
    }>
  }
  stats: StatsSectionData
  worksConfig: WorksGlobalLabels
}

export interface StatItem {
  id: string
  label: string
  value: number
  prefix?: string
  suffix?: string
  description?: string
  order: number
  visible: boolean
}

export interface StatsSectionData {
  stats: StatItem[]
  statement: {
    heading: string
    subheading?: string
    description: string
  }
  marqueeText?: string
  updatedAt?: string
}

export function normalizeStatsData(raw: any): StatsSectionData {
  const defaultStatement = {
    heading: '',
    subheading: '',
    description: '',
  }
  const defaultMarquee = ''

  const defaultStats: StatItem[] = [
    {
      id: 'stat-years',
      label: 'YEARS',
      value: 8,
      prefix: '',
      suffix: '+',
      description: 'of drawing, designing, experimenting, and figuring things out.',
      order: 1,
      visible: true,
    },
    {
      id: 'stat-projects',
      label: 'PROJECTS',
      value: 450,
      prefix: '',
      suffix: '+',
      description: 'illustrations, designs, experiments, client work, and a lot of random sturvs.',
      order: 2,
      visible: true,
    },
    {
      id: 'stat-tools',
      label: 'TOOLS',
      value: 15,
      prefix: '',
      suffix: '+',
      description: 'the software I use to turn ideas into things people can actually see and experience.',
      order: 3,
      visible: true,
    },
  ]

  if (!raw) {
    return {
      stats: defaultStats,
      statement: defaultStatement,
      marqueeText: defaultMarquee,
    }
  }

  // If raw is an array (legacy format)
  if (Array.isArray(raw)) {
    return {
      stats: raw.length > 0 ? raw.map((item: any, idx: number) => ({
        id: item.id || `stat-${idx + 1}`,
        label: item.label || 'STATISTIC',
        value: typeof item.value === 'number' ? item.value : parseFloat(item.value) || 0,
        prefix: item.prefix || '',
        suffix: item.suffix || '',
        description: item.description || '',
        order: typeof item.order === 'number' ? item.order : idx + 1,
        visible: item.visible !== false,
      })) : defaultStats,
      statement: defaultStatement,
      marqueeText: defaultMarquee,
    }
  }

  const rawStats = Array.isArray(raw.stats) && raw.stats.length > 0 ? raw.stats : defaultStats
  return {
    stats: rawStats.map((item: any, idx: number) => ({
      id: item.id || `stat-${idx + 1}`,
      label: item.label || 'STATISTIC',
      value: typeof item.value === 'number' ? item.value : parseFloat(item.value) || 0,
      prefix: item.prefix || '',
      suffix: item.suffix || '',
      description: item.description || '',
      order: typeof item.order === 'number' ? item.order : idx + 1,
      visible: item.visible !== false,
    })),
    statement: {
      heading: raw.statement?.heading || defaultStatement.heading,
      subheading: raw.statement?.subheading || defaultStatement.subheading,
      description: raw.statement?.description || defaultStatement.description,
    },
    marqueeText: raw.marqueeText || defaultMarquee,
    updatedAt: raw.updatedAt,
  }
}

export interface ActivityItem {
  id: string
  description: string
  timestamp: string
  type:
    | 'work_created'
    | 'work_updated'
    | 'work_published'
    | 'work_archived'
    | 'category_updated'
    | 'workgroup_updated'
    | 'site_updated'
    | 'media_uploaded'
    | 'media_updated'
}

const STORAGE_KEY = 'tobi_admin_content_v4'

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'ad',
    name: 'ILLUSTRATIONS',
    slug: 'illustrations',
    tagline: 'TOBI XP',
    description: 'Digital illustrations, character designs, anatomical studies and paintings.',
    cover: '/images/works/Illustrations/Illustrations.webp',
    imageUrl: '/images/works/Illustrations/Illustrations.webp',
    imageMediaId: 'med-ad-cover',
    coverMediaId: 'med-ad-cover',
    tools: ['Procreate', 'Photoshop', 'Illustrator'],
    order: 1,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-03-20T14:30:00.000Z',
  },
  {
    id: 'maker',
    name: 'DESIGNS',
    slug: 'designs',
    tagline: 'TBXP',
    description: 'UI/UX design systems, brand identities, logomarks, and motion graphics.',
    cover: '/works/covers/maker.jpg',
    imageUrl: '/works/covers/maker.jpg',
    imageMediaId: 'med-maker-cover',
    coverMediaId: 'med-maker-cover',
    tools: ['Figma', 'Illustrator', 'Premiere Pro', 'After Effect'],
    order: 2,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-05-10T15:20:00.000Z',
  },
  {
    id: 'product',
    name: 'SIMULATIONS',
    slug: 'simulations',
    tagline: 'Interactive Environments',
    description: 'Real-time WebGL experiences, GPU particle vortexes, and 3D spatial worlds.',
    cover: '/works/covers/product.jpg',
    imageUrl: '/works/covers/product.jpg',
    imageMediaId: 'med-product-cover',
    coverMediaId: 'med-product-cover',
    tools: ['Three.js', 'Blender'],
    order: 3,
    status: 'hidden',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2025-02-14T11:00:00.000Z',
  },
  {
    id: 'graphics',
    name: 'RANDOM STUVS',
    slug: 'random-stuvs',
    tagline: 'Archives',
    description: 'Assorted raster collages, typography experiments, and generative glass studies.',
    cover: '/works/covers/graphics.jpg',
    imageUrl: '/works/covers/graphics.jpg',
    imageMediaId: 'med-graphics-cover',
    coverMediaId: 'med-graphics-cover',
    tools: ['Procreate', 'Blender'],
    order: 4,
    status: 'hidden',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-08-20T17:00:00.000Z',
  },
]

export const INITIAL_WORK_GROUPS: WorkGroupItem[] = [
  // Illustrations
  {
    id: 'wg-char',
    name: 'Character Designs',
    slug: 'character-designs',
    categoryId: 'ad',
    discipline: 'Illustration',
    disciplineIds: ['illustration'],
    description: 'Explorative character art, anatomical studies, and costume silhouettes.',
    cover: '/images/works/Illustrations/Illustrations.webp',
    order: 0,
    status: 'hidden',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-03-20T14:30:00.000Z',
  },
  {
    id: 'wg-paint',
    name: 'Paintings',
    slug: 'paintings',
    categoryId: 'ad',
    discipline: '4 works',
    disciplineIds: ['digital-painting'],
    description: 'Atmospheric digital paintings highlighting natural lighting and surreal forms.',
    cover: '/images/works/Illustrations/Paintings/IMG_2591.webp',
    order: 1,
    status: 'active',
    createdAt: '2024-02-10T12:00:00.000Z',
    updatedAt: '2024-03-12T16:00:00.000Z',
  },
  {
    id: 'wg-sketch',
    name: 'Sketches',
    slug: 'sketches',
    categoryId: 'ad',
    discipline: '8 works',
    disciplineIds: ['sketches'],
    description: 'Quick ideation sketches and ink drawings exploring experimental postures.',
    cover: '/images/works/Illustrations/Sketches/IMG_2265.webp',
    order: 2,
    status: 'active',
    createdAt: '2023-11-05T09:00:00.000Z',
    updatedAt: '2023-12-01T11:00:00.000Z',
  },
  {
    id: 'wg-studies',
    name: 'Studies',
    slug: 'studies',
    categoryId: 'ad',
    discipline: '1 work',
    disciplineIds: ['anatomy'],
    description: 'Master copy studies, fabric rendering, and hand/face planes.',
    cover: '/images/works/Illustrations/Studies/Untitled_Artwork 2.webp',
    order: 3,
    status: 'active',
    createdAt: '2023-09-12T14:00:00.000Z',
    updatedAt: '2023-10-18T10:00:00.000Z',
  },

  // Designs
  {
    id: 'wg-uiux',
    name: 'UI/UX',
    slug: 'ui-ux',
    categoryId: 'maker',
    discipline: 'Game · Web',
    disciplineIds: ['game', 'web'],
    description: 'Futuristic game interface concept and responsive web design system.',
    cover: '/works/covers/maker.jpg',
    order: 1,
    status: 'active',
    createdAt: '2024-04-01T10:00:00.000Z',
    updatedAt: '2024-05-10T15:20:00.000Z',
  },
  {
    id: 'wg-logo',
    name: 'Logo',
    slug: 'logo',
    categoryId: 'maker',
    discipline: 'Branding',
    disciplineIds: ['branding'],
    description: 'Visual identity marks and icon systems crafted with geometric harmony.',
    cover: '/images/xp.png',
    order: 2,
    status: 'active',
    createdAt: '2024-03-15T11:00:00.000Z',
    updatedAt: '2024-04-02T13:40:00.000Z',
  },
  {
    id: 'wg-brand',
    name: 'Brand Identity',
    slug: 'brand-identity',
    categoryId: 'maker',
    discipline: 'Identity',
    disciplineIds: ['identity'],
    description: 'Comprehensive brand guidelines, typography hierarchies, and stationery.',
    cover: '/images/x.png',
    order: 3,
    status: 'active',
    createdAt: '2023-08-20T10:00:00.000Z',
    updatedAt: '2023-09-01T08:00:00.000Z',
  },
  {
    id: 'wg-others',
    name: 'Others',
    slug: 'design-others',
    categoryId: 'maker',
    discipline: 'Motion / Print',
    disciplineIds: ['motion-print'],
    description: 'Motion graphic bumpers, 3D typography posters, and micro-interactions.',
    cover: '/images/Vector (2).svg',
    order: 4,
    status: 'active',
    createdAt: '2023-07-14T15:00:00.000Z',
    updatedAt: '2023-08-04T12:00:00.000Z',
  },

  // Simulations
  {
    id: 'wg-tbxp-world',
    name: 'TBXP world',
    slug: 'tbxp-world',
    categoryId: 'product',
    discipline: 'Interactive 3D',
    disciplineIds: ['interactive-3d'],
    description: 'Real-time WebGL interactive 3D realm with spatial audio and physics.',
    cover: '/works/covers/product.jpg',
    order: 1,
    status: 'active',
    createdAt: '2025-01-10T16:00:00.000Z',
    updatedAt: '2025-02-14T11:00:00.000Z',
  },
  {
    id: 'wg-lweh',
    name: 'LWEH Simulation',
    slug: 'lweh-simulation',
    categoryId: 'product',
    discipline: 'Simulation',
    disciplineIds: ['simulation'],
    description: 'Procedural particle vortex and fluid physics playground.',
    cover: '/works/covers/product.jpg',
    order: 2,
    status: 'draft',
    createdAt: '2025-02-18T14:00:00.000Z',
    updatedAt: '2025-02-20T10:00:00.000Z',
  },

  // Random Stuvs
  {
    id: 'wg-unt1',
    name: 'Untitled01',
    slug: 'untitled01',
    categoryId: 'graphics',
    discipline: 'Graphic',
    disciplineIds: ['graphic'],
    description: 'Archived graphic exploration and kinetic raster collage.',
    cover: '/works/covers/graphics.jpg',
    order: 1,
    status: 'active',
    createdAt: '2024-05-12T09:00:00.000Z',
    updatedAt: '2024-05-12T09:00:00.000Z',
  },
  {
    id: 'wg-unt2',
    name: 'Untitled02',
    slug: 'untitled02',
    categoryId: 'graphics',
    discipline: 'Graphic',
    disciplineIds: ['graphic'],
    description: 'Archived visual rhythm and brutalist layout study.',
    cover: '/images/bp.png',
    order: 2,
    status: 'active',
    createdAt: '2024-06-01T11:00:00.000Z',
    updatedAt: '2024-06-01T11:00:00.000Z',
  },
  {
    id: 'wg-unt3',
    name: 'Untitled03',
    slug: 'untitled03',
    categoryId: 'graphics',
    discipline: 'Graphic',
    disciplineIds: ['graphic'],
    description: 'Collage of organic forms and geometric vectors.',
    cover: '/images/buzyzheng.png',
    order: 3,
    status: 'active',
    createdAt: '2024-07-04T12:00:00.000Z',
    updatedAt: '2024-07-04T12:00:00.000Z',
  },
  {
    id: 'wg-unt4',
    name: 'Untitled04',
    slug: 'untitled04',
    categoryId: 'graphics',
    discipline: 'Graphic',
    disciplineIds: ['graphic'],
    description: 'Series finale exploration with vibrant chromatic aberration.',
    cover: '/images/hotsar.jpg',
    order: 4,
    status: 'active',
    createdAt: '2024-08-20T17:00:00.000Z',
    updatedAt: '2024-08-20T17:00:00.000Z',
  },
]

export const INITIAL_WORKS: Work[] = [
  {
    id: 'w-1',
    title: 'Character Designs',
    slug: 'character-designs',
    categoryId: 'ad',
    workGroupId: 'wg-char',
    discipline: 'Illustration',
    disciplineIds: ['illustration'],
    year: '2024',
    description: 'Explorative character art, anatomical studies, and costume silhouettes.',
    coverImage: '/images/works/Illustrations/Illustrations.webp',
    gallery: [
      { image: '/images/buzyzheng.png', title: 'Character Study 01' },
      { image: '/images/bp.png', title: 'Costume Variant 02' },
      { image: '/images/hotsar.jpg', title: 'Color Palette Pass 03' },
    ],
    tools: ['Procreate', 'Photoshop'],
    client: 'Studio Personal',
    projectType: 'Illustration',
    externalUrl: '',
    content: '## Character Designs\n\nA collection of character concepts exploring stylized proportions, mechanical accents, and dynamic poses.',
    featured: false,
    status: 'hidden',
    order: 0,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-03-20T14:30:00.000Z',
  },
  {
    id: 'w-2',
    title: 'Paintings',
    slug: 'paintings',
    categoryId: 'ad',
    workGroupId: 'wg-paint',
    discipline: '4 works',
    disciplineIds: ['digital-painting'],
    year: '2024',
    description: 'Atmospheric digital paintings highlighting natural lighting and surreal forms.',
    coverImage: '/images/works/Illustrations/Paintings/IMG_2591.webp',
    gallery: [
      { image: '/images/works/Illustrations/Paintings/IMG_2591.webp', title: 'IMG 2591' },
      { image: '/images/works/Illustrations/Paintings/IMG_2596.webp', title: 'IMG 2596' },
      { image: '/images/works/Illustrations/Paintings/IMG_2597.webp', title: 'IMG 2597' },
      { image: '/images/works/Illustrations/Paintings/IMG_2602.webp', title: 'IMG 2602' },
    ],
    tools: ['Photoshop', 'Procreate'],
    client: 'Personal',
    projectType: 'Digital Painting',
    externalUrl: '',
    content: '## Paintings\n\nStudy of ambient environmental occlusion, warm rim lights, and texture rendering.',
    featured: false,
    status: 'published',
    order: 1,
    createdAt: '2024-02-10T12:00:00.000Z',
    updatedAt: '2024-03-12T16:00:00.000Z',
  },
  {
    id: 'w-3',
    title: 'Sketches',
    slug: 'sketches',
    categoryId: 'ad',
    workGroupId: 'wg-sketch',
    discipline: '8 works',
    disciplineIds: ['sketches'],
    year: '2023',
    description: 'Quick ideation sketches and ink drawings exploring experimental postures.',
    coverImage: '/images/works/Illustrations/Sketches/IMG_2265.webp',
    gallery: [
      { image: '/images/works/Illustrations/Sketches/IMG_2265.webp', title: 'IMG 2265' },
      { image: '/images/works/Illustrations/Sketches/IMG_2380.webp', title: 'IMG 2380' },
      { image: '/images/works/Illustrations/Sketches/IMG_2592.webp', title: 'IMG 2592' },
      { image: '/images/works/Illustrations/Sketches/IMG_2593.webp', title: 'IMG 2593' },
      { image: '/images/works/Illustrations/Sketches/IMG_2594.webp', title: 'IMG 2594' },
      { image: '/images/works/Illustrations/Sketches/IMG_2595.webp', title: 'IMG 2595' },
      { image: '/images/works/Illustrations/Sketches/IMG_2598.webp', title: 'IMG 2598' },
      { image: '/images/works/Illustrations/Sketches/IMG_2600.webp', title: 'IMG 2600' },
    ],
    tools: ['Procreate'],
    client: 'Personal',
    projectType: 'Sketches',
    externalUrl: '',
    content: '## Sketches\n\nFast gesture drawings and kinetic silhouettes capturing spontaneous energy.',
    featured: false,
    status: 'published',
    order: 2,
    createdAt: '2023-11-05T09:00:00.000Z',
    updatedAt: '2023-12-01T11:00:00.000Z',
  },
  {
    id: 'w-4',
    title: 'Studies',
    slug: 'studies',
    categoryId: 'ad',
    workGroupId: 'wg-studies',
    discipline: '0 works',
    disciplineIds: ['anatomy'],
    year: '2023',
    description: 'Master copy studies, fabric rendering, and hand/face planes.',
    coverImage: '',
    gallery: [],
    tools: ['Photoshop'],
    client: 'Study',
    projectType: 'Anatomy',
    externalUrl: '',
    content: '## Form & Lighting Studies\n\nObservational passes focusing on values, edge control, and sub-surface scattering.',
    featured: false,
    status: 'published',
    order: 3,
    createdAt: '2023-09-12T14:00:00.000Z',
    updatedAt: '2023-10-18T10:00:00.000Z',
  },
  {
    id: 'w-5',
    title: 'UI/UX',
    slug: 'ui-ux',
    categoryId: 'maker',
    workGroupId: 'wg-uiux',
    discipline: 'Game · Web',
    disciplineIds: ['game', 'web'],
    year: '2024',
    description: 'Futuristic game interface concept and responsive web design system.',
    coverImage: '/works/covers/maker.jpg',
    gallery: [{ image: '/images/xp.png', title: 'Interface System' }],
    tools: ['Figma', 'Illustrator'],
    client: 'Confidential',
    projectType: 'Game · Web',
    externalUrl: '',
    content: '## Game UI/UX\n\nHigh-density HUD design, modular inventory systems, and responsive typography scales.',
    featured: true,
    status: 'published',
    order: 1,
    createdAt: '2024-04-01T10:00:00.000Z',
    updatedAt: '2024-05-10T15:20:00.000Z',
  },
  {
    id: 'w-6',
    title: 'Logo',
    slug: 'logo',
    categoryId: 'maker',
    workGroupId: 'wg-logo',
    discipline: 'Branding',
    disciplineIds: ['branding'],
    year: '2024',
    description: 'Visual identity marks and icon systems crafted with geometric harmony.',
    coverImage: '/images/xp.png',
    gallery: [{ image: '/images/xp.png', title: 'Logo Mark' }],
    tools: ['Illustrator'],
    client: 'Various',
    projectType: 'Branding',
    externalUrl: '',
    content: '## Logomark Explorations\n\nMonogram lockups and responsive glyphs tailored for screens and physical merchandise.',
    featured: false,
    status: 'published',
    order: 2,
    createdAt: '2024-03-15T11:00:00.000Z',
    updatedAt: '2024-04-02T13:40:00.000Z',
  },
  {
    id: 'w-7',
    title: 'Brand Identity',
    slug: 'brand-identity',
    categoryId: 'maker',
    workGroupId: 'wg-brand',
    discipline: 'Identity',
    disciplineIds: ['identity'],
    year: '2023',
    description: 'Comprehensive brand guidelines, typography hierarchies, and stationery.',
    coverImage: '/images/x.png',
    gallery: [{ image: '/images/x.png', title: 'Brand Mark' }],
    tools: ['Illustrator', 'Figma'],
    client: 'TBXP Studio',
    projectType: 'Identity',
    externalUrl: '',
    content: '## Brand Identity System\n\nVisual guidelines and aesthetic direction established for the TOBI XP creative label.',
    featured: false,
    status: 'published',
    order: 3,
    createdAt: '2023-08-20T10:00:00.000Z',
    updatedAt: '2023-09-01T08:00:00.000Z',
  },
  {
    id: 'w-8',
    title: 'Others',
    slug: 'design-others',
    categoryId: 'maker',
    workGroupId: 'wg-others',
    discipline: 'Motion / Print',
    disciplineIds: ['motion-print'],
    year: '2023',
    description: 'Motion graphic bumpers, 3D typography posters, and micro-interactions.',
    coverImage: '/images/Vector (2).svg',
    gallery: [{ image: '/images/Vector (2).svg', title: 'Vector Asset' }],
    tools: ['After Effects', 'Premiere Pro'],
    client: 'Personal',
    projectType: 'Motion / Print',
    externalUrl: '',
    content: '## Design Oddities\n\nAssorted graphic artifacts, vector experiments, and motion test pieces.',
    featured: false,
    status: 'published',
    order: 4,
    createdAt: '2023-07-14T15:00:00.000Z',
    updatedAt: '2023-08-04T12:00:00.000Z',
  },
  {
    id: 'w-9',
    title: 'TBXP world',
    slug: 'tbxp-world',
    categoryId: 'product',
    workGroupId: 'wg-tbxp-world',
    discipline: 'Interactive 3D',
    disciplineIds: ['interactive-3d'],
    year: '2025',
    description: 'Real-time WebGL interactive 3D realm with spatial audio and physics.',
    coverImage: '/works/covers/product.jpg',
    gallery: [{ image: '/images/hotsar.jpg', title: 'World Render' }],
    tools: ['Three.js', 'Blender', 'TypeScript'],
    client: 'Self-initiated',
    projectType: 'Interactive 3D',
    externalUrl: '',
    content: '## TBXP World\n\nAn immersive real-time canvas built using Three.js shaders and custom GLTF animations.',
    featured: true,
    status: 'published',
    order: 1,
    createdAt: '2025-01-10T16:00:00.000Z',
    updatedAt: '2025-02-14T11:00:00.000Z',
  },
  {
    id: 'w-10',
    title: 'LWEH Simulation',
    slug: 'lweh-simulation',
    categoryId: 'product',
    workGroupId: 'wg-lweh',
    discipline: 'Simulation',
    disciplineIds: ['simulation'],
    year: '2025',
    description: 'Procedural particle vortex and fluid physics playground.',
    coverImage: '/works/covers/product.jpg',
    gallery: [],
    tools: ['Three.js', 'GLSL'],
    client: 'Research',
    projectType: 'Simulation',
    externalUrl: '',
    content: '## LWEH Simulation\n\nComputing particle forces on the GPU with custom FBO ping-pong textures.',
    featured: false,
    status: 'draft',
    order: 2,
    createdAt: '2025-02-18T14:00:00.000Z',
    updatedAt: '2025-02-20T10:00:00.000Z',
  },
  {
    id: 'w-11',
    title: 'Untitled01',
    slug: 'untitled01',
    categoryId: 'graphics',
    workGroupId: 'wg-unt1',
    discipline: 'Graphic',
    disciplineIds: ['graphic'],
    year: '2024',
    description: 'Archived graphic exploration and kinetic raster collage.',
    coverImage: '/works/covers/graphics.jpg',
    gallery: [],
    tools: ['Photoshop'],
    client: 'Archive',
    projectType: 'Graphic',
    externalUrl: '',
    content: '## Untitled 01\n\nArchived visual piece exploring glitch textures and halftones.',
    featured: false,
    status: 'published',
    order: 1,
    createdAt: '2024-05-12T09:00:00.000Z',
    updatedAt: '2024-05-12T09:00:00.000Z',
  },
  {
    id: 'w-12',
    title: 'Untitled02',
    slug: 'untitled02',
    categoryId: 'graphics',
    workGroupId: 'wg-unt2',
    discipline: 'Graphic',
    disciplineIds: ['graphic'],
    year: '2024',
    description: 'Archived visual rhythm and brutalist layout study.',
    coverImage: '/images/bp.png',
    gallery: [],
    tools: ['Illustrator'],
    client: 'Archive',
    projectType: 'Graphic',
    externalUrl: '',
    content: '## Untitled 02\n\nTypography juxtaposition and high-contrast forms.',
    featured: false,
    status: 'published',
    order: 2,
    createdAt: '2024-06-01T11:00:00.000Z',
    updatedAt: '2024-06-01T11:00:00.000Z',
  },
  {
    id: 'w-13',
    title: 'Untitled03',
    slug: 'untitled03',
    categoryId: 'graphics',
    workGroupId: 'wg-unt3',
    discipline: 'Graphic',
    disciplineIds: ['graphic'],
    year: '2024',
    description: 'Collage of organic forms and geometric vectors.',
    coverImage: '/images/buzyzheng.png',
    gallery: [],
    tools: ['Mixed Media'],
    client: 'Archive',
    projectType: 'Graphic',
    externalUrl: '',
    content: '## Untitled 03\n\nMixed media experimentation combining analog drawings with digital shaders.',
    featured: false,
    status: 'published',
    order: 3,
    createdAt: '2024-07-04T12:00:00.000Z',
    updatedAt: '2024-07-04T12:00:00.000Z',
  },
  {
    id: 'w-14',
    title: 'Untitled04',
    slug: 'untitled04',
    categoryId: 'graphics',
    workGroupId: 'wg-unt4',
    discipline: 'Graphic',
    disciplineIds: ['graphic'],
    year: '2024',
    description: 'Series finale exploration with vibrant chromatic aberration.',
    coverImage: '/images/hotsar.jpg',
    gallery: [],
    tools: ['Blender'],
    client: 'Archive',
    projectType: 'Graphic',
    externalUrl: '',
    content: '## Untitled 04\n\nAbstract composition testing refractive glass materials.',
    featured: false,
    status: 'published',
    order: 4,
    createdAt: '2024-08-20T17:00:00.000Z',
    updatedAt: '2024-08-20T17:00:00.000Z',
  },
]

export const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'm-1',
    filename: 'xp.png',
    url: '/images/xp.png',
    type: 'image',
    width: 512,
    height: 512,
    size: '48 KB',
    usageCount: 4,
    categoryId: 'maker',
    workGroupId: 'wg-logo',
    workId: 'w-6',
    status: 'published',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'm-2',
    filename: 'buzyzheng.png',
    url: '/images/buzyzheng.png',
    type: 'image',
    width: 1200,
    height: 800,
    size: '420 KB',
    usageCount: 3,
    categoryId: 'ad',
    workGroupId: 'wg-paint',
    workId: 'w-2',
    status: 'published',
    createdAt: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'm-3',
    filename: 'bp.png',
    url: '/images/bp.png',
    type: 'image',
    width: 1200,
    height: 800,
    size: '380 KB',
    usageCount: 3,
    categoryId: 'ad',
    workGroupId: 'wg-sketch',
    workId: 'w-3',
    status: 'published',
    createdAt: '2024-01-12T00:00:00.000Z',
  },
  {
    id: 'm-4',
    filename: 'hotsar.jpg',
    url: '/images/hotsar.jpg',
    type: 'image',
    width: 1400,
    height: 900,
    size: '560 KB',
    usageCount: 4,
    categoryId: 'ad',
    workGroupId: 'wg-studies',
    workId: 'w-4',
    status: 'published',
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'm-5',
    filename: 'mask.glb',
    url: '/models/mask.glb',
    type: '3d',
    size: '1.8 MB',
    usageCount: 1,
    categoryId: 'product',
    workGroupId: 'wg-tbxp-world',
    workId: 'w-9',
    status: 'published',
    createdAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'm-6',
    filename: 'me.glb',
    url: '/models/me.glb',
    type: '3d',
    size: '3.4 MB',
    usageCount: 1,
    categoryId: 'product',
    workGroupId: 'wg-tbxp-world',
    workId: 'w-9',
    status: 'published',
    createdAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'm-7',
    filename: 'tbxp.glb',
    url: '/models/tbxp.glb',
    type: '3d',
    size: '2.2 MB',
    usageCount: 1,
    categoryId: 'product',
    workGroupId: 'wg-tbxp-world',
    workId: 'w-9',
    status: 'published',
    createdAt: '2024-01-05T00:00:00.000Z',
  },
]

export const INITIAL_SITE_CONTENT: SiteContentData = {
  hero: {
    title: 'TOBI XP',
    role: 'ILLUSTRATOR & DESIGNER',
    disciplines: 'ILLUSTRATOR · DESIGNER',
    statusLine: 'AVAILABLE FOR SELECT WORK',
    microCopyTop: 'FIGURING IT OUT AS I GO.',
    microCopyLeft: 'I DRAW.\nI DESIGN.\nI BUILD THINGS.',
    microCopyHint: 'GO AHEAD.\nMOVE IT.',
    heroStatement: "UHMMM... I DIDN’T REALLY\nKNOW WHAT TO PUT HERE,\nSO THIS IS WHAT WE’RE\nGOING WITH LOL",
    paragraphs: [
      'Digital artist, character designer, and creative technologist based in between dimensions.',
    ],
  },
  about: {
    eyebrow: 'ABOUT',
    heading: 'I MAKE THINGS\nPEOPLE CAN EXPERIENCE.',
    narrative: 'I’m Tobi XP — an illustrator and designer working across art, interaction, and digital experiences.',
    personalityNote: 'I like making things and seeing what happens.',
    ctaLabel: 'EXPLORE WORKS',
    skills: [
      'Illustration',
      'Character Design',
      'UI/UX Design',
      'Product Design',
      'Brand Identity',
      'Simulation Design',
      'Visual Storytelling',
      'Concept Art',
      '3D Design',
    ],
  },
  contact: {
    number: '05',
    title: 'CONTACT US',
    tagline: 'LET’S BUILD SOMETHING MEANINGFUL TOGETHER',
    email: 'businesstobixp@gmail.com',
    nameLabel: 'NAME',
    emailLabel: 'EMAIL',
    messageLabel: 'MESSAGE',
    sendLabel: 'SEND MESSAGE',
  },
  social: {
    instagram: 'https://instagram.com/tobi.xp/',
    email: 'mailto:businesstobixp@gmail.com',
    guestbookLabel: 'GUESTBOOK',
  },
  resume: {
    title: 'Résumé',
    entries: [
      {
        id: 'res-1',
        period: '2026 – Present',
        place: 'TBXP Studio',
        role: 'Founder & Design Lead',
        points: [],
        links: [],
        order: 1,
        visible: true,
      },
      {
        id: 'res-2',
        period: '2024 – 2026',
        place: 'MIVA Learning Studio',
        role: 'Illustrator & Designer',
        points: ['Designer (Simulation Developer & Creative Builder)'],
        links: [],
        order: 2,
        visible: true,
      },
      {
        id: 'res-3',
        period: '2026',
        place: 'NEQUINOX STUDIO LTD',
        role: 'Game Concept Artist',
        points: [],
        links: [],
        order: 3,
        visible: true,
      },
      {
        id: 'res-4',
        period: '2018 – Present',
        place: 'TOBI XP',
        role: 'Freelance Illustrator & Designer',
        points: [],
        links: [
          {
            id: 'instagram',
            label: 'Instagram',
            href: 'https://instagram.com/tobi.xp/',
          },
        ],
        order: 4,
        visible: true,
      },
    ],
  },
  stats: normalizeStatsData(null),
  worksConfig: {
    title: 'Works',
    closeLabel: 'Back',
    openLabel: 'Explore',
    hint: 'Keep scrolling',
    awardsLabel: 'Awards',
    visitLabel: 'Visit site',
    detailPlaceholder: 'Your work description',
    phImageLabel: 'Image / Video',
    phButtonLabel: 'Link button',
  },
}

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    description: 'Character Study saved as draft',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    type: 'work_updated',
  },
  {
    id: 'act-2',
    description: 'LWEH Simulation edited',
    timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    type: 'work_updated',
  },
  {
    id: 'act-3',
    description: 'TBXP world published to portfolio',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    type: 'work_published',
  },
]

export const INITIAL_SETTINGS: AdminSiteSettings = {
  general: {
    portfolioName: 'TOBI XP',
    portfolioUrl: 'https://tobixp.com/',
    adminDisplayName: 'TOBI XP Studio',
    timezone: 'UTC',
    locale: 'en-US',
  },
  appearance: {
    theme: 'dark',
  },
  audio: {
    enabled: true,
    backgroundSoundUrl: '',
    fileName: 'ambient-background.mp3',
    mimeType: 'audio/mpeg',
    size: 4800000,
    duration: 135,
    defaultVolume: 0.7,
    updatedAt: '2024-03-20T14:30:00.000Z',
  },
  portfolio: {
    defaultWorkStatus: 'published',
    featuredOnlyPublic: false,
    defaultCategoryOrder: 'manual',
  },
  media: {
    defaultVisibility: 'published',
    maxUploadSizeMb: 50,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'model/gltf-binary',
    ],
  },
  analytics: {
    enabled: true,
    measurementId: 'G-TOBIXP2026',
    anonymizeIp: true,
    trackScrollMilestones: true,
    trackAudioEvents: true,
    trackDownloadEvents: true,
    trackThemeEvents: true,
    debugMode: false,
    updatedAt: '2026-09-29T12:00:00.000Z',
  },
  security: {
    authProvider: 'Google Sign-In (Firebase Auth)',
    adminEmail: 'tobyson707@gmail.com',
    allowedAdminEmails: ['tobyson707@gmail.com', 'jh204222@gmail.com'],
    lastAuthMethod: 'google.com OAuth 2.0',
  },
  updatedAt: '2024-03-20T14:30:00.000Z',
}

interface ContentStoreState {
  works: Work[]
  categories: Category[]
  workGroups: WorkGroupItem[]
  media: MediaItem[]
  site: SiteContentData
  settings: AdminSiteSettings
  activities: ActivityItem[]

  // Work operations
  addWork: (work: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>) => Work
  updateWork: (id: string, updates: Partial<Work>) => void
  deleteWork: (id: string) => void
  archiveWork: (id: string) => void
  restoreWork: (id: string) => void
  duplicateWork: (id: string) => Work | null
  moveWork: (id: string, newCategoryId: string, newWorkGroupId?: string) => void
  setWorkOrder: (id: string, newOrder: number) => void
  reorderWorks: (orderedIds: string[]) => void
  bulkUpdateWorks: (ids: string[], updates: Partial<Work>) => void
  bulkDeleteWorks: (ids: string[]) => void
  bulkMoveWorks: (ids: string[], targetCategoryId: string, targetWorkGroupId?: string) => void
  bulkDuplicateWorks: (ids: string[]) => Work[]
  bulkRestoreWorks: (ids: string[]) => void

  // Category operations
  addCategory: (cat: Omit<Category, 'id'>) => Category
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  archiveCategory: (id: string) => void
  restoreCategory: (id: string) => void
  reorderCategories: (orderedIds: string[]) => void
  bulkUpdateCategories: (ids: string[], updates: Partial<Category>) => void
  bulkDeleteCategories: (ids: string[]) => void
  bulkRestoreCategories: (ids: string[]) => void

  // WorkGroup (Subcategory) operations
  addWorkGroup: (group: Omit<WorkGroupItem, 'id' | 'createdAt' | 'updatedAt'>) => WorkGroupItem
  updateWorkGroup: (id: string, updates: Partial<WorkGroupItem>) => void
  deleteWorkGroup: (id: string) => void
  archiveWorkGroup: (id: string) => void
  restoreWorkGroup: (id: string) => void
  moveWorkGroup: (id: string, targetCategoryId: string) => void
  reorderWorkGroups: (orderedIds: string[]) => void
  bulkUpdateWorkGroups: (ids: string[], updates: Partial<WorkGroupItem>) => void
  bulkDeleteWorkGroups: (ids: string[]) => void
  bulkMoveWorkGroups: (ids: string[], targetCategoryId: string) => void
  bulkRestoreWorkGroups: (ids: string[]) => void

  // Media operations
  addMedia: (item: Omit<MediaItem, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => MediaItem
  updateMedia: (id: string, updates: Partial<MediaItem>) => void
  deleteMedia: (id: string) => void
  archiveMedia: (id: string) => void
  restoreMedia: (id: string) => void
  duplicateMedia: (id: string) => MediaItem | null
  moveMedia: (id: string, categoryId?: string, workGroupId?: string, workId?: string) => void
  bulkUpdateMedia: (ids: string[], updates: Partial<MediaItem>) => void
  bulkDeleteMedia: (ids: string[]) => void
  bulkMoveMedia: (ids: string[], categoryId?: string, workGroupId?: string) => void
  bulkRestoreMedia: (ids: string[]) => void

  // Mixed Archive Bulk Operations
  bulkRestoreMixed: (items: { id: string; type: 'work' | 'category' | 'subcategory' | 'media' }[]) => void
  bulkDeleteMixed: (items: { id: string; type: 'work' | 'category' | 'subcategory' | 'media' }[]) => void

  // Site operations
  updateSiteSection: <K extends keyof SiteContentData>(section: K, updates: Partial<SiteContentData[K]>) => void
  updateStatsSection: (updates: Partial<StatsSectionData>) => void
  addStat: (stat: Omit<StatItem, 'id'>) => void
  updateStat: (id: string, updates: Partial<StatItem>) => void
  deleteStat: (id: string) => void
  reorderStats: (orderedIds: string[]) => void

  // Settings operations
  updateSettings: (updates: Partial<AdminSiteSettings>) => void

  // Logging
  logActivity: (description: string, type: ActivityItem['type']) => void

  // Public output derivations
  getPublishedWorks: () => Work[]
  getPublicSections: () => WorkSection[]
  resetToDefaults: () => void

  // Firebase synchronization
  isFirebaseConnected: boolean
  isSyncing: boolean
  lastSyncError: string | null
  syncStatusMessage: string
  collectFromFirebase: () => Promise<void>
  pushToFirebase: () => Promise<void>
}

function loadPersistedState(): {
  works: Work[]
  categories: Category[]
  workGroups: WorkGroupItem[]
  media: MediaItem[]
  site: SiteContentData
  settings: AdminSiteSettings
  activities: ActivityItem[]
} {
  if (typeof window === 'undefined') {
    return {
      works: INITIAL_WORKS,
      categories: INITIAL_CATEGORIES,
      workGroups: INITIAL_WORK_GROUPS,
      media: INITIAL_MEDIA,
      site: INITIAL_SITE_CONTENT,
      settings: INITIAL_SETTINGS,
      activities: INITIAL_ACTIVITIES,
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        works: parsed.works || INITIAL_WORKS,
        categories: parsed.categories || INITIAL_CATEGORIES,
        workGroups: parsed.workGroups || INITIAL_WORK_GROUPS,
        media: parsed.media || INITIAL_MEDIA,
        site: parsed.site
          ? {
              ...INITIAL_SITE_CONTENT,
              ...parsed.site,
              stats: normalizeStatsData(parsed.site.stats),
            }
          : INITIAL_SITE_CONTENT,
        settings: parsed.settings ? { ...INITIAL_SETTINGS, ...parsed.settings } : INITIAL_SETTINGS,
        activities: parsed.activities || INITIAL_ACTIVITIES,
      }
    }
  } catch (e) {
    console.error('Error loading persisted content store:', e)
  }

  return {
    works: INITIAL_WORKS,
    categories: INITIAL_CATEGORIES,
    workGroups: INITIAL_WORK_GROUPS,
    media: INITIAL_MEDIA,
    site: INITIAL_SITE_CONTENT,
    settings: INITIAL_SETTINGS,
    activities: INITIAL_ACTIVITIES,
  }
}

function persistState(state: {
  works: Work[]
  categories: Category[]
  workGroups: WorkGroupItem[]
  media: MediaItem[]
  site: SiteContentData
  settings: AdminSiteSettings
  activities: ActivityItem[]
}) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        works: state.works,
        categories: state.categories,
        workGroups: state.workGroups,
        media: state.media,
        site: state.site,
        settings: state.settings,
        activities: state.activities,
      })
    )
  } catch (e) {
    console.error('Failed to save to localStorage', e)
  }
}

const initialData = loadPersistedState()

export const useContentStore = create<ContentStoreState>((set, get) => ({
  works: initialData.works,
  categories: initialData.categories,
  workGroups: initialData.workGroups,
  media: initialData.media,
  site: initialData.site,
  settings: initialData.settings,
  activities: initialData.activities,

  isFirebaseConnected: false,
  isSyncing: false,
  lastSyncError: null,
  syncStatusMessage: 'Connecting to Firebase...',

  addWork: (workData) => {
    const now = new Date().toISOString()
    const newWork: Work = {
      ...workData,
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => {
      const nextWorks = [newWork, ...state.works]
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Created new work: "${newWork.title}" (${newWork.status})`,
          timestamp: now,
          type: 'work_created',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, works: nextWorks, activities: nextActivities }
      persistState(nextState)
      return { works: nextWorks, activities: nextActivities }
    })

    syncWorkToFirestore(newWork).catch((e) => console.warn('[Firestore] syncWork error:', e))
    return newWork
  },

  updateWork: (id, updates) => {
    const now = new Date().toISOString()
    set((state) => {
      const targetWork = state.works.find((w) => w.id === id)
      const nextWorks = state.works.map((w) => (w.id === id ? { ...w, ...updates, updatedAt: now } : w))
      const actionDesc =
        updates.status && targetWork && targetWork.status !== updates.status
          ? `Work "${targetWork.title}" marked as ${updates.status}`
          : `Edited work "${targetWork?.title || id}"`

      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: actionDesc,
          timestamp: now,
          type: updates.status === 'published' ? 'work_published' : 'work_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, works: nextWorks, activities: nextActivities }
      persistState(nextState)

      const updated = nextWorks.find((w) => w.id === id)
      if (updated) {
        syncWorkToFirestore(updated).catch((e) => console.warn('[Firestore] updateWork error:', e))
      }

      return { works: nextWorks, activities: nextActivities }
    })
  },

  deleteWork: (id) => {
    set((state) => {
      const targetWork = state.works.find((w) => w.id === id)
      const nextWorks = state.works.filter((w) => w.id !== id)
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Deleted work: "${targetWork?.title || id}"`,
          timestamp: new Date().toISOString(),
          type: 'work_archived',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, works: nextWorks, activities: nextActivities }
      persistState(nextState)
      return { works: nextWorks, activities: nextActivities }
    })
    deleteWorkFromFirestore(id).catch((e) => console.warn('[Firestore] deleteWork error:', e))
  },

  archiveWork: (id) => {
    const target = get().works.find((w) => w.id === id)
    const prev = target && target.status !== 'archived' ? target.status : 'published'
    get().updateWork(id, {
      status: 'archived',
      previousStatus: prev,
      archivedAt: new Date().toISOString(),
    })
  },

  restoreWork: (id) => {
    const target = get().works.find((w) => w.id === id)
    const nextStatus = target?.previousStatus || 'published'
    get().updateWork(id, {
      status: nextStatus,
      archivedAt: undefined,
    })
  },

  bulkRestoreWorks: (ids) => {
    const now = new Date().toISOString()
    const idSet = new Set(ids)
    set((state) => {
      const nextWorks = state.works.map((w) => {
        if (idSet.has(w.id)) {
          const nextStatus = w.previousStatus || 'published'
          return { ...w, status: nextStatus, archivedAt: undefined, updatedAt: now }
        }
        return w
      })
      const nextState = { ...state, works: nextWorks }
      persistState(nextState)
      nextWorks.filter((w) => idSet.has(w.id)).forEach((w) => syncWorkToFirestore(w).catch(() => {}))
      return { works: nextWorks }
    })
  },

  duplicateWork: (id) => {
    const original = get().works.find((w) => w.id === id)
    if (!original) return null

    const now = new Date().toISOString()
    const duplicate: Work = {
      ...original,
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Math.floor(Math.random() * 1000)}`,
      status: 'draft',
      order: original.order + 1,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => {
      const nextWorks = [duplicate, ...state.works]
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Duplicated "${original.title}" as draft`,
          timestamp: now,
          type: 'work_created',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, works: nextWorks, activities: nextActivities }
      persistState(nextState)
      return { works: nextWorks, activities: nextActivities }
    })

    syncWorkToFirestore(duplicate).catch((e) => console.warn('[Firestore] duplicateWork error:', e))
    return duplicate
  },

  moveWork: (id, newCategoryId, newWorkGroupId) => {
    const now = new Date().toISOString()
    set((state) => {
      const nextWorks = state.works.map((w) =>
        w.id === id
          ? {
              ...w,
              categoryId: newCategoryId,
              workGroupId: newWorkGroupId || undefined,
              updatedAt: now,
            }
          : w
      )
      const target = nextWorks.find((w) => w.id === id)
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Moved work "${target?.title || id}"`,
          timestamp: now,
          type: 'work_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, works: nextWorks, activities: nextActivities }
      persistState(nextState)
      if (target) syncWorkToFirestore(target).catch(() => {})
      return { works: nextWorks, activities: nextActivities }
    })
  },

  setWorkOrder: (id, newOrder) => {
    set((state) => {
      const nextWorks = state.works.map((w) => (w.id === id ? { ...w, order: newOrder } : w))
      const nextState = { ...state, works: nextWorks }
      persistState(nextState)
      const target = nextWorks.find((w) => w.id === id)
      if (target) syncWorkToFirestore(target).catch((e) => console.warn('[Firestore] setWorkOrder error:', e))
      return { works: nextWorks }
    })
  },

  reorderWorks: (orderedIds) => {
    set((state) => {
      const idToOrder = new Map(orderedIds.map((id, index) => [id, index + 1]))
      const nextWorks = state.works.map((w) => {
        if (idToOrder.has(w.id)) {
          return { ...w, order: idToOrder.get(w.id)! }
        }
        return w
      })
      const nextState = { ...state, works: nextWorks }
      persistState(nextState)
      nextWorks.forEach((w) => {
        if (idToOrder.has(w.id)) {
          syncWorkToFirestore(w).catch(() => {})
        }
      })
      return { works: nextWorks }
    })
  },

  bulkUpdateWorks: (ids, updates) => {
    const now = new Date().toISOString()
    set((state) => {
      const idSet = new Set(ids)
      const nextWorks = state.works.map((w) => (idSet.has(w.id) ? { ...w, ...updates, updatedAt: now } : w))
      const nextState = { ...state, works: nextWorks }
      persistState(nextState)
      nextWorks.filter((w) => idSet.has(w.id)).forEach((w) => syncWorkToFirestore(w).catch(() => {}))
      return { works: nextWorks }
    })
  },

  bulkDeleteWorks: (ids) => {
    const idSet = new Set(ids)
    set((state) => {
      const nextWorks = state.works.filter((w) => !idSet.has(w.id))
      const nextState = { ...state, works: nextWorks }
      persistState(nextState)
      ids.forEach((id) => deleteWorkFromFirestore(id).catch(() => {}))
      return { works: nextWorks }
    })
  },

  bulkMoveWorks: (ids, targetCategoryId, targetWorkGroupId) => {
    const now = new Date().toISOString()
    set((state) => {
      const idSet = new Set(ids)
      const nextWorks = state.works.map((w) =>
        idSet.has(w.id)
          ? {
              ...w,
              categoryId: targetCategoryId,
              workGroupId: targetWorkGroupId || undefined,
              updatedAt: now,
            }
          : w
      )
      const nextState = { ...state, works: nextWorks }
      persistState(nextState)
      nextWorks.filter((w) => idSet.has(w.id)).forEach((w) => syncWorkToFirestore(w).catch(() => {}))
      return { works: nextWorks }
    })
  },

  bulkDuplicateWorks: (ids) => {
    const now = new Date().toISOString()
    const idSet = new Set(ids)
    const originals = get().works.filter((w) => idSet.has(w.id))
    const duplicates: Work[] = originals.map((orig, i) => ({
      ...orig,
      id: `w-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${orig.title} (Copy)`,
      slug: `${orig.slug}-copy-${Math.floor(Math.random() * 1000)}`,
      status: 'draft',
      order: orig.order + 1,
      createdAt: now,
      updatedAt: now,
    }))

    set((state) => {
      const nextWorks = [...duplicates, ...state.works]
      const nextState = { ...state, works: nextWorks }
      persistState(nextState)
      duplicates.forEach((d) => syncWorkToFirestore(d).catch(() => {}))
      return { works: nextWorks }
    })

    return duplicates
  },

  // Category operations
  addCategory: (catData) => {
    const now = new Date().toISOString()
    const newCategory: Category = {
      ...catData,
      id: catData.slug || `cat-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => {
      const nextCats = [...state.categories, newCategory]
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Created category: "${newCategory.name}"`,
          timestamp: now,
          type: 'category_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, categories: nextCats, activities: nextActivities }
      persistState(nextState)
      return { categories: nextCats, activities: nextActivities }
    })

    syncCategoryToFirestore(newCategory).catch((e) => console.warn('[Firestore] addCategory error:', e))
    return newCategory
  },

  updateCategory: (id, updates) => {
    const now = new Date().toISOString()
    set((state) => {
      const nextCats = state.categories.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: now } : c))
      const target = state.categories.find((c) => c.id === id)
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Updated category "${target?.name || id}"`,
          timestamp: now,
          type: 'category_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, categories: nextCats, activities: nextActivities }
      persistState(nextState)

      const updated = nextCats.find((c) => c.id === id)
      if (updated) {
        syncCategoryToFirestore(updated).catch((e) => console.warn('[Firestore] updateCategory error:', e))
      }

      return { categories: nextCats, activities: nextActivities }
    })
  },

  deleteCategory: (id) => {
    set((state) => {
      const nextCats = state.categories.filter((c) => c.id !== id)
      const nextState = { ...state, categories: nextCats }
      persistState(nextState)
      return { categories: nextCats }
    })
    deleteCategoryFromFirestore(id).catch((e) => console.warn('[Firestore] deleteCategory error:', e))
  },

  archiveCategory: (id) => {
    const target = get().categories.find((c) => c.id === id)
    const prev = target && target.status !== 'archived' ? target.status : 'active'
    get().updateCategory(id, {
      status: 'archived',
      previousStatus: prev,
      archivedAt: new Date().toISOString(),
    })
  },

  restoreCategory: (id) => {
    const target = get().categories.find((c) => c.id === id)
    const nextStatus = target?.previousStatus || 'active'
    get().updateCategory(id, {
      status: nextStatus,
      archivedAt: undefined,
    })
  },

  bulkRestoreCategories: (ids) => {
    const now = new Date().toISOString()
    const idSet = new Set(ids)
    set((state) => {
      const nextCats = state.categories.map((c) => {
        if (idSet.has(c.id)) {
          const nextStatus = c.previousStatus || 'active'
          return { ...c, status: nextStatus, archivedAt: undefined, updatedAt: now }
        }
        return c
      })
      const nextState = { ...state, categories: nextCats }
      persistState(nextState)
      nextCats.filter((c) => idSet.has(c.id)).forEach((c) => syncCategoryToFirestore(c).catch(() => {}))
      return { categories: nextCats }
    })
  },

  reorderCategories: (orderedIds) => {
    set((state) => {
      const idToOrder = new Map(orderedIds.map((id, index) => [id, index + 1]))
      const nextCats = state.categories.map((c) => {
        if (idToOrder.has(c.id)) {
          return { ...c, order: idToOrder.get(c.id)! }
        }
        return c
      })
      const nextState = { ...state, categories: nextCats }
      persistState(nextState)
      nextCats.forEach((c) => {
        if (idToOrder.has(c.id)) {
          syncCategoryToFirestore(c).catch(() => {})
        }
      })
      return { categories: nextCats }
    })
  },

  bulkUpdateCategories: (ids, updates) => {
    const now = new Date().toISOString()
    set((state) => {
      const idSet = new Set(ids)
      const nextCats = state.categories.map((c) => (idSet.has(c.id) ? { ...c, ...updates, updatedAt: now } : c))
      const nextState = { ...state, categories: nextCats }
      persistState(nextState)
      nextCats.filter((c) => idSet.has(c.id)).forEach((c) => syncCategoryToFirestore(c).catch(() => {}))
      return { categories: nextCats }
    })
  },

  bulkDeleteCategories: (ids) => {
    const idSet = new Set(ids)
    set((state) => {
      const nextCats = state.categories.filter((c) => !idSet.has(c.id))
      const nextState = { ...state, categories: nextCats }
      persistState(nextState)
      ids.forEach((id) => deleteCategoryFromFirestore(id).catch(() => {}))
      return { categories: nextCats }
    })
  },

  // WorkGroup (Subcategory) operations
  addWorkGroup: (groupData) => {
    const now = new Date().toISOString()
    const newGroup: WorkGroupItem = {
      ...groupData,
      id: `wg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    }

    set((state) => {
      const nextGroups = [...state.workGroups, newGroup]
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Created subcategory: "${newGroup.name}"`,
          timestamp: now,
          type: 'workgroup_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, workGroups: nextGroups, activities: nextActivities }
      persistState(nextState)
      return { workGroups: nextGroups, activities: nextActivities }
    })

    syncWorkGroupToFirestore(newGroup).catch((e) => console.warn('[Firestore] addWorkGroup error:', e))
    return newGroup
  },

  updateWorkGroup: (id, updates) => {
    const now = new Date().toISOString()
    set((state) => {
      const nextGroups = state.workGroups.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: now } : g))
      const target = state.workGroups.find((g) => g.id === id)
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Updated subcategory "${target?.name || id}"`,
          timestamp: now,
          type: 'workgroup_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, workGroups: nextGroups, activities: nextActivities }
      persistState(nextState)

      const updated = nextGroups.find((g) => g.id === id)
      if (updated) {
        syncWorkGroupToFirestore(updated).catch((e) => console.warn('[Firestore] updateWorkGroup error:', e))
      }

      return { workGroups: nextGroups, activities: nextActivities }
    })
  },

  deleteWorkGroup: (id) => {
    set((state) => {
      const nextGroups = state.workGroups.filter((g) => g.id !== id)
      const nextState = { ...state, workGroups: nextGroups }
      persistState(nextState)
      return { workGroups: nextGroups }
    })
    deleteWorkGroupFromFirestore(id).catch((e) => console.warn('[Firestore] deleteWorkGroup error:', e))
  },

  archiveWorkGroup: (id) => {
    const target = get().workGroups.find((g) => g.id === id)
    const prev = target && target.status !== 'archived' ? target.status : 'active'
    get().updateWorkGroup(id, {
      status: 'archived',
      previousStatus: prev,
      archivedAt: new Date().toISOString(),
    })
  },

  restoreWorkGroup: (id) => {
    const target = get().workGroups.find((g) => g.id === id)
    const nextStatus = target?.previousStatus || 'active'
    get().updateWorkGroup(id, {
      status: nextStatus,
      archivedAt: undefined,
    })
  },

  bulkRestoreWorkGroups: (ids) => {
    const now = new Date().toISOString()
    const idSet = new Set(ids)
    set((state) => {
      const nextGroups = state.workGroups.map((g) => {
        if (idSet.has(g.id)) {
          const nextStatus = g.previousStatus || 'active'
          return { ...g, status: nextStatus, archivedAt: undefined, updatedAt: now }
        }
        return g
      })
      const nextState = { ...state, workGroups: nextGroups }
      persistState(nextState)
      nextGroups.filter((g) => idSet.has(g.id)).forEach((g) => syncWorkGroupToFirestore(g).catch(() => {}))
      return { workGroups: nextGroups }
    })
  },

  moveWorkGroup: (id, targetCategoryId) => {
    const now = new Date().toISOString()
    set((state) => {
      const nextGroups = state.workGroups.map((g) =>
        g.id === id ? { ...g, categoryId: targetCategoryId, updatedAt: now } : g
      )
      const target = nextGroups.find((g) => g.id === id)
      const nextWorks = state.works.map((w) =>
        w.workGroupId === id ? { ...w, categoryId: targetCategoryId, updatedAt: now } : w
      )
      const nextState = { ...state, workGroups: nextGroups, works: nextWorks }
      persistState(nextState)

      if (target) syncWorkGroupToFirestore(target).catch(() => {})
      nextWorks.filter((w) => w.workGroupId === id).forEach((w) => syncWorkToFirestore(w).catch(() => {}))

      return { workGroups: nextGroups, works: nextWorks }
    })
  },

  reorderWorkGroups: (orderedIds) => {
    set((state) => {
      const idToOrder = new Map(orderedIds.map((id, index) => [id, index + 1]))
      const nextGroups = state.workGroups.map((g) => {
        if (idToOrder.has(g.id)) {
          return { ...g, order: idToOrder.get(g.id)! }
        }
        return g
      })
      const nextState = { ...state, workGroups: nextGroups }
      persistState(nextState)
      nextGroups.forEach((g) => {
        if (idToOrder.has(g.id)) {
          syncWorkGroupToFirestore(g).catch(() => {})
        }
      })
      return { workGroups: nextGroups }
    })
  },

  bulkUpdateWorkGroups: (ids, updates) => {
    const now = new Date().toISOString()
    set((state) => {
      const idSet = new Set(ids)
      const nextGroups = state.workGroups.map((g) => (idSet.has(g.id) ? { ...g, ...updates, updatedAt: now } : g))
      const nextState = { ...state, workGroups: nextGroups }
      persistState(nextState)
      nextGroups.filter((g) => idSet.has(g.id)).forEach((g) => syncWorkGroupToFirestore(g).catch(() => {}))
      return { workGroups: nextGroups }
    })
  },

  bulkDeleteWorkGroups: (ids) => {
    const idSet = new Set(ids)
    set((state) => {
      const nextGroups = state.workGroups.filter((g) => !idSet.has(g.id))
      const nextState = { ...state, workGroups: nextGroups }
      persistState(nextState)
      ids.forEach((id) => deleteWorkGroupFromFirestore(id).catch(() => {}))
      return { workGroups: nextGroups }
    })
  },

  bulkMoveWorkGroups: (ids, targetCategoryId) => {
    const now = new Date().toISOString()
    set((state) => {
      const idSet = new Set(ids)
      const nextGroups = state.workGroups.map((g) =>
        idSet.has(g.id) ? { ...g, categoryId: targetCategoryId, updatedAt: now } : g
      )
      const nextWorks = state.works.map((w) =>
        w.workGroupId && idSet.has(w.workGroupId) ? { ...w, categoryId: targetCategoryId, updatedAt: now } : w
      )
      const nextState = { ...state, workGroups: nextGroups, works: nextWorks }
      persistState(nextState)
      nextGroups.filter((g) => idSet.has(g.id)).forEach((g) => syncWorkGroupToFirestore(g).catch(() => {}))
      nextWorks.filter((w) => w.workGroupId && idSet.has(w.workGroupId)).forEach((w) => syncWorkToFirestore(w).catch(() => {}))
      return { workGroups: nextGroups, works: nextWorks }
    })
  },

  // Media operations
  addMedia: (item) => {
    const rawId = item.id
    const rawCreatedAt = item.createdAt
    const newItem: MediaItem = {
      ...item,
      id: rawId || `med_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: item.name || item.filename,
      originalFileName: item.originalFileName || item.filename,
      mediaType: item.mediaType || item.type,
      status: item.status || 'published',
      visibility: item.visibility || item.status || 'published',
      createdAt: rawCreatedAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }
    set((state) => {
      const filtered = state.media.filter((m) => m.id !== newItem.id)
      const nextMedia = [newItem, ...filtered]
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Uploaded media: ${newItem.filename}`,
          timestamp: new Date().toISOString(),
          type: 'media_uploaded',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, media: nextMedia, activities: nextActivities }
      persistState(nextState)
      return { media: nextMedia, activities: nextActivities }
    })
    syncMediaToFirestore(newItem).catch((e) => console.warn('[Firestore] addMedia sync note:', e))
    return newItem
  },

  updateMedia: (id, updates) => {
    const now = new Date().toISOString()
    set((state) => {
      const nextMedia = state.media.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: now } : m))
      const target = nextMedia.find((m) => m.id === id)
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Updated media: ${target?.filename || id}`,
          timestamp: now,
          type: 'media_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, media: nextMedia, activities: nextActivities }
      persistState(nextState)
      if (target) syncMediaToFirestore(target).catch(() => {})
      return { media: nextMedia, activities: nextActivities }
    })
  },

  deleteMedia: (id) => {
    set((state) => {
      const nextMedia = state.media.filter((m) => m.id !== id)
      const nextState = { ...state, media: nextMedia }
      persistState(nextState)
      return { media: nextMedia }
    })
    deleteMediaFromFirestore(id).catch((e) => console.warn('[Firestore] deleteMedia error:', e))
  },

  archiveMedia: (id) => {
    const target = get().media.find((m) => m.id === id)
    const prev = target && target.status !== 'archived' ? target.status : 'published'
    get().updateMedia(id, {
      status: 'archived',
      previousStatus: prev,
      archivedAt: new Date().toISOString(),
    })
  },

  restoreMedia: (id) => {
    const target = get().media.find((m) => m.id === id)
    const nextStatus = target?.previousStatus || 'published'
    get().updateMedia(id, {
      status: nextStatus,
      archivedAt: undefined,
    })
  },

  bulkRestoreMedia: (ids) => {
    const now = new Date().toISOString()
    const idSet = new Set(ids)
    set((state) => {
      const nextMedia = state.media.map((m) => {
        if (idSet.has(m.id)) {
          const nextStatus = m.previousStatus || 'published'
          return { ...m, status: nextStatus, archivedAt: undefined, updatedAt: now }
        }
        return m
      })
      const nextState = { ...state, media: nextMedia }
      persistState(nextState)
      nextMedia.filter((m) => idSet.has(m.id)).forEach((m) => syncMediaToFirestore(m).catch(() => {}))
      return { media: nextMedia }
    })
  },

  duplicateMedia: (id) => {
    const original = get().media.find((m) => m.id === id)
    if (!original) return null
    const now = new Date().toISOString()
    const duplicate: MediaItem = {
      ...original,
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      filename: `Copy of ${original.filename}`,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => {
      const nextMedia = [duplicate, ...state.media]
      const nextState = { ...state, media: nextMedia }
      persistState(nextState)
      return { media: nextMedia }
    })
    syncMediaToFirestore(duplicate).catch(() => {})
    return duplicate
  },

  moveMedia: (id, categoryId, workGroupId, workId) => {
    get().updateMedia(id, { categoryId, workGroupId, workId })
  },

  bulkUpdateMedia: (ids, updates) => {
    const now = new Date().toISOString()
    set((state) => {
      const idSet = new Set(ids)
      const nextMedia = state.media.map((m) => (idSet.has(m.id) ? { ...m, ...updates, updatedAt: now } : m))
      const nextState = { ...state, media: nextMedia }
      persistState(nextState)
      nextMedia.filter((m) => idSet.has(m.id)).forEach((m) => syncMediaToFirestore(m).catch(() => {}))
      return { media: nextMedia }
    })
  },

  bulkDeleteMedia: (ids) => {
    const idSet = new Set(ids)
    set((state) => {
      const nextMedia = state.media.filter((m) => !idSet.has(m.id))
      const nextState = { ...state, media: nextMedia }
      persistState(nextState)
      ids.forEach((id) => deleteMediaFromFirestore(id).catch(() => {}))
      return { media: nextMedia }
    })
  },

  bulkMoveMedia: (ids, categoryId, workGroupId) => {
    const now = new Date().toISOString()
    set((state) => {
      const idSet = new Set(ids)
      const nextMedia = state.media.map((m) =>
        idSet.has(m.id)
          ? {
              ...m,
              categoryId: categoryId || undefined,
              workGroupId: workGroupId || undefined,
              updatedAt: now,
            }
          : m
      )
      const nextState = { ...state, media: nextMedia }
      persistState(nextState)
      nextMedia.filter((m) => idSet.has(m.id)).forEach((m) => syncMediaToFirestore(m).catch(() => {}))
      return { media: nextMedia }
    })
  },

  // Mixed Archive Bulk Operations
  bulkRestoreMixed: (items) => {
    const workIds = items.filter((i) => i.type === 'work').map((i) => i.id)
    const catIds = items.filter((i) => i.type === 'category').map((i) => i.id)
    const groupIds = items.filter((i) => i.type === 'subcategory').map((i) => i.id)
    const mediaIds = items.filter((i) => i.type === 'media').map((i) => i.id)

    if (workIds.length) get().bulkRestoreWorks(workIds)
    if (catIds.length) get().bulkRestoreCategories(catIds)
    if (groupIds.length) get().bulkRestoreWorkGroups(groupIds)
    if (mediaIds.length) get().bulkRestoreMedia(mediaIds)
  },

  bulkDeleteMixed: (items) => {
    const workIds = items.filter((i) => i.type === 'work').map((i) => i.id)
    const catIds = items.filter((i) => i.type === 'category').map((i) => i.id)
    const groupIds = items.filter((i) => i.type === 'subcategory').map((i) => i.id)
    const mediaIds = items.filter((i) => i.type === 'media').map((i) => i.id)

    if (workIds.length) get().bulkDeleteWorks(workIds)
    if (catIds.length) get().bulkDeleteCategories(catIds)
    if (groupIds.length) get().bulkDeleteWorkGroups(groupIds)
    if (mediaIds.length) get().bulkDeleteMedia(mediaIds)
  },

  updateSiteSection: (section, updates) => {
    set((state) => {
      const nextSite = {
        ...state.site,
        [section]: {
          ...state.site[section],
          ...updates,
        },
      }
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Updated site section: ${String(section).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          type: 'site_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, site: nextSite, activities: nextActivities }
      persistState(nextState)

      syncSiteSectionToFirestore(section, nextSite[section]).catch((e) =>
        console.warn('[Firestore] updateSiteSection error:', e)
      )

      return { site: nextSite, activities: nextActivities }
    })
  },

  updateStatsSection: (updates) => {
    set((state) => {
      const currentStats = normalizeStatsData(state.site.stats)
      const nextStats: StatsSectionData = {
        ...currentStats,
        ...updates,
        statement: {
          ...currentStats.statement,
          ...(updates.statement || {}),
        },
        updatedAt: new Date().toISOString(),
      }
      const nextSite = { ...state.site, stats: nextStats }
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: 'Updated editorial statistics & counters',
          timestamp: new Date().toISOString(),
          type: 'site_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, site: nextSite, activities: nextActivities }
      persistState(nextState)
      syncSiteSectionToFirestore('stats', nextStats).catch((e) =>
        console.warn('[Firestore] sync stats error:', e)
      )
      return { site: nextSite, activities: nextActivities }
    })
  },

  addStat: (statData) => {
    const id = `stat-${Date.now()}`
    const newStat: StatItem = { ...statData, id }
    set((state) => {
      const currentStats = normalizeStatsData(state.site.stats)
      const stats = [...currentStats.stats, newStat]
      const nextStats = { ...currentStats, stats, updatedAt: new Date().toISOString() }
      const nextSite = { ...state.site, stats: nextStats }
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: `Added statistic: ${statData.label}`,
          timestamp: new Date().toISOString(),
          type: 'site_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, site: nextSite, activities: nextActivities }
      persistState(nextState)
      syncSiteSectionToFirestore('stats', nextStats).catch((e) =>
        console.warn('[Firestore] addStat error:', e)
      )
      return { site: nextSite, activities: nextActivities }
    })
  },

  updateStat: (id, updates) => {
    set((state) => {
      const currentStats = normalizeStatsData(state.site.stats)
      const stats = currentStats.stats.map((s) => (s.id === id ? { ...s, ...updates } : s))
      const nextStats = { ...currentStats, stats, updatedAt: new Date().toISOString() }
      const nextSite = { ...state.site, stats: nextStats }
      const nextState = { ...state, site: nextSite }
      persistState(nextState)
      syncSiteSectionToFirestore('stats', nextStats).catch((e) =>
        console.warn('[Firestore] updateStat error:', e)
      )
      return { site: nextSite }
    })
  },

  deleteStat: (id) => {
    set((state) => {
      const currentStats = normalizeStatsData(state.site.stats)
      const stats = currentStats.stats.filter((s) => s.id !== id)
      const nextStats = { ...currentStats, stats, updatedAt: new Date().toISOString() }
      const nextSite = { ...state.site, stats: nextStats }
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: 'Deleted statistic from portfolio',
          timestamp: new Date().toISOString(),
          type: 'site_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, site: nextSite, activities: nextActivities }
      persistState(nextState)
      syncSiteSectionToFirestore('stats', nextStats).catch((e) =>
        console.warn('[Firestore] deleteStat error:', e)
      )
      return { site: nextSite, activities: nextActivities }
    })
  },

  reorderStats: (orderedIds) => {
    set((state) => {
      const currentStats = normalizeStatsData(state.site.stats)
      const map = new Map(currentStats.stats.map((s) => [s.id, s]))
      const stats: StatItem[] = []
      orderedIds.forEach((id, idx) => {
        const item = map.get(id)
        if (item) {
          stats.push({ ...item, order: idx + 1 })
          map.delete(id)
        }
      })
      map.forEach((item) => {
        stats.push({ ...item, order: stats.length + 1 })
      })
      const nextStats = { ...currentStats, stats, updatedAt: new Date().toISOString() }
      const nextSite = { ...state.site, stats: nextStats }
      const nextState = { ...state, site: nextSite }
      persistState(nextState)
      syncSiteSectionToFirestore('stats', nextStats).catch((e) =>
        console.warn('[Firestore] reorderStats error:', e)
      )
      return { site: nextSite }
    })
  },

  updateSettings: (updates) => {
    const now = new Date().toISOString()
    set((state) => {
      const nextSettings: AdminSiteSettings = {
        ...state.settings,
        ...updates,
        general: { ...state.settings.general, ...(updates.general || {}) },
        appearance: { ...state.settings.appearance, ...(updates.appearance || {}) },
        audio: { ...state.settings.audio, ...(updates.audio || {}) },
        portfolio: { ...state.settings.portfolio, ...(updates.portfolio || {}) },
        media: { ...state.settings.media, ...(updates.media || {}) },
        security: { ...state.settings.security, ...(updates.security || {}) },
        updatedAt: now,
      }
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description: 'Updated site preferences & settings',
          timestamp: now,
          type: 'site_updated',
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, settings: nextSettings, activities: nextActivities }
      persistState(nextState)

      syncSiteSectionToFirestore('settings' as any, nextSettings).catch((e) =>
        console.warn('[Firestore] updateSettings error:', e)
      )

      return { settings: nextSettings, activities: nextActivities }
    })
  },

  logActivity: (description, type) => {
    set((state) => {
      const nextActivities: ActivityItem[] = [
        {
          id: `act-${Date.now()}`,
          description,
          timestamp: new Date().toISOString(),
          type,
        },
        ...state.activities.slice(0, 30),
      ]
      const nextState = { ...state, activities: nextActivities }
      persistState(nextState)
      return { activities: nextActivities }
    })
  },

  getPublishedWorks: () => {
    return get()
      .works.filter((w) => w.status === 'published')
      .sort((a, b) => a.order - b.order)
  },

  getPublicSections: () => {
    const { categories, works, workGroups, media } = get()
    // Active categories sorted by order ASC
    const activeCategories = categories
      .filter((c) => c.status !== 'archived' && c.status !== 'hidden' && c.slug !== 'simulations' && c.slug !== 'random-stuvs')
      .sort((a, b) => a.order - b.order)

    const sections: WorkSection[] = activeCategories.map((cat, index) => {
      // Find category cover image from imageMediaId, coverMediaId, imageUrl, or cover
      const isIllustrationsCat =
        cat.id === 'ad' ||
        cat.slug === 'illustrations' ||
        cat.name?.toUpperCase() === 'ILLUSTRATIONS'
      const catCover = isIllustrationsCat
        ? '/images/works/Illustrations/Illustrations.webp'
        : resolveCategoryCover(cat, media) || undefined

      // Subcategories belonging to this category
      const catGroups = workGroups
        .filter((g) => g.categoryId === cat.id && g.status !== 'archived' && g.status !== 'hidden' && g.slug !== 'character-designs')
        .sort((a, b) => a.order - b.order)

      // Find all published works in this category, sorted by order ASC
      const catWorks = works
        .filter((w) => w.categoryId === cat.id && w.status === 'published')
        .sort((a, b) => a.order - b.order)

      const items: WorkListItem[] = catGroups.length > 0
        ? catGroups.map((g) => {
            const groupWorks = catWorks.filter((w) => w.workGroupId === g.id)
            const meta = g.discipline || (groupWorks[0]?.discipline || '')
            const tags = (groupWorks[0]?.tools && groupWorks[0]?.tools.length > 0) ? groupWorks[0].tools : (cat.tools || [])
            const rawGallery = groupWorks.flatMap((w) => w.gallery || [])
            const manifestImages = getCategoryImages(g.name || g.slug)
            const gallery = manifestImages.length > 0
              ? manifestImages.map((m) => ({ image: m.src, title: m.title }))
              : rawGallery
            return {
              id: g.id,
              name: g.name,
              slug: g.slug,
              meta,
              tags,
              categoryId: cat.id,
              workGroupId: g.id,
              gallery,
            }
          })
        : catWorks.map((w) => ({
            id: w.id,
            name: w.title,
            slug: w.slug,
            meta: w.discipline || w.projectType || w.year,
            tags: w.tools,
            link: w.externalUrl,
            categoryId: cat.id,
            workGroupId: w.workGroupId,
            gallery: w.gallery,
          }))

      return {
        id: cat.id,
        no: cat.no || String(index + 1).padStart(2, '0'),
        title: cat.name,
        tagline: cat.tagline || 'TBXP',
        cover: catCover,
        tools: cat.tools || [],
        awards: cat.awards || [],
        footer: cat.footer || '',
        items,
      }
    })

    return sections
  },

  resetToDefaults: () => {
    const defaults = {
      works: INITIAL_WORKS,
      categories: INITIAL_CATEGORIES,
      workGroups: INITIAL_WORK_GROUPS,
      media: INITIAL_MEDIA,
      site: INITIAL_SITE_CONTENT,
      settings: INITIAL_SETTINGS,
      activities: INITIAL_ACTIVITIES,
    }
    persistState(defaults)
    set(defaults)
  },

  collectFromFirebase: async () => {
    set({ isSyncing: true, syncStatusMessage: 'Collecting from Firebase...' })
    try {
      await collectDataFromFirebase()
    } finally {
      set({ isSyncing: false })
    }
  },

  pushToFirebase: async () => {
    await pushAllToFirestore()
  },
}))

if (typeof window !== 'undefined') {
  setTimeout(() => {
    try {
      initializeFirestoreSync()
    } catch (e) {
      console.warn('[Firestore] Sync initialization deferred notice:', e)
    }
  }, 0)
}
