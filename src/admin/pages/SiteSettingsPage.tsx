import { useState, useEffect } from 'react'
import { useContentStore, type SiteContentData } from '../../services/contentStore'
import { useToast } from '../components/toastContext'
import { Save, PanelTop, User as UserIcon, Mail, Share2 } from 'lucide-react'

type TabType = 'hero' | 'about' | 'contact' | 'social'

interface SiteSettingsPageProps {
  initialTab?: TabType
}

export default function SiteSettingsPage({ initialTab = 'hero' }: SiteSettingsPageProps) {
  const { toast } = useToast()
  const site = useContentStore((s) => s.site)
  const updateSiteSection = useContentStore((s) => s.updateSiteSection)

  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [formData, setFormData] = useState<SiteContentData>(site)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    setFormData(site)
  }, [site])

  const handleHeroChange = (field: keyof SiteContentData['hero'], val: any) => {
    setFormData((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: val },
    }))
  }

  const handleAboutChange = (field: keyof SiteContentData['about'], val: any) => {
    setFormData((prev) => ({
      ...prev,
      about: { ...prev.about, [field]: val },
    }))
  }

  const handleContactChange = (field: keyof SiteContentData['contact'], val: any) => {
    setFormData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: val },
    }))
  }

  const handleSocialChange = (field: keyof SiteContentData['social'], val: any) => {
    setFormData((prev) => ({
      ...prev,
      social: { ...prev.social, [field]: val },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (activeTab === 'hero') {
        await updateSiteSection('hero', formData.hero)
      } else if (activeTab === 'about') {
        await updateSiteSection('about', formData.about)
      } else if (activeTab === 'contact') {
        await updateSiteSection('contact', formData.contact)
      } else if (activeTab === 'social') {
        await updateSiteSection('social', formData.social)
      }
      toast(`${activeTab.toUpperCase()} CONTENT SAVED TO FIRESTORE.`)
    } catch (err: any) {
      console.error('[SiteSettings] Save error:', err)
      toast(`FAILED TO SAVE: ${err?.message || err}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-text">
          <h1 className="admin-page-heading">SITE CONTENT</h1>
          <p className="admin-page-description">
            Edit the editorial text, headlines, and touchpoints displayed on the public portfolio.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={13} style={{ marginRight: 6 }} />
            <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs-row" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'hero' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('hero')}
        >
          <PanelTop size={13} style={{ marginRight: 6 }} />
          <span>HERO</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'about' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <UserIcon size={13} style={{ marginRight: 6 }} />
          <span>ABOUT</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'contact' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <Mail size={13} style={{ marginRight: 6 }} />
          <span>CONTACT</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'social' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          <Share2 size={13} style={{ marginRight: 6 }} />
          <span>SOCIAL</span>
        </button>
      </div>

      <div className="admin-card" style={{ padding: 24 }}>
        {/* HERO TAB */}
        {activeTab === 'hero' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 className="admin-form-section-title">HERO FOREGROUND EDITORIAL TEXT</h2>

            <div className="admin-form-group">
              <label className="admin-label">HERO ROLE (UNDER TOBI)</label>
              <input
                type="text"
                className="admin-input"
                value={formData.hero.role || 'ILLUSTRATOR & DESIGNER'}
                onChange={(e) => handleHeroChange('role', e.target.value)}
                placeholder="ILLUSTRATOR &amp; DESIGNER"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">TOP MICROCOPY BADGE</label>
              <input
                type="text"
                className="admin-input"
                value={formData.hero.microCopyTop || 'FIGURING IT OUT AS I GO.'}
                onChange={(e) => handleHeroChange('microCopyTop', e.target.value)}
                placeholder="FIGURING IT OUT AS I GO."
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">EDITORIAL STATEMENT (BESIDE XP)</label>
              <textarea
                className="admin-textarea"
                rows={4}
                value={
                  formData.hero.heroStatement ||
                  `UHMMM... I DIDN’T REALLY\nKNOW WHAT TO PUT HERE,\nSO THIS IS WHAT WE’RE\nGOING WITH LOL`
                }
                onChange={(e) => handleHeroChange('heroStatement', e.target.value)}
                placeholder="UHMMM... I DIDN’T REALLY..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="admin-form-group">
                <label className="admin-label">BOTTOM-LEFT DISCIPLINES LINE</label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.hero.disciplines || 'ILLUSTRATION · CHARACTER DESIGN · VISUAL DEV'}
                  onChange={(e) => handleHeroChange('disciplines', e.target.value)}
                  placeholder="ILLUSTRATION · CHARACTER DESIGN · VISUAL DEV"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">STATUS &amp; LOCATION LINE</label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.hero.statusLine || 'AVAILABLE FOR COMMISSIONS · BASED IN TOKYO'}
                  onChange={(e) => handleHeroChange('statusLine', e.target.value)}
                  placeholder="AVAILABLE FOR COMMISSIONS · BASED IN TOKYO"
                />
              </div>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 className="admin-form-section-title">ABOUT SECTION EDITORIAL CONTENT</h2>

            <div className="admin-form-group">
              <label className="admin-label">EYEBROW LABEL</label>
              <input
                type="text"
                className="admin-input"
                value={formData.about.eyebrow || 'ABOUT TOBI XP'}
                onChange={(e) => handleAboutChange('eyebrow', e.target.value)}
                placeholder="ABOUT TOBI XP"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">MAIN HEADLINE</label>
              <input
                type="text"
                className="admin-input"
                value={formData.about.heading || 'I MAKE THINGS PEOPLE CAN EXPERIENCE.'}
                onChange={(e) => handleAboutChange('heading', e.target.value)}
                placeholder="I MAKE THINGS PEOPLE CAN EXPERIENCE."
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">BIOGRAPHY / STORY NARRATIVE</label>
              <textarea
                className="admin-textarea"
                rows={6}
                value={formData.about.narrative || ''}
                onChange={(e) => handleAboutChange('narrative', e.target.value)}
                placeholder="Hello! I'm Tobi, a digital illustrator and visual designer..."
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">PERSONALITY NOTE / CREATIVE PHILOSOPHY</label>
              <input
                type="text"
                className="admin-input"
                value={formData.about.personalityNote || ''}
                onChange={(e) => handleAboutChange('personalityNote', e.target.value)}
                placeholder="Fueled by coffee, anime soundtracks, and late-night digital experiments."
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">CORE SKILLS &amp; DISCIPLINES (COMMA SEPARATED)</label>
              <input
                type="text"
                className="admin-input"
                value={
                  Array.isArray(formData.about.skills)
                    ? formData.about.skills.join(', ')
                    : formData.about.skills || ''
                }
                onChange={(e) =>
                  handleAboutChange(
                    'skills',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="Digital Illustration, Character Concept Art, Visual Development, UI/UX"
              />
            </div>
          </div>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 className="admin-form-section-title">CONTACT SECTION TOUCHPOINTS &amp; COPY</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="admin-form-group">
                <label className="admin-label">SECTION TITLE</label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.contact.title || "LET'S BUILD SOMETHING."}
                  onChange={(e) => handleContactChange('title', e.target.value)}
                  placeholder="LET'S BUILD SOMETHING."
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">CONTACT INBOX EMAIL</label>
                <input
                  type="email"
                  className="admin-input"
                  value={formData.contact.email || 'businesstobixp@gmail.com'}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  placeholder="businesstobixp@gmail.com"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">SUBTITLE / TAGLINE</label>
              <input
                type="text"
                className="admin-input"
                value={formData.contact.tagline || 'Available for freelance commissions, editorial projects & collaborative ventures.'}
                onChange={(e) => handleContactChange('tagline', e.target.value)}
                placeholder="Available for freelance commissions..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="admin-form-group">
                <label className="admin-label">NAME PLACEHOLDER</label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.contact.nameLabel || 'Your Name'}
                  onChange={(e) => handleContactChange('nameLabel', e.target.value)}
                  placeholder="Your Name"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">EMAIL PLACEHOLDER</label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.contact.emailLabel || 'Your Email'}
                  onChange={(e) => handleContactChange('emailLabel', e.target.value)}
                  placeholder="Your Email"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-label">MESSAGE PLACEHOLDER</label>
                <input
                  type="text"
                  className="admin-input"
                  value={formData.contact.messageLabel || 'Project details, timeline & vision...'}
                  onChange={(e) => handleContactChange('messageLabel', e.target.value)}
                  placeholder="Project details..."
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">SUBMIT BUTTON TEXT</label>
              <input
                type="text"
                className="admin-input"
                value={formData.contact.sendLabel || 'SEND MESSAGE'}
                onChange={(e) => handleContactChange('sendLabel', e.target.value)}
                placeholder="SEND MESSAGE"
              />
            </div>
          </div>
        )}

        {/* SOCIAL TAB */}
        {activeTab === 'social' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 className="admin-form-section-title">SOCIAL TOUCHPOINTS &amp; CHANNELS</h2>

            <div className="admin-form-group">
              <label className="admin-label">INSTAGRAM URL / PROFILE</label>
              <input
                type="text"
                className="admin-input"
                value={formData.social.instagram || 'https://instagram.com/tobi.xp/'}
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                placeholder="https://instagram.com/tobi.xp/"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">DIRECT CONTACT EMAIL</label>
              <input
                type="email"
                className="admin-input"
                value={formData.social.email || 'businesstobixp@gmail.com'}
                onChange={(e) => handleSocialChange('email', e.target.value)}
                placeholder="businesstobixp@gmail.com"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-label">GUESTBOOK / CONTACT LINK LABEL</label>
              <input
                type="text"
                className="admin-input"
                value={formData.social.guestbookLabel || 'GUESTBOOK / CONTACT'}
                onChange={(e) => handleSocialChange('guestbookLabel', e.target.value)}
                placeholder="GUESTBOOK / CONTACT"
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={13} style={{ marginRight: 6 }} />
            <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
