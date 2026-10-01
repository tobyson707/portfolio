import { useState, useRef, useEffect, type FormEvent, type MouseEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Mail, ExternalLink, ArrowUpRight } from 'lucide-react'
import type { SITE_CONTENT } from '../data/siteContent'
import { InstagramIcon } from './SocialIcons'
import { useContentStore } from '../services/contentStore'
import { trackContactInteraction, trackSocialClick } from '../services/analytics'

type ContactContent = typeof SITE_CONTENT.contact

export default function Contact({ content }: { content: ContactContent }) {
  const [status, setStatus] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const social = useContentStore((s) => s.site.social)
  const contactEmail = (
    import.meta.env.VITE_CONTACT_EMAIL ||
    content.recipientEmail ||
    social?.email ||
    'businesstobixp@gmail.com'
  ).trim()

  const instagramUrl = social?.instagram || 'https://instagram.com/tobi.xp/'
  const rawHandle = instagramUrl.includes('instagram.com')
    ? (instagramUrl.replace(/\/+$/, '').split('/').pop() || 'tobi.xp')
    : instagramUrl.replace(/^@/, '')
  const instagramHandle = `@${rawHandle}`

  const shouldReduceMotion = useReducedMotion()
  const logoRef = useRef<HTMLDivElement>(null)
  const [logoTransform, setLogoTransform] = useState({ x: 0, y: 0, scale: 1, rotate: 0 })

  useEffect(() => {
    trackContactInteraction('view')
  }, [])

  function handleLogoMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (shouldReduceMotion || window.innerWidth < 768) return
    const el = logoRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const moveX = (x / (rect.width / 2)) * 10
    const moveY = (y / (rect.height / 2)) * 10
    const rotateZ = (x / (rect.width / 2)) * 1.5

    setLogoTransform({
      x: moveX,
      y: moveY,
      scale: 1.03,
      rotate: rotateZ,
    })
  }

  function handleLogoMouseLeave() {
    setLogoTransform({ x: 0, y: 0, scale: 1, rotate: 0 })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    trackContactInteraction('form_submit')

    if (!contactEmail) {
      setStatus('The contact inbox has not been configured yet.')
      return
    }

    const name = formData.name.trim()
    const email = formData.email.trim()
    const message = formData.message.trim()

    if (!name || !email || !message) {
      setStatus('Please fill in all fields before sending.')
      return
    }

    const subject = encodeURIComponent(`Portfolio message from ${name}`)
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
    setStatus('Your email app should open with your message ready to send.')
  }

  return (
    <section className="wk-contact-panel" id="contact" aria-label="Contact">
      {/* Huge Editorial Background Text: LET'S TALK */}
      <div className="wk-contact-bg-talk" aria-hidden="true">
        <span>LET&apos;S TALK</span>
      </div>

      {/* Continuously Scrolling Marquee Layer: LET'S COOK SOMETHING */}
      <div className="wk-contact-marquee" aria-hidden="true">
        <div className="wk-contact-marquee-track">
          {Array.from({ length: 4 }).map((_, idx) => (
            <span key={idx} className="wk-contact-marquee-text">
              LET&apos;S COOK SOMETHING &middot; LET&apos;S COOK SOMETHING &middot;&nbsp;
            </span>
          ))}
        </div>
      </div>

      <div className="wk-contact-inner">
        {/* Left Column: Large XP Logo with subtle interactive hover reaction */}
        <div className="wk-contact-left">
          <div
            ref={logoRef}
            className="wk-contact-logo-wrap"
            onMouseMove={handleLogoMouseMove}
            onMouseLeave={handleLogoMouseLeave}
          >
            <motion.div
              className="wk-contact-logo-inner"
              animate={{
                x: logoTransform.x,
                y: logoTransform.y,
                scale: logoTransform.scale,
                rotate: logoTransform.rotate,
              }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <img
                src="/images/xp.png"
                alt="TOBI XP Logo"
                className="wk-contact-xp-img"
              />
            </motion.div>
          </div>
        </div>

        {/* Right Column: Minimal Editorial Contact Form */}
        <div className="wk-contact-right">
          <div className="wk-contact-form-container">
            <form
              className="wk-editorial-form"
              onSubmit={handleSubmit}
              onFocus={() => trackContactInteraction('form_start')}
            >
              <div className="wk-form-row-dual">
                <div className="wk-form-field">
                  <label htmlFor="contact-name" className="wk-form-label">NAME</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    spellCheck={false}
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="What should I call you?"
                    required
                    className="wk-form-input"
                  />
                </div>
                <div className="wk-form-field">
                  <label htmlFor="contact-email" className="wk-form-label">EMAIL</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Where can I reach you?"
                    required
                    className="wk-form-input"
                  />
                </div>
              </div>

              <div className="wk-form-field wk-form-field-message">
                <label htmlFor="contact-message" className="wk-form-label">MESSAGE</label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={3}
                  autoComplete="off"
                  spellCheck={false}
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="So... what are we cooking?"
                  required
                  className="wk-form-textarea"
                />
              </div>

              <div className="wk-form-actions-row">
                <button className="wk-editorial-submit-btn" type="submit">
                  <span>SEND MESSAGE</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
                {status && (
                  <p className="wk-form-status-msg" aria-live="polite">
                    {status}
                  </p>
                )}
              </div>
            </form>

            {/* Understated direct contact links */}
            <div className="wk-contact-direct-links">
              <a
                href={`mailto:${contactEmail}`}
                className="wk-direct-link"
                onClick={() => trackContactInteraction('email_click')}
              >
                <Mail size={14} aria-hidden="true" />
                <span>{contactEmail}</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
              <span className="wk-direct-sep" aria-hidden="true">&middot;</span>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="wk-direct-link"
                onClick={() => {
                  trackContactInteraction('social_click')
                  trackSocialClick('instagram')
                }}
              >
                <InstagramIcon className="wk-direct-social-icon" />
                <span>{instagramHandle}</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
