/**
 * Smoothly scrolls to the WORKS section, positioning the main horizontal Works card
 * approximately halfway down the screen (vertically centered in the viewport),
 * while keeping the WORKS heading clearly visible above the card and accounting
 * for the fixed navigation bar across desktop, tablet, and mobile viewports.
 */
export function scrollToWorks(forcedBehavior?: ScrollBehavior) {
  if (typeof window === 'undefined') return

  const worksEl = document.getElementById('works')
  if (!worksEl) {
    requestAnimationFrame(() => scrollToWorks(forcedBehavior))
    return
  }

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  const behavior: ScrollBehavior = prefersReducedMotion ? 'instant' : (forcedBehavior || 'smooth')

  const viewportHeight = window.innerHeight
  const isMobile = window.innerWidth <= 640

  // Fixed top navigation bar height & safe area
  const navTrigger = document.querySelector('.nav-trigger-wrapper')
  const navRect = navTrigger?.getBoundingClientRect()
  const navHeight = navRect ? Math.max(navRect.bottom, 60) : (isMobile ? 56 : 72)

  // Target card elements inside Works
  const cardEl = (worksEl.querySelector('.wk-card') || worksEl) as HTMLElement
  const cardHeader = cardEl.querySelector('.wk-card-header') as HTMLElement | null
  const headingEl = worksEl.querySelector('.wk-gallery-title') as HTMLElement | null

  // Document-relative top of the works section
  const worksRect = worksEl.getBoundingClientRect()
  const worksDocTop = window.scrollY + worksRect.top

  // Calculate the focal height of the main horizontal Works card
  // On desktop/tablet, cardHeader contains cover image, title and category metadata.
  // We use the card header plus a portion of the card body to represent the primary visual card unit.
  let cardFocalHeight: number
  if (cardHeader && cardHeader.offsetHeight > 0) {
    cardFocalHeight = cardHeader.offsetHeight
    const cardBody = cardEl.querySelector('.wk-card-body') as HTMLElement | null
    if (cardBody && cardBody.offsetHeight > 0) {
      const extra = isMobile ? Math.min(cardBody.offsetHeight, 60) : Math.min(cardBody.offsetHeight, 120)
      cardFocalHeight += extra
    }
  } else {
    cardFocalHeight = isMobile ? Math.min(viewportHeight * 0.5, 300) : Math.min(viewportHeight * 0.55, 420)
  }

  // The card's starting offset relative to the works section
  let cardOffsetInWorks = 0
  if (cardHeader) {
    const cardHeaderRect = cardHeader.getBoundingClientRect()
    cardOffsetInWorks = cardHeaderRect.top - worksRect.top
  } else if (cardEl && cardEl !== worksEl) {
    const cardElRect = cardEl.getBoundingClientRect()
    cardOffsetInWorks = cardElRect.top - worksRect.top
  }

  if (cardOffsetInWorks <= 0 || cardOffsetInWorks > viewportHeight) {
    cardOffsetInWorks = isMobile ? Math.max(36, viewportHeight * 0.07) : Math.max(80, viewportHeight * 0.14)
  }

  // The document-relative center of the main horizontal card
  const cardCenterDocY = worksDocTop + cardOffsetInWorks + cardFocalHeight / 2

  // The desired vertical center in the viewport:
  // Positioned halfway down the screen (vertically centered in the viewport),
  // accounting for the fixed navigation header and ensuring the Works heading remains visible above.
  const effectiveViewportHeight = viewportHeight - navHeight
  let desiredCenterInViewport = navHeight + effectiveViewportHeight / 2

  // Ensure heading has sufficient clearance below the navigation bar
  const headingHeight = headingEl?.offsetHeight || (isMobile ? 24 : 36)
  const minTopMarginForHeading = navHeight + (isMobile ? 12 : 20)
  const estimatedCardTopInViewport = desiredCenterInViewport - cardFocalHeight / 2
  const minCardTop = minTopMarginForHeading + headingHeight + (isMobile ? 12 : 20)

  if (estimatedCardTopInViewport < minCardTop) {
    desiredCenterInViewport = minCardTop + cardFocalHeight / 2
  }

  // Calculate target scroll Y
  let targetScrollY = cardCenterDocY - desiredCenterInViewport

  // Clamp to document scroll boundaries
  const maxScrollY = Math.max(0, document.documentElement.scrollHeight - viewportHeight)
  targetScrollY = Math.max(0, Math.min(targetScrollY, maxScrollY))

  window.scrollTo({
    top: Math.round(targetScrollY),
    behavior,
  })
}

/**
 * Scrolls smoothly to the Contact panel inside the horizontal Works experience.
 * It uses the actual Contact panel and Works gallery DOM references to compute
 * the exact vertical scroll position required.
 */
export function scrollToContact(forcedBehavior?: ScrollBehavior) {
  if (typeof window === 'undefined') return

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  const behavior: ScrollBehavior = prefersReducedMotion ? 'instant' : (forcedBehavior || 'smooth')

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
