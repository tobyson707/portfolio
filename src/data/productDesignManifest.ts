export interface ProductDesignMediaItem {
  id: string
  type: 'video' | 'image'
  src: string
  poster?: string
}

// Backwards compatibility alias
export type ProductScreenItem = ProductDesignMediaItem

export interface ProductDesignProject {
  id: string
  title: string
  subtitle?: string
  year: string
  description: string
  client: string
  role: string
  thumbnail: string
  websiteUrl?: string
  media: ProductDesignMediaItem[]
  images?: ProductDesignMediaItem[]
}

export const PRODUCT_CATALOGUE_PROJECTS: ProductDesignProject[] = [
  {
    id: 'tobi-xp',
    title: 'TOBI XP',
    subtitle: 'Cinematic WebGL Personal Experience & Spatial Design',
    year: '2026',
    client: 'Personal Project',
    role: 'Creative Developer & UI/UX Designer',
    description:
      'A cinematic WebGL personal portfolio experience featuring custom real-time Three.js 3D character interactions, GLSL shaders, directional spatial audio, fluid horizontal scroll exhibition storytelling, and pure typography hierarchy.',
    thumbnail: '/products/TOBI XP Portfolio Website/tb 1.webp',
    websiteUrl: 'https://tobixp.com/',
    media: [
      {
        id: 'tobixp-v1',
        type: 'video',
        src: '/products/TOBI XP Portfolio Website/TOBI_XP_web.mp4',
        poster: '/products/TOBI XP Portfolio Website/tb 1.webp',
      },
      {
        id: 'tobixp-i1',
        type: 'image',
        src: '/products/TOBI XP Portfolio Website/tb 1.webp',
      },
      {
        id: 'tobixp-i2',
        type: 'image',
        src: '/products/TOBI XP Portfolio Website/tb 2.webp',
      },
      {
        id: 'tobixp-i3',
        type: 'image',
        src: '/products/TOBI XP Portfolio Website/tb 3.webp',
      },
      {
        id: 'tobixp-i4',
        type: 'image',
        src: '/products/TOBI XP Portfolio Website/tb 4.webp',
      },
      {
        id: 'tobixp-i5',
        type: 'image',
        src: '/products/TOBI XP Portfolio Website/tb 5.webp',
      },
      {
        id: 'tobixp-i6',
        type: 'image',
        src: '/products/TOBI XP Portfolio Website/tb 6.webp',
      },
      {
        id: 'tobixp-i7',
        type: 'image',
        src: '/products/TOBI XP Portfolio Website/tb 7.webp',
      },
    ],
  },
  {
    id: 'miva-testlab',
    title: 'MIVA TestLab',
    year: '2026',
    client: 'MIVA',
    role: 'Lead Product Designer & Design Engineer',
    description:
      'A test environment for simulations, where usability testing of simulations takes place with student testers before the simulations are officially launched.',
    thumbnail: '/products/MIVA TestLab/tl 1.webp',
    media: [
      {
        id: 'miva-v1',
        type: 'video',
        src: '/products/MIVA TestLab/test_lab_web.mp4',
        poster: '/products/MIVA TestLab/tl 1.webp',
      },
      {
        id: 'miva-i1',
        type: 'image',
        src: '/products/MIVA TestLab/tl 1.webp',
      },
      {
        id: 'miva-i2',
        type: 'image',
        src: '/products/MIVA TestLab/tl 2.webp',
      },
      {
        id: 'miva-i3',
        type: 'image',
        src: '/products/MIVA TestLab/tl 3.webp',
      },
      {
        id: 'miva-i4',
        type: 'image',
        src: '/products/MIVA TestLab/tl 4.webp',
      },
      {
        id: 'miva-i5',
        type: 'image',
        src: '/products/MIVA TestLab/tl 5.webp',
      },
      {
        id: 'miva-i6',
        type: 'image',
        src: '/products/MIVA TestLab/tl 6.webp',
      },
    ],
  },
  {
    id: 'crimson-casefile',
    title: 'The Crimson Casefile',
    year: '2026',
    client: 'MIVA',
    role: 'Lead Design Engineer',
    description: 'An interactive learning simulation about a crime investigation.',
    thumbnail: '/products/The Crimson Casefile/cc 1.webp',
    media: [
      {
        id: 'crimson-v1',
        type: 'video',
        src: '/products/The Crimson Casefile/Crimson_compressed.mp4',
        poster: '/products/The Crimson Casefile/cc 1.webp',
      },
      {
        id: 'crimson-i1',
        type: 'image',
        src: '/products/The Crimson Casefile/cc 1.webp',
      },
      {
        id: 'crimson-i2',
        type: 'image',
        src: '/products/The Crimson Casefile/cc2.webp',
      },
      {
        id: 'crimson-i3',
        type: 'image',
        src: '/products/The Crimson Casefile/cc3.webp',
      },
      {
        id: 'crimson-i4',
        type: 'image',
        src: '/products/The Crimson Casefile/cc4.webp',
      },
    ],
  },
  {
    id: 'horizon-command',
    title: 'THE HORIZON COMMAND',
    year: '2026',
    client: 'MIVA',
    role: 'LEAD DESIGN ENGINEER',
    description:
      'An interactive learning simulation about a disease outbreak and displacement.',
    thumbnail: '/products/The Horizon Command/h 1.webp',
    media: [
      {
        id: 'horizon-v1',
        type: 'video',
        src: '/products/The Horizon Command/Horizon_web.mp4',
        poster: '/products/The Horizon Command/h 1.webp',
      },
      {
        id: 'horizon-i1',
        type: 'image',
        src: '/products/The Horizon Command/h 1.webp',
      },
      {
        id: 'horizon-i2',
        type: 'image',
        src: '/products/The Horizon Command/h 2.webp',
      },
      {
        id: 'horizon-i3',
        type: 'image',
        src: '/products/The Horizon Command/h 3.webp',
      },
      {
        id: 'horizon-i4',
        type: 'image',
        src: '/products/The Horizon Command/h 4.webp',
      },
      {
        id: 'horizon-i5',
        type: 'image',
        src: '/products/The Horizon Command/h 5.webp',
      },
    ],
  },
]
