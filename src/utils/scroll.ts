/**
 * Smoothly scrolls to the WORKS section, positioning the horizontal gallery
 * so that the artwork cards are vertically centered in the viewport with the
 * WORKS heading naturally visible above them.
 */
export function scrollToWorks(forcedBehavior?: ScrollBehavior) {
  if (typeof window === 'undefined') return

  const worksEl = document.getElementById('works')
  const galleryEl = document.querySelector('.wk-gallery') as HTMLElement | null
  const targetEl = worksEl || galleryEl

  if (!targetEl) return

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  const behavior: ScrollBehavior = prefersReducedMotion ? 'instant' : (forcedBehavior || 'smooth')

  const rect = targetEl.getBoundingClientRect()
  const targetScrollY = Math.max(0, window.scrollY + rect.top)

  window.scrollTo({ top: targetScrollY, behavior })
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
