/**
 * BRAND IDENTITY MANIFEST — TOBI XP
 * Centralized configuration for Brand Identity PDF case studies.
 *
 * Configured projects:
 * 1. LOGOFOLIO (`/case-studies/logofolio.pdf`)
 * 2. STONE (`/case-studies/stone.pdf`)
 * 3. FUNKY FRAMES (`/case-studies/funky-frames.pdf`)
 */

export interface BrandProject {
  id: 'logofolio' | 'stone' | 'funky-frames' | string
  title: string
  subtitle?: string
  description: string
  pdfPath: string
  year?: string
  client?: string
  category?: string
  coverImage?: string
}

export const BRAND_PROJECTS: BrandProject[] = [
  {
    id: 'logofolio',
    title: 'LOGOFOLIO',
    description: 'A collection of logo designs and visual explorations.',
    pdfPath: '/case-studies/logofolio.pdf',
    category: 'Logo Design & Exploration',
    year: '2024',
  },
  {
    id: 'stone',
    title: 'STONE',
    description: 'A brand identity case study.',
    pdfPath: '/case-studies/stone.pdf',
    category: 'Brand Identity',
    year: '2024',
  },
  {
    id: 'funky-frames',
    title: 'FUNKY FRAMES',
    description: 'A brand identity case study.',
    pdfPath: '/case-studies/funky-frames.pdf',
    category: 'Brand Identity',
    year: '2024',
  },
]

/**
 * Fallback / Verification document (sample PDF created in public/case-studies/)
 */
export const SAMPLE_VERIFICATION_PDF = '/case-studies/logofolio.pdf'
