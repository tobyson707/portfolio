import { create } from 'zustand'
import { WORKS, type WorkSection } from '../data/works'

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
  order: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  discipline?: string
  description?: string
  order: number
  status: 'published' | 'hidden' | 'archived'
  cover?: string
  tools?: string[]
}

export interface WorkGroupItem {
  id: string
  name: string
  slug: string
  categoryId: string
  discipline?: string
  description?: string
  order: number
  status: 'published' | 'hidden' | 'archived'
}

export interface MediaItem {
  id: string
  name: string
  title?: string
  url: string
  storagePath?: string
  thumbnailUrl?: string
  type: 'image' | 'video' | 'audio' | 'document' | 'other'
  format?: string
  size: number
  dimensions?: { width: number; height: number }
  categoryId?: string
  workGroupId?: string
  workId?: string
  caption?: string
  altText?: string
  tags?: string[]
  visibility?: 'published' | 'hidden' | 'archived'
  createdAt: string
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
    narrative?: string
    personalityNote?: string
    ctaLabel?: string
    skills: string[]
    paragraphs?: string[]
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

  if (Array.isArray(raw)) {
    return {
      stats:
        raw.length > 0
          ? raw.map((item: any, idx: number) => ({
              id: item.id || `stat-${idx + 1}`,
              label: item.label || 'STATISTIC',
              value: typeof item.value === 'number' ? item.value : parseFloat(item.value) || 0,
              prefix: item.prefix || '',
              suffix: item.suffix || '',
              description: item.description || '',
              order: typeof item.order === 'number' ? item.order : idx + 1,
              visible: item.visible !== false,
            }))
          : defaultStats,
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

export const INITIAL_SITE_CONTENT: SiteContentData = {
  hero: {
    title: 'TOBI XP',
    role: 'ILLUSTRATOR & DESIGNER',
    disciplines: 'DESIGN · ART · PLAY',
    statusLine: 'I USUALLY JUST COOK',
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
    narrative: 'I’m Tobi XP, an illustrator and designer who enjoys turning ideas into things people can see, use, and interact with ;)',
    personalityNote: 'Still learning, still experimenting, and always making something.',
    ctaLabel: 'EXPLORE WORKS',
    paragraphs: [
      'I’m Tobi XP, an illustrator and designer who enjoys turning ideas into things people can see, use, and interact with ;)',
      'From illustration and character design to product design and interactive experiences, I like exploring ideas, figuring things out, and seeing where they lead.',
      'Still learning, still experimenting, and always making something.',
    ],
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

interface ContentStoreState {
  site: SiteContentData
  works: Work[]
  categories: Category[]
  workGroups: WorkGroupItem[]
  media: MediaItem[]
  getPublicSections: () => WorkSection[]
  getPublishedWorks: () => Work[]
}

export const useContentStore = create<ContentStoreState>((_set, _get) => ({
  site: INITIAL_SITE_CONTENT,
  works: [],
  categories: [],
  workGroups: [],
  media: [],
  getPublicSections: () => {
    return WORKS.en.sections
  },
  getPublishedWorks: () => [],
}))
