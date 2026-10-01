import siteContent from './site.json'

export interface SocialLink {
  id: string
  label: string
  href: string
}

export interface ResumeEntry {
  id: string
  period: string
  place: string
  role?: string
  points?: string[]
  links?: SocialLink[]
  order: number
  visible: boolean
}

export interface ResumeSectionData {
  title: string
  entries: ResumeEntry[]
}

interface SiteContent {
  hero: {
    title: string
    role: string
    portfolioMeta: string
    disciplines: string
    statusLine: string
    paragraphs: string[]
  }
  resume: ResumeSectionData
  contact: {
    number: string
    title: string
    tagline: string
    nameLabel: string
    emailLabel: string
    messageLabel: string
    sendLabel: string
    recipientEmail: string
  }
}

export const SITE_CONTENT = siteContent as unknown as SiteContent

