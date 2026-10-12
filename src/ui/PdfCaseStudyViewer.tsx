/**
 * COMPATIBILITY EXPORT: PdfCaseStudyViewer
 * Re-exports the image-based CaseStudyViewer component to avoid any broken references.
 */
import CaseStudyViewer from './CaseStudyViewer'
import type { BrandCaseStudy } from '../data/brandIdentityManifest'

export interface PdfCaseStudyViewerProps {
  caseStudy: BrandCaseStudy
  isOpen: boolean
  onClose: () => void
}

export default function PdfCaseStudyViewer({
  caseStudy,
  isOpen,
  onClose,
}: PdfCaseStudyViewerProps) {
  return <CaseStudyViewer project={caseStudy} isOpen={isOpen} onClose={onClose} />
}
