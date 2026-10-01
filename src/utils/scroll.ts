/**
 * Scrolls smoothly to the Contact panel inside the horizontal Works experience.
 * It uses the actual Contact panel and Works gallery DOM references to compute
 * the exact vertical scroll position required.
 */
export function scrollToContact() {
  const contactEl = document.getElementById('contact')
  const galleryEl = document.querySelector('.wk-gallery') as HTMLElement | null
  if (!contactEl || !galleryEl) {
    const worksEl = document.getElementById('works')
    if (worksEl) {
      worksEl.scrollIntoView({ behavior: 'smooth' })
    }
    return
  }

  const galleryRect = galleryEl.getBoundingClientRect()
  const galleryTop = window.scrollY + galleryRect.top
  // In the horizontal pinned scroll setup, the track translates linearly with vertical scroll.
  // contactEl.offsetLeft is the exact distance inside the track to the contact panel.
  const targetScrollY = galleryTop + contactEl.offsetLeft
  window.scrollTo({ top: targetScrollY, behavior: 'smooth' })
}
