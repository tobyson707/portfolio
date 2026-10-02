import { useState, useEffect, useRef, useMemo } from 'react'

interface TypingNarrativeProps {
  paragraphs: string[]
}

const SESSION_TYPED_KEY = 'tobi-xp-about-typed-v1'

export default function TypingNarrative({ paragraphs }: TypingNarrativeProps) {
  // Check if already typed in this browser session or prefers reduced motion
  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window === 'undefined') return true
    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    if (prefersReducedMotion) return true
    try {
      return sessionStorage.getItem(SESSION_TYPED_KEY) === 'true'
    } catch {
      return false
    }
  })

  // Has typing started yet (triggered by intersection observer or immediate display)
  const [hasStarted, setHasStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Current typing progress: current paragraph index & character index
  const [activeParaIndex, setActiveParaIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isCursorVisible, setIsCursorVisible] = useState(true)
  const [cursorFading, setCursorFading] = useState(false)

  // IntersectionObserver to start typing on first reveal
  useEffect(() => {
    if (isCompleted || hasStarted) return

    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [isCompleted, hasStarted])

  // Typing character loop with natural typing cadence
  useEffect(() => {
    if (isCompleted || !hasStarted) return
    if (!paragraphs || paragraphs.length === 0) {
      setIsCompleted(true)
      return
    }

    const currentParagraph = paragraphs[activeParaIndex] || ''

    if (charIndex < currentParagraph.length) {
      const nextChar = currentParagraph[charIndex]
      let delay = 18 + Math.floor(Math.random() * 10)

      // Natural subtle cadence pauses for punctuation
      if (['.', ',', ';', '!', '?', ')'].includes(nextChar)) {
        delay += 120
      }

      const timer = setTimeout(() => {
        setCharIndex((prev) => prev + 1)
      }, delay)

      return () => clearTimeout(timer)
    } else if (activeParaIndex < paragraphs.length - 1) {
      // Paragraph complete: brief pause before starting next paragraph
      const timer = setTimeout(() => {
        setActiveParaIndex((prev) => prev + 1)
        setCharIndex(0)
      }, 200)

      return () => clearTimeout(timer)
    } else {
      // All paragraphs complete: fade out cursor and mark session done
      const fadeTimer = setTimeout(() => {
        setCursorFading(true)
      }, 350)

      const removeCursorTimer = setTimeout(() => {
        setIsCursorVisible(false)
        setIsCompleted(true)
        try {
          sessionStorage.setItem(SESSION_TYPED_KEY, 'true')
        } catch {
          // ignore storage error
        }
      }, 850)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(removeCursorTimer)
      }
    }
  }, [hasStarted, isCompleted, activeParaIndex, charIndex, paragraphs])

  const fullAccessibleText = useMemo(() => paragraphs.join(' '), [paragraphs])

  // If completed or reduced motion, render clean standard text
  if (isCompleted) {
    return (
      <div className="about-narrative">
        {paragraphs.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="about-narrative">
      {/* Screen reader static full text */}
      <div className="sr-only" aria-live="off">
        {fullAccessibleText}
      </div>

      {/* Visual typing display */}
      <div aria-hidden="true">
        {paragraphs.map((p, pIdx) => {
          if (pIdx > activeParaIndex) return null

          const isCurrent = pIdx === activeParaIndex
          const textToDisplay = isCurrent ? p.slice(0, charIndex) : p

          return (
            <p key={pIdx} className="about-typing-para">
              {textToDisplay}
              {isCurrent && isCursorVisible && (
                <span
                  className={`about-typing-cursor ${cursorFading ? 'is-fading' : ''}`}
                />
              )}
            </p>
          )
        })}
      </div>
    </div>
  )
}
