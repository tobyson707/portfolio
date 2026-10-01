import { useStore } from '../store'
import { trackThemeToggle } from '../services/analytics'

let isTransitioning = false

export function isThemeTransitionActive(): boolean {
  return isTransitioning
}

/**
 * Executes a radial theme transition originating from the clicked element's viewport coordinates.
 * Expands a circular reveal covering the entire viewport.
 */
export async function executeRadialThemeToggle(
  targetOrEvent?: HTMLElement | React.MouseEvent<HTMLElement> | null
): Promise<void> {
  if (isTransitioning) return

  const store = useStore.getState()
  const currentTheme = store.theme
  const nextTheme = currentTheme === 'light' ? 'dark' : 'light'

  trackThemeToggle({ from: currentTheme, to: nextTheme })

  // Respect user preference for reduced motion
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    store.toggleTheme()
    return
  }

  // Determine origin coordinates from the theme toggle element
  let originX = window.innerWidth / 2
  let originY = window.innerHeight / 2

  let element: HTMLElement | null = null
  if (targetOrEvent) {
    if ('currentTarget' in targetOrEvent && targetOrEvent.currentTarget) {
      element = targetOrEvent.currentTarget as HTMLElement
    } else if (targetOrEvent instanceof HTMLElement) {
      element = targetOrEvent
    }
  }

  // If no element passed, try finding the active theme button in DOM
  if (!element && typeof document !== 'undefined') {
    element =
      document.querySelector<HTMLElement>('.theme-toggle-btn') ||
      document.querySelector<HTMLElement>('.admin-topbar-btn[aria-label="Toggle color theme"]')
  }

  if (element && typeof element.getBoundingClientRect === 'function') {
    const rect = element.getBoundingClientRect()
    originX = rect.left + rect.width / 2
    originY = rect.top + rect.height / 2
  }

  // Calculate distance from origin to furthest viewport corner
  const maxDistX = Math.max(originX, window.innerWidth - originX)
  const maxDistY = Math.max(originY, window.innerHeight - originY)
  const finalRadius = Math.ceil(Math.hypot(maxDistX, maxDistY))

  isTransitioning = true

  // 1. Native View Transitions API (Chrome, Edge, Safari 18+, Opera)
  const doc = document as any
  if (typeof doc.startViewTransition === 'function') {
    try {
      const transition = doc.startViewTransition(() => {
        store.toggleTheme()
      })

      await transition.ready

      const animation = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${originX}px ${originY}px)`,
            `circle(${finalRadius}px at ${originX}px ${originY}px)`,
          ],
        },
        {
          duration: 550,
          easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      )

      await animation.finished
    } catch {
      // If View Transition fails, ensure theme is updated
      store.toggleTheme()
    } finally {
      isTransitioning = false
    }
    return
  }

  // 2. Custom Radial Overlay Fallback for other browsers
  try {
    const overlay = document.createElement('div')
    overlay.className = 'tobi-radial-theme-overlay'
    overlay.style.position = 'fixed'
    overlay.style.inset = '0'
    overlay.style.zIndex = '9999999'
    overlay.style.pointerEvents = 'auto'
    overlay.style.backgroundColor = nextTheme === 'dark' ? '#0D0D0F' : '#FFFFFF'
    overlay.style.clipPath = `circle(0px at ${originX}px ${originY}px)`
    overlay.style.willChange = 'clip-path'

    document.body.appendChild(overlay)

    const animation = overlay.animate(
      [
        { clipPath: `circle(0px at ${originX}px ${originY}px)` },
        { clipPath: `circle(${finalRadius}px at ${originX}px ${originY}px)` },
      ],
      {
        duration: 550,
        easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
        fill: 'forwards',
      }
    )

    await animation.finished
    store.toggleTheme()
    overlay.remove()
  } catch {
    store.toggleTheme()
  } finally {
    isTransitioning = false
  }
}
