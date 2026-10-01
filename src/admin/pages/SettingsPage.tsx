import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Upload,
  Trash2,
  RefreshCw,
  Music,
  Check,
  X,
  FileAudio,
  ShieldCheck,
  User,
  LogOut,
  Palette,
  Globe,
  HardDrive,
  Layers,
  Search,
  BarChart3,
  Shield,
} from 'lucide-react'
import { useContentStore, type AdminSiteSettings, type MediaItem, normalizeStatsData } from '../../services/contentStore'
import { useAuth } from '../auth'
import { useStore } from '../../store'
import { useToast } from '../components/toastContext'
import ConfirmModal from '../components/ConfirmModal'
import {
  uploadAudioToStorage,
  deleteAudioFromStorage,
  formatAudioDuration,
  formatAudioSize,
} from '../../services/audioStorage'
import { executeRadialThemeToggle } from '../../utils/themeTransition'

export type SettingsTab =
  | 'general'
  | 'appearance'
  | 'audio'
  | 'analytics'
  | 'stats'
  | 'portfolio'
  | 'media'
  | 'admin'
  | 'security'

interface SettingsPageProps {
  initialTab?: SettingsTab
}

export default function SettingsPage({ initialTab = 'general' }: SettingsPageProps) {
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  const storeSettings = useContentStore((s) => s.settings)
  const updateSettings = useContentStore((s) => s.updateSettings)
  const media = useContentStore((s) => s.media)
  const addMedia = useContentStore((s) => s.addMedia)
  const siteStatsRaw = useContentStore((s) => s.site.stats)
  const siteStats = normalizeStatsData(siteStatsRaw).stats
  const updateStatsSection = useContentStore((s) => s.updateStatsSection)
  const addStat = (statData: any) => {
    const current = normalizeStatsData(useContentStore.getState().site.stats)
    const newStat = { ...statData, id: `stat-${Date.now()}` }
    updateStatsSection({ stats: [...current.stats, newStat] })
  }
  const updateStat = (id: string, updates: any) => {
    const current = normalizeStatsData(useContentStore.getState().site.stats)
    const stats = current.stats.map(s => s.id === id ? { ...s, ...updates } : s)
    updateStatsSection({ stats })
  }
  const deleteStat = (id: string) => {
    const current = normalizeStatsData(useContentStore.getState().site.stats)
    const stats = current.stats.filter(s => s.id !== id)
    updateStatsSection({ stats })
  }

  const currentTheme = useStore((s) => s.theme)

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)
  const [formData, setFormData] = useState<AdminSiteSettings>(storeSettings)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Audio Upload state
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadFileName, setUploadFileName] = useState('')
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Media picker modal for audio
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)
  const [mediaSearch, setMediaSearch] = useState('')

  // Confirmation modal
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string
    message: string
    confirmLabel: string
    danger?: boolean
    onConfirm: () => void
  } | null>(null)

  // Audio Preview Player
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0)
  const [previewDuration, setPreviewDuration] = useState(formData.audio?.duration || 0)
  const [previewVolume, setPreviewVolume] = useState(formData.audio?.defaultVolume ?? 0.7)

  // Sync formData when storeSettings updates externally
  useEffect(() => {
    setFormData(storeSettings)
  }, [storeSettings])

  // Stop audio preview when navigating tabs or unmounting
  useEffect(() => {
    const audioElement = previewAudioRef.current
    return () => {
      if (audioElement) {
        audioElement.pause()
        audioElement.src = ''
      }
    }
  }, [activeTab])

  // Audio preview time update handler
  const handleTimeUpdate = () => {
    if (previewAudioRef.current) {
      setPreviewCurrentTime(previewAudioRef.current.currentTime)
      if (!isNaN(previewAudioRef.current.duration) && previewAudioRef.current.duration > 0) {
        setPreviewDuration(previewAudioRef.current.duration)
      }
    }
  }

  const handleAudioEnded = () => {
    setIsPreviewPlaying(false)
    setPreviewCurrentTime(0)
  }

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current || !formData.audio?.backgroundSoundUrl) return

    if (isPreviewPlaying) {
      previewAudioRef.current.pause()
      setIsPreviewPlaying(false)
    } else {
      previewAudioRef.current.volume = previewVolume
      previewAudioRef.current
        .play()
        .then(() => setIsPreviewPlaying(true))
        .catch((err) => {
          console.warn('[Audio Preview] Playback failed:', err)
          toast('UNABLE TO PLAY AUDIO PREVIEW.')
        })
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value)
    setPreviewCurrentTime(targetTime)
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = targetTime
    }
  }

  const handlePreviewVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setPreviewVolume(vol)
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = vol
    }
  }

  // Audio Upload handler
  const handleAudioFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingAudio(true)
    setUploadProgress(0)
    setUploadFileName(file.name)

    try {
      const result = await uploadAudioToStorage(file, (progress) => {
        setUploadProgress(progress)
      })

      // Add to media library so it appears in Media assets
      addMedia({
        filename: result.fileName,
        url: result.url,
        type: 'audio',
        size: formatAudioSize(result.size),
        duration: result.duration,
        storagePath: result.storagePath,
        status: 'published',
      })

      // Update audio settings
      const newAudioSettings = {
        ...formData.audio,
        enabled: true,
        backgroundSoundUrl: result.url,
        storagePath: result.storagePath,
        fileName: result.fileName,
        mimeType: result.mimeType,
        size: result.size,
        duration: result.duration,
        updatedAt: new Date().toISOString(),
      }

      setFormData((prev) => ({
        ...prev,
        audio: newAudioSettings,
      }))
      setHasUnsavedChanges(true)

      // Reset preview player with new audio
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current.src = result.url
        previewAudioRef.current.load()
      }
      setIsPreviewPlaying(false)
      setPreviewCurrentTime(0)
      setPreviewDuration(result.duration)

      toast(`AUDIO "${result.fileName}" UPLOADED & ACTIVATED.`)
    } catch (error: any) {
      toast(error?.message ? String(error.message).toUpperCase() : 'AUDIO UPLOAD FAILED.')
    } finally {
      setIsUploadingAudio(false)
      setUploadProgress(0)
      if (audioInputRef.current) {
        audioInputRef.current.value = ''
      }
    }
  }

  // Set audio from existing Media Item
  const handleSelectMediaAudio = (item: MediaItem) => {
    const newAudioSettings = {
      ...formData.audio,
      enabled: true,
      backgroundSoundUrl: item.url,
      storagePath: item.storagePath || '',
      fileName: item.filename,
      mimeType: 'audio/mpeg',
      size: item.size ? parseInt(item.size) : 0,
      duration: item.duration || 0,
      updatedAt: new Date().toISOString(),
    }

    setFormData((prev) => ({
      ...prev,
      audio: newAudioSettings,
    }))
    setHasUnsavedChanges(true)
    setIsMediaPickerOpen(false)

    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.src = item.url
      previewAudioRef.current.load()
    }
    setIsPreviewPlaying(false)
    setPreviewCurrentTime(0)
    setPreviewDuration(item.duration || 0)

    toast(`SELECTED "${item.filename}" AS BACKGROUND SOUND.`)
  }

  // Remove Audio prompt
  const handlePromptRemoveAudio = () => {
    setConfirmModalData({
      title: 'REMOVE BACKGROUND SOUND?',
      message: 'The background sound will no longer play on the public portfolio.',
      confirmLabel: 'REMOVE AUDIO',
      danger: true,
      onConfirm: async () => {
        const oldStoragePath = formData.audio?.storagePath
        if (oldStoragePath) {
          deleteAudioFromStorage(oldStoragePath).catch(() => {})
        }

        const clearedAudio = {
          ...formData.audio,
          enabled: false,
          backgroundSoundUrl: '',
          storagePath: undefined,
          fileName: '',
          mimeType: '',
          size: 0,
          duration: 0,
          updatedAt: new Date().toISOString(),
        }

        setFormData((prev) => ({
          ...prev,
          audio: clearedAudio,
        }))
        updateSettings({ audio: clearedAudio })
        setHasUnsavedChanges(false)

        if (previewAudioRef.current) {
          previewAudioRef.current.pause()
          previewAudioRef.current.src = ''
        }
        setIsPreviewPlaying(false)
        setPreviewCurrentTime(0)

        setConfirmModalData(null)
        toast('BACKGROUND SOUND REMOVED.')
      },
    })
  }

  // Save all settings changes
  const handleSave = () => {
    updateSettings(formData)
    setHasUnsavedChanges(false)
    toast('CHANGES SAVED.')
  }

  // Audio assets in media library for selection
  const audioMediaAssets = useMemo(() => {
    return media.filter((m) => {
      const isAudio =
        m.type === 'audio' ||
        /\.(mp3|wav|ogg|m4a|aac)$/i.test(m.filename) ||
        /\.(mp3|wav|ogg|m4a|aac)$/i.test(m.url)
      if (!isAudio) return false
      if (mediaSearch.trim()) {
        const q = mediaSearch.toLowerCase()
        return m.filename.toLowerCase().includes(q)
      }
      return true
    })
  }, [media, mediaSearch])

  return (
    <div className="admin-page-container">
      {/* Hidden audio element for preview */}
      {formData.audio?.backgroundSoundUrl && (
        <audio
          ref={previewAudioRef}
          src={formData.audio.backgroundSoundUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          preload="metadata"
        />
      )}

      {/* Hidden file input for audio upload */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/aac"
        style={{ display: 'none' }}
        onChange={handleAudioFileSelected}
      />

      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="admin-page-heading">SETTINGS</h1>
            {hasUnsavedChanges && (
              <span className="admin-badge admin-badge-orange" style={{ fontSize: 10 }}>
                UNSAVED CHANGES
              </span>
            )}
          </div>
          <p className="admin-page-description">
            PORTFOLIO PREFERENCES, THEME, AUDIO, SYSTEM &amp; SECURITY.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn-primary"
            onClick={handleSave}
            title="Save all changes to Firestore"
          >
            <Check size={14} style={{ marginRight: 6 }} />
            SAVE CHANGES
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="admin-tabs-row" role="tablist">
        {[
          { id: 'general', label: 'GENERAL', icon: <Globe size={13} /> },
          { id: 'appearance', label: 'APPEARANCE', icon: <Palette size={13} /> },
          { id: 'audio', label: 'AUDIO / SOUND', icon: <Volume2 size={13} /> },
          { id: 'analytics', label: 'ANALYTICS', icon: <BarChart3 size={13} /> },
          { id: 'stats', label: 'STATS / NUMBERS', icon: <BarChart3 size={13} /> },
          { id: 'portfolio', label: 'PORTFOLIO', icon: <Layers size={13} /> },
          { id: 'media', label: 'MEDIA', icon: <HardDrive size={13} /> },
          { id: 'admin', label: 'ADMIN ACCOUNT', icon: <User size={13} /> },
          { id: 'security', label: 'SECURITY', icon: <ShieldCheck size={13} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`admin-tab-item ${activeTab === tab.id ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.id as SettingsTab)}
          >
            <span style={{ marginRight: 6, display: 'inline-flex', alignItems: 'center' }}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT SECTIONS */}
      <div className="admin-settings-container" style={{ marginTop: 20 }}>
        {/* =========================================================================
            TAB 1: GENERAL SETTINGS
           ========================================================================= */}
        {activeTab === 'general' && (
          <div className="admin-settings-card">
            <div className="admin-settings-head">
              <h2 className="admin-settings-title">GENERAL CONFIGURATION</h2>
              <p className="admin-settings-sub">
                Global brand metadata and localization settings for TOBI XP.
              </p>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">PORTFOLIO NAME</label>
              <input
                type="text"
                className="admin-input"
                value={formData.general?.portfolioName || ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    general: { ...prev.general, portfolioName: e.target.value },
                  }))
                  setHasUnsavedChanges(true)
                }}
                placeholder="TOBI XP"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">PORTFOLIO URL</label>
              <input
                type="text"
                className="admin-input"
                value={formData.general?.portfolioUrl || ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    general: { ...prev.general, portfolioUrl: e.target.value },
                  }))
                  setHasUnsavedChanges(true)
                }}
                placeholder="https://tobixp.com/"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">ADMIN DISPLAY NAME</label>
              <input
                type="text"
                className="admin-input"
                value={formData.general?.adminDisplayName || ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    general: { ...prev.general, adminDisplayName: e.target.value },
                  }))
                  setHasUnsavedChanges(true)
                }}
                placeholder="TOBI XP Studio"
              />
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group" style={{ flex: 1 }}>
                <label className="admin-form-label">DEFAULT TIMEZONE</label>
                <select
                  className="admin-select"
                  value={formData.general?.timezone || 'UTC'}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      general: { ...prev.general, timezone: e.target.value },
                    }))
                    setHasUnsavedChanges(true)
                  }}
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>

              <div className="admin-form-group" style={{ flex: 1 }}>
                <label className="admin-form-label">LOCALE</label>
                <select
                  className="admin-select"
                  value={formData.general?.locale || 'en-US'}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      general: { ...prev.general, locale: e.target.value },
                    }))
                    setHasUnsavedChanges(true)
                  }}
                >
                  <option value="en-US">en-US (English - United States)</option>
                  <option value="en-GB">en-GB (English - United Kingdom)</option>
                  <option value="ja-JP">ja-JP (Japanese)</option>
                  <option value="fr-FR">fr-FR (French)</option>
                  <option value="de-DE">de-DE (German)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: STATS / NUMBERS SETTINGS
           ========================================================================= */}
        {activeTab === 'stats' && (
          <div className="admin-settings-card">
            <div className="admin-settings-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="admin-settings-title">EDITORIAL STATISTICS &amp; NUMBERS</h2>
                <p className="admin-settings-sub">
                  Manage the oversized number counter section displayed between Resume and Works in the portfolio.
                </p>
              </div>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={() => {
                  addStat({
                    value: 10,
                    suffix: '+',
                    label: 'NEW STATISTIC',
                    description: 'Description of statistic.',
                    visible: true,
                    order: siteStats.length + 1,
                  })
                  toast('STAT ADDED.')
                }}
              >
                + ADD STAT
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
              {siteStats.map((stat: any, idx: number) => (
                <div
                  key={stat.id}
                  style={{
                    padding: 20,
                    background: 'var(--ad-surface-hover)',
                    border: '1px solid var(--ad-border)',
                    borderRadius: 'var(--ad-radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase' }}>
                      STAT 0{idx + 1} {idx === 0 ? '(PRIMARY 450+)' : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={stat.visible !== false}
                          onChange={(e) => {
                            updateStat(stat.id, { visible: e.target.checked })
                            toast('STAT UPDATED.')
                          }}
                        />
                        VISIBLE
                      </label>
                      {siteStats.length > 1 && (
                        <button
                          type="button"
                          className="admin-btn-danger"
                          style={{ padding: '4px 8px', fontSize: 11 }}
                          onClick={() => {
                            deleteStat(stat.id)
                            toast('STAT DELETED.')
                          }}
                        >
                          DELETE
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="admin-form-row">
                    <div className="admin-form-group" style={{ flex: 1 }}>
                      <label className="admin-form-label">VALUE (NUMERIC)</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={stat.value}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0
                          updateStat(stat.id, { value: val })
                        }}
                      />
                    </div>
                    <div className="admin-form-group" style={{ width: 120 }}>
                      <label className="admin-form-label">SUFFIX</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={stat.suffix || ''}
                        onChange={(e) => {
                          updateStat(stat.id, { suffix: e.target.value })
                        }}
                        placeholder="+"
                      />
                    </div>
                    <div className="admin-form-group" style={{ width: 120 }}>
                      <label className="admin-form-label">ORDER</label>
                      <input
                        type="number"
                        className="admin-input"
                        value={stat.order}
                        onChange={(e) => {
                          const ord = parseInt(e.target.value, 10) || 1
                          updateStat(stat.id, { order: ord })
                        }}
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">LABEL</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={stat.label}
                      onChange={(e) => {
                        updateStat(stat.id, { label: e.target.value })
                      }}
                      placeholder="PROJECTS COMPLETED"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">DESCRIPTION</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={stat.description || ''}
                      onChange={(e) => {
                        updateStat(stat.id, { description: e.target.value })
                      }}
                      placeholder="Projects created across illustration, design and interactive experiences."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        

        {/* =========================================================================
            TAB 2: APPEARANCE SETTINGS
           ========================================================================= */}
        {activeTab === 'appearance' && (
          <div className="admin-settings-card">
            <div className="admin-settings-head">
              <h2 className="admin-settings-title">GLOBAL APPEARANCE &amp; THEME</h2>
              <p className="admin-settings-sub">
                Manage theme preferences and radial expansion transitions.
              </p>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">PORTFOLIO THEME</label>
              <div className="admin-theme-selection-grid">
                {[
                  { id: 'dark', title: 'DARK MODE', desc: 'Midnight obsidian canvas (#0D0D0F)' },
                  { id: 'light', title: 'LIGHT MODE', desc: 'Warm minimalist paper (#F5F3EE)' },
                ].map((t) => {
                  const isCurrent = currentTheme === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`admin-theme-option-card ${isCurrent ? 'is-selected' : ''}`}
                      onClick={(e) => {
                        if (currentTheme !== t.id) {
                          executeRadialThemeToggle(e)
                        }
                      }}
                    >
                      <div className="admin-theme-option-top">
                        <span className="admin-theme-title">{t.title}</span>
                        {isCurrent && (
                          <span className="admin-badge admin-badge-orange">ACTIVE</span>
                        )}
                      </div>
                      <p className="admin-theme-desc">{t.desc}</p>
                    </button>
                  )
                })}
              </div>
              <p className="admin-form-hint" style={{ marginTop: 12 }}>
                Clicking a theme triggers the viewport radial expansion originating from your click position.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: AUDIO / SOUND SETTINGS (MAIN FEATURE)
           ========================================================================= */}
        {activeTab === 'audio' && (
          <div className="admin-settings-card">
            <div className="admin-settings-head">
              <h2 className="admin-settings-title">BACKGROUND SOUND MANAGEMENT</h2>
              <p className="admin-settings-sub">
                Configure ambient background audio used throughout the public portfolio.
              </p>
            </div>

            {/* Global Enable / Disable Toggle */}
            <div
              className="admin-settings-row-toggle"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: 'var(--ad-surface)',
                border: '1px solid var(--ad-border)',
                borderRadius: 'var(--ad-radius-md)',
                marginBottom: 24,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>
                  GLOBAL BACKGROUND SOUND
                </div>
                <div style={{ fontSize: 12, color: 'var(--ad-text-secondary)', marginTop: 2 }}>
                  Controls whether background audio is enabled across the public site.
                </div>
              </div>

              <button
                type="button"
                className={`admin-toggle-switch ${formData.audio?.enabled ? 'is-on' : 'is-off'}`}
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    audio: { ...prev.audio, enabled: !prev.audio?.enabled },
                  }))
                  setHasUnsavedChanges(true)
                }}
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  background: formData.audio?.enabled ? 'var(--ad-accent)' : 'var(--ad-border)',
                  position: 'relative',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: formData.audio?.enabled ? 27 : 3,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>

            {/* Active Audio Asset Display or Empty State */}
            {formData.audio?.backgroundSoundUrl ? (
              <div
                className="admin-audio-track-card"
                style={{
                  padding: 24,
                  background: 'var(--ad-surface-hover)',
                  border: '1px solid var(--ad-border)',
                  borderRadius: 'var(--ad-radius-lg)',
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 'var(--ad-radius-md)',
                        background: 'var(--ad-accent-subtle)',
                        color: 'var(--ad-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileAudio size={24} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>
                          {formData.audio.fileName || 'ambient-background.mp3'}
                        </span>
                        <span className="admin-badge admin-badge-orange" style={{ fontSize: 9 }}>
                          ACTIVE TRACK
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--ad-text-secondary)',
                          marginTop: 4,
                          display: 'flex',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>{formData.audio.mimeType ? formData.audio.mimeType.toUpperCase().replace('AUDIO/', '') : 'MP3'}</span>
                        <span>·</span>
                        <span>{formatAudioSize(formData.audio.size)}</span>
                        <span>·</span>
                        <span>{formatAudioDuration(formData.audio.duration || previewDuration)}</span>
                        {formData.audio.updatedAt && (
                          <>
                            <span>·</span>
                            <span>Updated {new Date(formData.audio.updatedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: REPLACE, SELECT FROM MEDIA, REMOVE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => audioInputRef.current?.click()}
                      title="Upload and replace with new audio file"
                    >
                      <RefreshCw size={12} style={{ marginRight: 5 }} />
                      REPLACE
                    </button>

                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => setIsMediaPickerOpen(true)}
                      title="Select existing track from Media library"
                    >
                      <Music size={12} style={{ marginRight: 5 }} />
                      MEDIA
                    </button>

                    <button
                      type="button"
                      className="admin-btn-secondary admin-action-btn-danger"
                      onClick={handlePromptRemoveAudio}
                      title="Remove background audio track"
                    >
                      <Trash2 size={12} style={{ marginRight: 5 }} />
                      REMOVE
                    </button>
                  </div>
                </div>

                {/* Embedded HTML5 Preview Player */}
                <div
                  className="admin-audio-preview-player"
                  style={{
                    padding: '14px 18px',
                    background: 'var(--ad-surface)',
                    border: '1px solid var(--ad-border)',
                    borderRadius: 'var(--ad-radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={togglePreviewPlay}
                      style={{
                        width: 36,
                        height: 36,
                        padding: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label={isPreviewPlaying ? 'Pause preview' : 'Play preview'}
                    >
                      {isPreviewPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 2 }} />}
                    </button>

                    {/* Progress Slider */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontVariantNumeric: 'tabular-nums',
                          color: 'var(--ad-text-secondary)',
                          minWidth: 36,
                        }}
                      >
                        {formatAudioDuration(previewCurrentTime)}
                      </span>

                      <input
                        type="range"
                        min="0"
                        max={previewDuration || 100}
                        step="0.1"
                        value={previewCurrentTime}
                        onChange={handleSeek}
                        style={{ flex: 1, accentColor: 'var(--ad-accent)', cursor: 'pointer' }}
                        aria-label="Audio preview seek position"
                      />

                      <span
                        style={{
                          fontSize: 11,
                          fontVariantNumeric: 'tabular-nums',
                          color: 'var(--ad-text-secondary)',
                          minWidth: 36,
                          textAlign: 'right',
                        }}
                      >
                        {formatAudioDuration(previewDuration)}
                      </span>
                    </div>

                    {/* Volume Slider in Preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 100 }}>
                      {previewVolume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={previewVolume}
                        onChange={handlePreviewVolumeChange}
                        style={{ width: '100%', accentColor: 'var(--ad-accent)', cursor: 'pointer' }}
                        aria-label="Preview volume"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div
                className="admin-audio-empty-card"
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: 'var(--ad-surface)',
                  border: '1px dashed var(--ad-border)',
                  borderRadius: 'var(--ad-radius-lg)',
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--ad-surface-hover)',
                    color: 'var(--ad-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                  }}
                >
                  <Music size={22} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>
                  NO BACKGROUND SOUND CONFIGURED
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--ad-text-secondary)',
                    maxWidth: 380,
                    margin: '0 auto 18px auto',
                  }}
                >
                  Upload an ambient audio file or choose one from your existing Media Library.
                </p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    onClick={() => audioInputRef.current?.click()}
                  >
                    <Upload size={13} style={{ marginRight: 6 }} />
                    + UPLOAD AUDIO
                  </button>

                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setIsMediaPickerOpen(true)}
                  >
                    <Music size={13} style={{ marginRight: 6 }} />
                    SELECT FROM MEDIA
                  </button>
                </div>
              </div>
            )}

            {/* Default Volume Configuration */}
            <div className="admin-form-group" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label className="admin-form-label" style={{ margin: 0 }}>
                  DEFAULT SESSION VOLUME
                </label>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--ad-accent)',
                  }}
                >
                  {Math.round((formData.audio?.defaultVolume ?? 0.7) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formData.audio?.defaultVolume ?? 0.7}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setFormData((prev) => ({
                    ...prev,
                    audio: { ...prev.audio, defaultVolume: val },
                  }))
                  setHasUnsavedChanges(true)
                }}
                className="admin-input"
                style={{ padding: 0, height: 28, accentColor: 'var(--ad-accent)' }}
              />
              <p className="admin-form-hint" style={{ marginTop: 6 }}>
                Initial volume level for first-time visitors. Returning visitors retain their saved volume preference.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: ANALYTICS & MEASUREMENT SETTINGS
           ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="admin-settings-card">
            <div className="admin-settings-head">
              <h2 className="admin-settings-title">ANALYTICS &amp; MEASUREMENT</h2>
              <p className="admin-settings-sub">
                Configure Google Analytics 4 (GA4) and Firebase Analytics tracking rules for TOBI XP.
              </p>
            </div>

            {/* Status Summary Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: formData.analytics?.enabled !== false ? 'rgba(46, 204, 113, 0.08)' : 'var(--ad-surface)',
                border: `1px solid ${formData.analytics?.enabled !== false ? 'rgba(46, 204, 113, 0.25)' : 'var(--ad-border)'}`,
                borderRadius: 'var(--ad-radius-md)',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: formData.analytics?.enabled !== false ? '#2ecc71' : 'var(--ad-text-muted)',
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>
                    {formData.analytics?.enabled !== false ? 'ANALYTICS ACTIVE & TRACKING' : 'ANALYTICS DISABLED'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ad-text-secondary)' }}>
                    {formData.analytics?.measurementId
                      ? `Measurement Stream ID: ${formData.analytics.measurementId}`
                      : 'No measurement ID specified. Using default portfolio configuration.'}
                  </div>
                </div>
              </div>

              <label className="admin-toggle" style={{ margin: 0 }}>
                <input
                  type="checkbox"
                  checked={formData.analytics?.enabled !== false}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      analytics: {
                        ...(prev.analytics || {
                          anonymizeIp: true,
                          trackScrollMilestones: true,
                          trackAudioEvents: true,
                          trackDownloadEvents: true,
                          trackThemeEvents: true,
                        }),
                        enabled: e.target.checked,
                      },
                    }))
                    setHasUnsavedChanges(true)
                  }}
                />
                <span className="admin-toggle-slider" />
              </label>
            </div>

            {/* Measurement ID */}
            <div className="admin-form-group">
              <label className="admin-form-label">GOOGLE ANALYTICS 4 MEASUREMENT ID</label>
              <input
                type="text"
                className="admin-input"
                value={formData.analytics?.measurementId || ''}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    analytics: {
                      ...(prev.analytics || {
                        enabled: true,
                        anonymizeIp: true,
                        trackScrollMilestones: true,
                        trackAudioEvents: true,
                        trackDownloadEvents: true,
                        trackThemeEvents: true,
                      }),
                      measurementId: e.target.value,
                    },
                  }))
                  setHasUnsavedChanges(true)
                }}
                placeholder="G-XXXXXXXXXX"
              />
              <p className="admin-form-hint">
                Found under Google Analytics → Admin → Data Streams → Web Stream details.
              </p>
            </div>

            {/* Privacy & Event Toggles */}
            <div className="admin-section-divider" style={{ margin: '24px 0' }} />

            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 16 }}>
              PRIVACY &amp; EVENT TRACKING
            </h3>

            <div className="admin-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label className="admin-form-label" style={{ margin: 0 }}>IP ANONYMIZATION</label>
                  <p className="admin-form-hint" style={{ marginTop: 2 }}>
                    Anonymize visitor IP addresses before sending data to Firebase / GA4.
                  </p>
                </div>
                <label className="admin-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.analytics?.anonymizeIp !== false}
                    onChange={(e) => {
                      const baseAnalytics = formData.analytics || {
                        enabled: true,
                        anonymizeIp: true,
                        trackScrollMilestones: true,
                        trackAudioEvents: true,
                        trackDownloadEvents: true,
                        trackThemeEvents: true,
                      }
                      setFormData((prev) => ({
                        ...prev,
                        analytics: {
                          ...baseAnalytics,
                          anonymizeIp: e.target.checked,
                        },
                      }))
                      setHasUnsavedChanges(true)
                    }}
                  />
                  <span className="admin-toggle-slider" />
                </label>
              </div>
            </div>

            <div className="admin-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label className="admin-form-label" style={{ margin: 0 }}>SCROLL MILESTONES (25%, 50%, 75%, 90%)</label>
                  <p className="admin-form-hint" style={{ marginTop: 2 }}>
                    Track depth of page consumption without sending spam on every scroll frame.
                  </p>
                </div>
                <label className="admin-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.analytics?.trackScrollMilestones !== false}
                    onChange={(e) => {
                      const baseAnalytics = formData.analytics || {
                        enabled: true,
                        anonymizeIp: true,
                        trackScrollMilestones: true,
                        trackAudioEvents: true,
                        trackDownloadEvents: true,
                        trackThemeEvents: true,
                      }
                      setFormData((prev) => ({
                        ...prev,
                        analytics: {
                          ...baseAnalytics,
                          trackScrollMilestones: e.target.checked,
                        },
                      }))
                      setHasUnsavedChanges(true)
                    }}
                  />
                  <span className="admin-toggle-slider" />
                </label>
              </div>
            </div>

            <div className="admin-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label className="admin-form-label" style={{ margin: 0 }}>AUDIO INTERACTION EVENTS</label>
                  <p className="admin-form-hint" style={{ marginTop: 2 }}>
                    Track background sound plays, pauses, and mutes.
                  </p>
                </div>
                <label className="admin-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.analytics?.trackAudioEvents !== false}
                    onChange={(e) => {
                      const baseAnalytics = formData.analytics || {
                        enabled: true,
                        anonymizeIp: true,
                        trackScrollMilestones: true,
                        trackAudioEvents: true,
                        trackDownloadEvents: true,
                        trackThemeEvents: true,
                      }
                      setFormData((prev) => ({
                        ...prev,
                        analytics: {
                          ...baseAnalytics,
                          trackAudioEvents: e.target.checked,
                        },
                      }))
                      setHasUnsavedChanges(true)
                    }}
                  />
                  <span className="admin-toggle-slider" />
                </label>
              </div>
            </div>

            <div className="admin-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label className="admin-form-label" style={{ margin: 0 }}>RESUME &amp; PDF DOWNLOADS</label>
                  <p className="admin-form-hint" style={{ marginTop: 2 }}>
                    Track when visitors click to download your resume or portfolio documents.
                  </p>
                </div>
                <label className="admin-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.analytics?.trackDownloadEvents !== false}
                    onChange={(e) => {
                      const baseAnalytics = formData.analytics || {
                        enabled: true,
                        anonymizeIp: true,
                        trackScrollMilestones: true,
                        trackAudioEvents: true,
                        trackDownloadEvents: true,
                        trackThemeEvents: true,
                      }
                      setFormData((prev) => ({
                        ...prev,
                        analytics: {
                          ...baseAnalytics,
                          trackDownloadEvents: e.target.checked,
                        },
                      }))
                      setHasUnsavedChanges(true)
                    }}
                  />
                  <span className="admin-toggle-slider" />
                </label>
              </div>
            </div>

            <div className="admin-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label className="admin-form-label" style={{ margin: 0 }}>RADIAL THEME TOGGLE</label>
                  <p className="admin-form-hint" style={{ marginTop: 2 }}>
                    Track visitor theme toggles (light/dark) without capturing personal data.
                  </p>
                </div>
                <label className="admin-toggle" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.analytics?.trackThemeEvents !== false}
                    onChange={(e) => {
                      const baseAnalytics = formData.analytics || {
                        enabled: true,
                        anonymizeIp: true,
                        trackScrollMilestones: true,
                        trackAudioEvents: true,
                        trackDownloadEvents: true,
                        trackThemeEvents: true,
                      }
                      setFormData((prev) => ({
                        ...prev,
                        analytics: {
                          ...baseAnalytics,
                          trackThemeEvents: e.target.checked,
                        },
                      }))
                      setHasUnsavedChanges(true)
                    }}
                  />
                  <span className="admin-toggle-slider" />
                </label>
              </div>
            </div>

            {/* Privacy Guarantee Note */}
            <div
              style={{
                marginTop: 24,
                padding: 16,
                background: 'var(--ad-surface)',
                border: '1px solid var(--ad-border)',
                borderRadius: 'var(--ad-radius-md)',
                fontSize: 12,
                color: 'var(--ad-text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--ad-text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} style={{ color: 'var(--ad-orange)' }} />
                <span>PRIVACY &amp; ADMIN EXCLUSION GUARANTEE</span>
              </div>
              <p style={{ margin: 0 }}>
                TOBI XP automatically excludes authenticated admin sessions and <code>/admin</code> routes so your management activity never pollutes public visitor insights. Form message contents, contact emails, and personal identifiers are strictly excluded from all tracking payloads.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: PORTFOLIO SETTINGS
           ========================================================================= */}
        {activeTab === 'portfolio' && (
          <div className="admin-settings-card">
            <div className="admin-settings-head">
              <h2 className="admin-settings-title">PORTFOLIO BEHAVIOR</h2>
              <p className="admin-settings-sub">
                Control default visibility and content presentation rules.
              </p>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">DEFAULT WORK STATUS FOR NEW ITEMS</label>
              <select
                className="admin-select"
                value={formData.portfolio?.defaultWorkStatus || 'published'}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    portfolio: {
                      ...prev.portfolio,
                      defaultWorkStatus: e.target.value as 'published' | 'draft',
                    },
                  }))
                  setHasUnsavedChanges(true)
                }}
              >
                <option value="published">Published (Immediately visible)</option>
                <option value="draft">Draft (Private until published)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">DEFAULT CATEGORY ORDERING</label>
              <select
                className="admin-select"
                value={formData.portfolio?.defaultCategoryOrder || 'manual'}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    portfolio: {
                      ...prev.portfolio,
                      defaultCategoryOrder: e.target.value as 'manual' | 'alphabetical',
                    },
                  }))
                  setHasUnsavedChanges(true)
                }}
              >
                <option value="manual">Manual Sequence (Configured in Categories view)</option>
                <option value="alphabetical">Alphabetical (A to Z)</option>
              </select>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: MEDIA SETTINGS
           ========================================================================= */}
        {activeTab === 'media' && (
          <div className="admin-settings-card">
            <div className="admin-settings-head">
              <h2 className="admin-settings-title">MEDIA LIBRARY CONFIGURATION</h2>
              <p className="admin-settings-sub">
                Storage limits and allowed MIME types enforced during asset uploads.
              </p>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">DEFAULT MEDIA VISIBILITY</label>
              <select
                className="admin-select"
                value={formData.media?.defaultVisibility || 'published'}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    media: {
                      ...prev.media,
                      defaultVisibility: e.target.value as 'published' | 'hidden',
                    },
                  }))
                  setHasUnsavedChanges(true)
                }}
              >
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">MAXIMUM ASSET UPLOAD SIZE</label>
              <input
                type="text"
                className="admin-input"
                disabled
                value="50 MB (Enforced by client & storage constraints)"
              />
              <p className="admin-form-hint">
                Configured to optimize web asset performance and client memory.
              </p>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">ALLOWED MEDIA FORMATS</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {['JPEG', 'PNG', 'WEBP', 'GIF', 'MP4', 'MP3', 'WAV', 'OGG', 'GLB', 'GLTF'].map((fmt) => (
                  <span
                    key={fmt}
                    className="admin-badge"
                    style={{ background: 'var(--ad-surface-hover)', fontSize: 10 }}
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: ADMIN ACCOUNT SETTINGS
           ========================================================================= */}
        {activeTab === 'admin' && (
          <div className="admin-settings-card">
            <div className="admin-settings-head">
              <h2 className="admin-settings-title">AUTHENTICATED ADMIN</h2>
              <p className="admin-settings-sub">
                Google account currently authorized to manage TOBI XP.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 22px',
                background: 'var(--ad-surface-hover)',
                border: '1px solid var(--ad-border)',
                borderRadius: 'var(--ad-radius-md)',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Admin'}
                    style={{ width: 44, height: 44, borderRadius: '50%' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'var(--ad-accent-subtle)',
                      color: 'var(--ad-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    TXP
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {user?.displayName || 'TOBI XP Administrator'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ad-text-secondary)', marginTop: 2 }}>
                    {user?.email || 'tobyson707@gmail.com'}
                  </div>
                </div>
              </div>

              <span className="admin-badge admin-badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={12} />
                AUTHORIZED ADMIN
              </span>
            </div>

            <p className="admin-form-hint" style={{ marginBottom: 20 }}>
              Admin authorization is strictly enforced by Firebase Authentication and Firestore Security Rules.
            </p>

            <button
              type="button"
              className="admin-btn-secondary admin-action-btn-danger"
              onClick={async () => {
                await signOut()
                window.location.href = '/admin'
              }}
            >
              <LogOut size={13} style={{ marginRight: 6 }} />
              SIGN OUT
            </button>
          </div>
        )}

        {/* =========================================================================
            TAB 7: SECURITY SETTINGS
           ========================================================================= */}
        {activeTab === 'security' && (
          <div className="admin-settings-card">
            <div className="admin-settings-head">
              <h2 className="admin-settings-title">SECURITY &amp; ACCESS BOUNDARY</h2>
              <p className="admin-settings-sub">
                Firestore rules enforcement and admin access validation.
              </p>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">AUTHENTICATION PROVIDER</label>
              <input
                type="text"
                className="admin-input"
                disabled
                value="Google Sign-In (Firebase Auth 2.0)"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">FIRESTORE SECURITY RULES STATUS</label>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(46, 204, 113, 0.08)',
                  border: '1px solid rgba(46, 204, 113, 0.25)',
                  borderRadius: 'var(--ad-radius-md)',
                  color: '#27ae60',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ShieldCheck size={16} />
                <span>Strict Security Rules Enforced (Public Read, Admin Write Only)</span>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">AUTHORIZED ADMIN EMAILS</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {['tobyson707@gmail.com', 'jh204222@gmail.com'].map((em) => (
                  <div
                    key={em}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--ad-surface-hover)',
                      borderRadius: 'var(--ad-radius-sm)',
                      fontSize: 12,
                      fontFamily: 'var(--admin-font-mono)',
                    }}
                  >
                    {em}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real Upload Progress Modal */}
      {isUploadingAudio && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card" style={{ maxWidth: 420, textAlign: 'center', padding: 28 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--ad-accent-subtle)',
                color: 'var(--ad-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <Upload size={22} className="animate-bounce" />
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0' }}>
              UPLOADING AUDIO
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ad-text-secondary)', margin: '0 0 18px 0' }}>
              {uploadFileName}
            </p>

            <div
              style={{
                width: '100%',
                height: 8,
                background: 'var(--ad-surface-hover)',
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  background: 'var(--ad-accent)',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>

            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--ad-accent)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {uploadProgress}%
            </span>
          </div>
        </div>
      )}

      {/* Select From Media Modal */}
      {isMediaPickerOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsMediaPickerOpen(false)}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: 560, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <h3 className="admin-modal-title">SELECT AUDIO FROM MEDIA LIBRARY</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setIsMediaPickerOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '0 20px 16px 20px' }}>
              <div className="admin-search-wrap" style={{ width: '100%', marginBottom: 14 }}>
                <Search size={14} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search audio assets..."
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                />
              </div>

              <div
                style={{
                  maxHeight: 320,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {audioMediaAssets.length > 0 ? (
                  audioMediaAssets.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'var(--ad-surface-hover)',
                        border: '1px solid var(--ad-border)',
                        borderRadius: 'var(--ad-radius-md)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileAudio size={20} style={{ color: 'var(--ad-accent)' }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.filename}</div>
                          <div style={{ fontSize: 11, color: 'var(--ad-text-secondary)' }}>
                            {item.size || 'Audio asset'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="admin-btn-primary"
                        style={{ padding: '6px 12px', fontSize: 11 }}
                        onClick={() => handleSelectMediaAudio(item)}
                      >
                        USE TRACK
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--ad-text-secondary)' }}>
                    No audio assets found in Media library. Upload an MP3 or WAV file above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalData && (
        <ConfirmModal
          isOpen={true}
          title={confirmModalData.title}
          message={confirmModalData.message}
          confirmLabel={confirmModalData.confirmLabel}
          danger={confirmModalData.danger}
          onConfirm={confirmModalData.onConfirm}
          onCancel={() => setConfirmModalData(null)}
        />
      )}
    </div>
  )
}
