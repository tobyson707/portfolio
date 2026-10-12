/**
 * BRAND IDENTITY MANIFEST — TOBI XP
 * Centralized configuration for Brand Identity image-based case studies.
 *
 * Configured projects:
 * 1. LOGOFOLIO (`/case-studies/logofolio webp/`) — 10 pages
 * 2. STONE (`/case-studies/stone webp/`) — 34 pages
 * 3. FUNKY FRAMES (`/case-studies/funky frames webp/`) — 25 pages
 */

export interface CaseStudyImage {
  src: string
  alt: string
  pageNumber: number
}

export interface BrandProject {
  id: 'logofolio' | 'stone' | 'funky-frames' | string
  title: string
  subtitle?: string
  description: string
  category?: string
  year?: string
  client?: string
  coverImage?: string
  folderPath: string
  images: CaseStudyImage[]
  pdfPath?: string // Backwards compatibility if needed
}

export type BrandCaseStudy = BrandProject

/**
 * Natural numerical order for STONE:
 * 1..4, 4b, 5, 5b, 6, 7, 7b, 8, 9, 10, 10b, 11, 12, 12b, 13, 13b, 14..28
 */
const STONE_FILENAMES: string[] = [
  '1.webp',
  '2.webp',
  '3.webp',
  '4.webp',
  '4b.webp',
  '5.webp',
  '5b.webp',
  '6.webp',
  '7.webp',
  '7b.webp',
  '8.webp',
  '9.webp',
  '10.webp',
  '10b.webp',
  '11.webp',
  '12.webp',
  '12b.webp',
  '13.webp',
  '13b.webp',
  '14.webp',
  '15.webp',
  '16.webp',
  '17.webp',
  '18.webp',
  '19.webp',
  '20.webp',
  '21.webp',
  '22.webp',
  '23.webp',
  '24.webp',
  '25.webp',
  '26.webp',
  '27.webp',
  '28.webp',
]

/**
 * LOGOFOLIO: 1..10
 */
const LOGOFOLIO_FILENAMES: string[] = Array.from({ length: 10 }, (_, i) => `${i + 1}.webp`)

/**
 * FUNKY FRAMES: 1..25
 */
const FUNKY_FRAMES_FILENAMES: string[] = Array.from({ length: 25 }, (_, i) => `${i + 1}.webp`)

export const BRAND_PROJECTS: BrandProject[] = [
  {
    id: 'logofolio',
    title: 'LOGOFOLIO',
    description: 'A collection of logo designs and visual explorations.',
    category: 'Logo Design & Exploration',
    year: '2024',
    folderPath: '/case-studies/logofolio webp/',
    images: LOGOFOLIO_FILENAMES.map((fileName, idx) => ({
      src: `/case-studies/logofolio webp/${fileName}`,
      alt: `LOGOFOLIO — Page ${idx + 1} of 10`,
      pageNumber: idx + 1,
    })),
    pdfPath: '/case-studies/logofolio.pdf',
  },
  {
    id: 'stone',
    title: 'STONE',
    description: 'A brand identity case study.',
    category: 'Brand Identity',
    year: '2024',
    folderPath: '/case-studies/stone webp/',
    images: STONE_FILENAMES.map((fileName, idx) => ({
      src: `/case-studies/stone webp/${fileName}`,
      alt: `STONE Brand Identity — Page ${idx + 1} of ${STONE_FILENAMES.length}`,
      pageNumber: idx + 1,
    })),
    pdfPath: '/case-studies/stone.pdf',
  },
  {
    id: 'funky-frames',
    title: 'FUNKY FRAMES',
    description: 'A brand identity case study.',
    category: 'Brand Identity',
    year: '2024',
    folderPath: '/case-studies/funky frames webp/',
    images: FUNKY_FRAMES_FILENAMES.map((fileName, idx) => ({
      src: `/case-studies/funky frames webp/${fileName}`,
      alt: `FUNKY FRAMES Brand Identity — Page ${idx + 1} of 25`,
      pageNumber: idx + 1,
    })),
    pdfPath: '/case-studies/funky-frames.pdf',
  },
]

export const SAMPLE_VERIFICATION_PDF = '/case-studies/logofolio.pdf'
