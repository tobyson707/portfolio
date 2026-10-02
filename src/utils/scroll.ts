/**
 * Smoothly scrolls to the WORKS section, positioning the horizontal gallery
 * so that the artwork cards are vertically centered in the viewport with the
 * WORKS heading naturally visible above them.
 */
export function scrollToWorks() {
  if (typeof window === 'undefined') return

  const galleryEl = document.querySelector('.wk-gallery') as HTMLElement | null
  const worksEl = document.getElementById('works')

  if (!galleryEl && !worksEl) return

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  const behavior: ScrollBehavior = prefersReducedMotion ? 'instant' : 'smooth'

  if (galleryEl) {
    const galleryRect = galleryEl.getBoundingClientRect()
    const galleryTop = window.scrollY + galleryRect.top
    const firstCardEl = galleryEl.querySelector('.wk-card') as HTMLElement | null

    // Responsive horizontal margin matching the header alignment
    const isMobile = window.innerWidth <= 640
    const leftMargin = isMobile ? 20 : Math.min(80, Math.max(24, window.innerWidth * 0.06))

    // Position the gallery so the first card is at its initial viewing position
    let targetScrollY = galleryTop
    if (firstCardEl && firstCardEl.offsetLeft > 0) {
      targetScrollY = galleryTop + Math.max(0, firstCardEl.offsetLeft - leftMargin)
    }

    window.scrollTo({ top: targetScrollY, behavior })
  } else if (worksEl) {
    const worksRect = worksEl.getBoundingClientRect()
    const targetScrollY = window.scrollY + worksRect.top
    window.scrollTo({ top: targetScrollY, behavior })
  }
}

/**
 * Scrolls smoothly to the Contact panel inside the horizontal Works experience.
 * It uses the actual Contact panel and Works gallery DOM references to compute
 * the exact vertical scroll position required.
 */
export function scrollToContact() {
  if (typeof window === 'undefined') return

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  const behavior: ScrollBehavior = prefersReducedMotion ? 'instant' : 'smooth'

  const contactEl = document.getElementById('contact')
  const galleryEl = document.querySelector('.wk-gallery') as HTMLElement | null
  if (!contactEl || !galleryEl) {
    const worksEl = document.getElementById('works')
    if (worksEl) {
      worksEl.scrollIntoView({ behavior })
    }
    return
  }

  const galleryRect = galleryEl.getBoundingClientRect()
  const galleryTop = window.scrollY + galleryRect.top
  // In the horizontal pinned scroll setup, the track translates linearly with vertical scroll.
  // contactEl.offsetLeft is the exact distance inside the track to the contact panel.
  const targetScrollY = galleryTop + contactEl.offsetLeft
  window.scrollTo({ top: targetScrollY, behavior })
}
