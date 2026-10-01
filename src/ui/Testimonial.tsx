import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface TestimonialItem {
  quote: string
  clientName: string
  role: string
  company: string
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    quote: "Tobi understood what I was trying to achieve and turned the idea into something much better than I imagined.",
    clientName: "Marcus Vance",
    role: "Creative Director",
    company: "Studio Mono",
  },
  {
    quote: "Working with Tobi felt less like a client project and more like an art collaboration that actually delivered results.",
    clientName: "Elena Rostova",
    role: "Design Lead",
    company: "Voxel Labs",
  },
]

export default function Testimonial() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const item = TESTIMONIALS[currentIndex]

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
  }

  return (
    <div className="wk-card wk-testimonial-card" id="testimonial">
      <div className="wk-card-head">
        <span className="wk-card-no">05</span>
        <h3 className="wk-card-title">WHAT PEOPLE SAY</h3>
        <span className="wk-card-tagline">Reflections & Collaborative Notes</span>
      </div>

      <div className="testimonial-editorial-body">
        <div className="testimonial-content-wrap">
          <span className="testimonial-eyebrow">WHAT PEOPLE SAY</span>

          <AnimatePresence mode="wait">
            <motion.blockquote
              key={currentIndex}
              className="testimonial-quote"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              “{item.quote}”
            </motion.blockquote>
          </AnimatePresence>

          <motion.div
            className="testimonial-client-meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <span className="testimonial-dash">—</span>
            <div className="testimonial-author-info">
              <strong className="testimonial-name">{item.clientName}</strong>
              <span className="testimonial-role-company">
                {item.role} <span className="testimonial-sep">·</span> {item.company}
              </span>
            </div>
          </motion.div>

          {TESTIMONIALS.length > 1 && (
            <button
              type="button"
              className="testimonial-next-btn"
              onClick={handleNext}
              aria-label="Next testimonial"
            >
              <span>NEXT NOTE</span>
              <span className="testimonial-arrow">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
