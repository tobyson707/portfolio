import { useState, useRef, useEffect, type FormEvent, type MouseEvent } from 'react'
import { Mail, Copy, Check } from 'lucide-react'
import type { SITE_CONTENT } from '../data/siteContent'
import { InstagramIcon } from './SocialIcons'
import { useContentStore } from '../services/contentStore'
import { trackContactInteraction, trackSocialClick } from '../services/analytics'

type ContactContent = typeof SITE_CONTENT.contact

export default function Contact({ content: _content }: { content?: ContactContent }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [formStatus, setFormStatus] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Interactive 3D Parallax & Bounce for XP graphic
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, tx: 0, ty: 0, scale: 1 })
  const [isPressed, setIsPressed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      setReducedMotion(mq.matches)
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [])

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !logoRef.current) return
    const rect = logoRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5 // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5 // -0.5 to 0.5
    setTilt({
      rx: -y * 12, // subtle tilt X (max ±6deg)
      ry: x * 14,  // subtle tilt Y (max ±7deg)
      tx: x * 8,   // subtle parallax X (max ±4px)
      ty: y * 8,   // subtle parallax Y (max ±4px)
      scale: 1.025,
    })
  }

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, tx: 0, ty: 0, scale: 1 })
    setIsPressed(false)
  }

  const handlePointerDown = () => {
    if (reducedMotion) return
    setIsPressed(true)
  }

  const handlePointerUp = () => {
    setIsPressed(false)
  }

  const social = useContentStore((s) => s.site.social)
  const contactEmail = 'businesstobixp@gmail.com'

  const instagramUrl = social?.instagram || 'https://www.instagram.com/tobi.xp/'
  const instagramHandle = '@tobi.xp'

  async function handleCopyEmail() {
    if (!contactEmail) return
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(contactEmail)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = contactEmail
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      trackContactInteraction('email_click')
      setTimeout(() => setCopied(false), 2400)
    } catch {
      window.location.href = `mailto:${contactEmail}`
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormStatus('Please fill in all fields.')
      return
    }

    setIsSubmitting(true)
    trackContactInteraction('form_submit')

    const subject = encodeURIComponent(`Project Inquiry — ${name.trim()}`)
    const body = encodeURIComponent(
      `Hi Tobi,\n\n${message.trim()}\n\nBest,\n${name.trim()}\n${email.trim()}`
    )
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`

    setTimeout(() => {
      setIsSubmitting(false)
      setFormStatus('Opening your email client...')
    }, 400)
  }

  return (
    <section className="wk-contact-panel" id="contact" aria-label="Contact">
      {/* Background Oversized Subtle Grey Typography: LET'S TALK */}
      <div className="wk-contact-bg-talk" aria-hidden="true">
        <span>LET&apos;S TALK</span>
      </div>

      {/* Main Two-Sided Foreground Content Grid */}
      <div className="wk-contact-inner">
        {/* Left Side — Interactive XP Graphic */}
        <div className="wk-contact-left">
          <div
            ref={logoRef}
            className="wk-contact-logo-wrap"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            role="presentation"
            aria-label="TOBI XP Logo"
            style={{
              transform: reducedMotion
                ? 'none'
                : `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translate3d(${tilt.tx}px, ${tilt.ty}px, 0) scale(${isPressed ? 0.96 : tilt.scale})`,
              transition: isPressed
                ? 'transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)'
                : tilt.scale === 1
                ? 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
                : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
              transformStyle: 'preserve-3d',
            }}
          >
            <img
              src="/images/xp.png"
              alt="TOBI XP"
              className="wk-contact-xp-img"
              draggable={false}
            />
          </div>
        </div>

        {/* Right Side — Minimalist Contact Form & Contact Details Below */}
        <div className="wk-contact-right">
          <div className="wk-contact-form-container">
            <form className="wk-editorial-form" onSubmit={handleSubmit} noValidate={false}>
              <div className="wk-form-row-dual">
                <div className="wk-form-field">
                  <label htmlFor="contact-name" className="wk-form-label">
                    NAME
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (formStatus) setFormStatus(null)
                    }}
                    placeholder="What should I call you?"
                    className="wk-form-input"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="wk-form-field">
                  <label htmlFor="contact-email" className="wk-form-label">
                    EMAIL
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (formStatus) setFormStatus(null)
                    }}
                    placeholder="Where can I reach you?"
                    className="wk-form-input"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="wk-form-field">
                <label htmlFor="contact-message" className="wk-form-label">
                  MESSAGE
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    if (formStatus) setFormStatus(null)
                  }}
                  placeholder="So... what are we cooking?"
                  className="wk-form-textarea"
                  rows={3}
                  required
                />
              </div>

              <div className="wk-form-actions-row">
                <button
                  type="submit"
                  className="wk-editorial-submit-btn"
                  disabled={isSubmitting}
                  aria-label="Send Message"
                >
                  <span>SEND MESSAGE</span>
                  <span className="wk-submit-arrow" aria-hidden="true">
                    &#8599;
                  </span>
                </button>

                {formStatus && (
                  <span className="wk-form-status-msg" role="status">
                    {formStatus}
                  </span>
                )}
              </div>
            </form>

            {/* Contact Details — Directly below the contact form, aligned with left edge */}
            <div className="wk-contact-channels">
              {/* Instagram Option (Instagram first) */}
              <div className="wk-contact-channel">
                <span className="wk-contact-channel-label">INSTAGRAM</span>
                <div className="wk-contact-channel-action">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wk-contact-channel-link"
                    onClick={() => {
                      trackContactInteraction('social_click')
                      trackSocialClick('instagram')
                    }}
                    aria-label={`Visit Instagram ${instagramHandle}`}
                  >
                    <InstagramIcon className="wk-contact-channel-icon" aria-hidden="true" />
                    <span className="wk-contact-channel-val">{instagramHandle}</span>
                  </a>
                </div>
              </div>

              {/* Email Option (Email second) */}
              <div className="wk-contact-channel">
                <span className="wk-contact-channel-label">EMAIL</span>
                <div className="wk-contact-channel-action">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="wk-contact-channel-link"
                    onClick={() => trackContactInteraction('email_click')}
                    aria-label={`Send email to ${contactEmail}`}
                  >
                    <Mail size={16} className="wk-contact-channel-icon" aria-hidden="true" />
                    <span className="wk-contact-channel-val">{contactEmail}</span>
                  </a>
                  <button
                    type="button"
                    className={`wk-copy-btn ${copied ? 'is-copied' : ''}`}
                    onClick={handleCopyEmail}
                    aria-label={copied ? 'Copied to clipboard' : 'Copy email address'}
                    title={copied ? 'Copied!' : 'Copy email'}
                  >
                    {copied ? (
                      <Check size={13} className="text-emerald-500" aria-hidden="true" />
                    ) : (
                      <Copy size={13} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continuously Scrolling Bottom Marquee: LET'S COOK SOMETHING */}
      <div className="wk-contact-marquee" aria-hidden="true">
        <div className="wk-contact-marquee-track">
          <div className="wk-contact-marquee-group">
            {Array.from({ length: 4 }).map((_, idx) => (
              <span key={`g1-${idx}`} className="wk-contact-marquee-text">
                LET&apos;S COOK SOMETHING <span className="wk-contact-marquee-dot">&middot;</span>&nbsp;
              </span>
            ))}
          </div>
          <div className="wk-contact-marquee-group" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, idx) => (
              <span key={`g2-${idx}`} className="wk-contact-marquee-text">
                LET&apos;S COOK SOMETHING <span className="wk-contact-marquee-dot">&middot;</span>&nbsp;
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
