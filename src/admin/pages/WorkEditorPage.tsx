import React, { useState, useEffect } from 'react'
import {
  Save,
  ArrowLeft,
  Star,
  Layers,
  X,
} from 'lucide-react'
import { useAdminRouter } from '../routerContext'
import { useContentStore, type Work } from '../../services/contentStore'
import { useToast } from '../components/toastContext'

interface WorkEditorPageProps {
  workId?: string
}

export default function WorkEditorPage({ workId }: WorkEditorPageProps) {
  const { navigate } = useAdminRouter()
  const { toast } = useToast()
  const works = useContentStore((s) => s.works)
  const categories = useContentStore((s) => s.categories)
  const workGroups = useContentStore((s) => s.workGroups)
  const updateWork = useContentStore((s) => s.updateWork)

  const existingWork = works.find((w) => w.id === workId)

  // Form states
  const [title, setTitle] = useState(existingWork?.title || '')
  const [categoryId, setCategoryId] = useState(existingWork?.categoryId || categories[0]?.id || '')
  const [workGroupId, setWorkGroupId] = useState(existingWork?.workGroupId || '')
  const [discipline, setDiscipline] = useState(existingWork?.discipline || '')
  const [year, setYear] = useState(existingWork?.year || '')
  const [description, setDescription] = useState(existingWork?.description || '')
  const [client, setClient] = useState(existingWork?.client || '')
  const [projectType, setProjectType] = useState(existingWork?.projectType || '')
  const [externalUrl, setExternalUrl] = useState(existingWork?.externalUrl || '')
  const [content, setContent] = useState(existingWork?.content || '')
  const [tools, setTools] = useState<string[]>(existingWork?.tools || [])
  const [toolInput, setToolInput] = useState('')
  const [featured, setFeatured] = useState(existingWork?.featured || false)
  const [status, setStatus] = useState<Work['status']>(existingWork?.status || 'published')
  const [isSaving, setIsSaving] = useState(false)

  // Sync state if existingWork changes
  useEffect(() => {
    if (existingWork) {
      setTitle(existingWork.title)
      setCategoryId(existingWork.categoryId)
      setWorkGroupId(existingWork.workGroupId || '')
      setDiscipline(existingWork.discipline || existingWork.projectType || '')
      setYear(existingWork.year || '')
      setDescription(existingWork.description || '')
      setClient(existingWork.client || '')
      setProjectType(existingWork.projectType || '')
      setExternalUrl(existingWork.externalUrl || '')
      setContent(existingWork.content || '')
      setTools(existingWork.tools || [])
      setFeatured(existingWork.featured || false)
      setStatus(existingWork.status || 'published')
    }
  }, [existingWork])

  if (!workId || !existingWork) {
    return (
      <div className="admin-page-container">
        <div className="admin-empty-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Layers size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>WORK NOT FOUND</h2>
          <p style={{ color: 'var(--ad-text-secondary)', marginBottom: 20 }}>
            The requested portfolio work could not be found.
          </p>
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => navigate('/admin/works')}
          >
            Return to Works
          </button>
        </div>
      </div>
    )
  }

  // Tag inputs
  const handleAddTool = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && toolInput.trim()) {
      e.preventDefault()
      const clean = toolInput.replace(',', '').trim()
      if (clean && !tools.includes(clean)) {
        setTools([...tools, clean])
      }
      setToolInput('')
    }
  }

  const handleRemoveTool = (toolToRemove: string) => {
    setTools(tools.filter((t) => t !== toolToRemove))
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!title.trim()) {
      toast('PLEASE ENTER A WORK TITLE.')
      return
    }

    setIsSaving(true)
    try {
      await updateWork(existingWork.id, {
        title: title.trim(),
        categoryId,
        workGroupId: workGroupId || undefined,
        discipline: discipline.trim(),
        year: year.trim(),
        description: description.trim(),
        client: client.trim(),
        projectType: projectType.trim(),
        externalUrl: externalUrl.trim(),
        content: content.trim(),
        tools,
        featured,
        status,
      })

      toast('WORK CONTENT SAVED TO FIRESTORE.')
    } catch (err: any) {
      console.error('[WorkEditor] Save error:', err)
      toast(`FAILED TO SAVE: ${err?.message || err}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => navigate('/admin/works')}
            aria-label="Back to works"
            style={{ padding: '6px 10px' }}
          >
            <ArrowLeft size={14} />
          </button>
          <div className="admin-page-header-text">
            <h1 className="admin-page-heading">EDIT WORK</h1>
            <p className="admin-page-description">
              Update the content and metadata displayed on the portfolio for &quot;{existingWork.title}&quot;.
            </p>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => handleSave()}
            disabled={isSaving}
          >
            <Save size={13} style={{ marginRight: 6 }} />
            <span>{isSaving ? 'SAVING...' : 'SAVE CHANGES'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24 }}>
          {/* Main Content Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* General Info Card */}
            <div className="admin-card" style={{ padding: 24 }}>
              <h2 className="admin-form-section-title" style={{ marginBottom: 18 }}>
                PROJECT INFORMATION
              </h2>

              {/* Title */}
              <div className="admin-form-group">
                <label className="admin-label">WORK TITLE</label>
                <input
                  type="text"
                  className="admin-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Neo Tokyo Character Studies"
                  required
                />
              </div>

              {/* Short Description */}
              <div className="admin-form-group">
                <label className="admin-label">SHORT DESCRIPTION / STATEMENT</label>
                <textarea
                  className="admin-textarea"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A concise summary of the visual concept and execution..."
                />
              </div>

              {/* Detailed Project Story / Content */}
              <div className="admin-form-group">
                <label className="admin-label">DETAILED PROJECT OVERVIEW / COPY</label>
                <textarea
                  className="admin-textarea"
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="In-depth project background, creative direction, artistic methodology, or client context..."
                />
              </div>
            </div>

            {/* Metadata & Attribution Card */}
            <div className="admin-card" style={{ padding: 24 }}>
              <h2 className="admin-form-section-title" style={{ marginBottom: 18 }}>
                METADATA &amp; ATTRIBUTION
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Year */}
                <div className="admin-form-group">
                  <label className="admin-label">YEAR / TIMELINE</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 2024"
                  />
                </div>

                {/* Client */}
                <div className="admin-form-group">
                  <label className="admin-label">CLIENT / STUDIO</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="e.g. Personal Project, Editorial, Nike"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Discipline */}
                <div className="admin-form-group">
                  <label className="admin-label">DISCIPLINE / ROLE</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    placeholder="e.g. Character Design, Digital Painting"
                  />
                </div>

                {/* Project Type */}
                <div className="admin-form-group">
                  <label className="admin-label">PROJECT TYPE</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    placeholder="e.g. Commercial, Experimental, Editorial"
                  />
                </div>
              </div>

              {/* External Link */}
              <div className="admin-form-group">
                <label className="admin-label">EXTERNAL URL (OPTIONAL)</label>
                <input
                  type="url"
                  className="admin-input"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* Tools Tag Editor */}
              <div className="admin-form-group">
                <label className="admin-label">TOOLS &amp; MEDIUMS</label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    padding: '8px 10px',
                    background: 'var(--ad-surface)',
                    border: '1px solid var(--ad-border)',
                    borderRadius: 4,
                    minHeight: 42,
                    alignItems: 'center',
                  }}
                >
                  {tools.map((t) => (
                    <span
                      key={t}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        background: 'var(--ad-card-bg)',
                        border: '1px solid var(--ad-border)',
                        borderRadius: 3,
                      }}
                    >
                      {t}
                      <X
                        size={12}
                        onClick={() => handleRemoveTool(t)}
                        style={{ cursor: 'pointer', opacity: 0.6 }}
                      />
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Type tool name and press Enter..."
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    onKeyDown={handleAddTool}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      color: 'var(--ad-text-primary)',
                      fontSize: 12,
                      flex: 1,
                      minWidth: 140,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Settings Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Visual Asset Reference Card (Read Only) */}
            <div className="admin-card" style={{ padding: 20 }}>
              <h3 className="admin-form-section-title" style={{ fontSize: 12, marginBottom: 12 }}>
                VISUAL ASSET PREVIEW
              </h3>
              <div
                style={{
                  aspectRatio: '16 / 10',
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: '#141518',
                  position: 'relative',
                  marginBottom: 10,
                  border: '1px solid var(--ad-border)',
                }}
              >
                <img
                  src={existingWork.coverImage || '/images/xp.png'}
                  alt={existingWork.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = '/images/xp.png'
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--ad-text-secondary)', lineHeight: 1.5 }}>
                <span style={{ display: 'block', fontWeight: 600, color: 'var(--ad-text-primary)', wordBreak: 'break-all' }}>
                  {existingWork.coverImage || '/images/xp.png'}
                </span>
                <span style={{ display: 'block', marginTop: 4, opacity: 0.8 }}>
                  Static WebP asset deployed in public/
                </span>
              </div>
            </div>

            {/* Taxonomy & Category */}
            <div className="admin-card" style={{ padding: 20 }}>
              <h3 className="admin-form-section-title" style={{ fontSize: 12, marginBottom: 14 }}>
                CATEGORY &amp; GROUP
              </h3>

              <div className="admin-form-group">
                <label className="admin-label">CATEGORY</label>
                <select
                  className="admin-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {workGroups.length > 0 && (
                <div className="admin-form-group">
                  <label className="admin-label">WORK GROUP (OPTIONAL)</label>
                  <select
                    className="admin-select"
                    value={workGroupId}
                    onChange={(e) => setWorkGroupId(e.target.value)}
                  >
                    <option value="">-- NONE / UNASSIGNED --</option>
                    {workGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Publication & Status */}
            <div className="admin-card" style={{ padding: 20 }}>
              <h3 className="admin-form-section-title" style={{ fontSize: 12, marginBottom: 14 }}>
                VISIBILITY &amp; STATUS
              </h3>

              <div className="admin-form-group">
                <label className="admin-label">PORTFOLIO STATUS</label>
                <select
                  className="admin-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="published">PUBLISHED (VISIBLE)</option>
                  <option value="hidden">HIDDEN</option>
                  <option value="draft">DRAFT</option>
                </select>
              </div>

              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>FEATURED PROJECT</span>
                <button
                  type="button"
                  onClick={() => setFeatured(!featured)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid var(--ad-border)',
                    background: featured ? 'rgba(241, 87, 35, 0.12)' : 'var(--ad-surface)',
                    color: featured ? 'var(--ad-orange)' : 'var(--ad-text-secondary)',
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  <Star size={12} fill={featured ? 'currentColor' : 'none'} />
                  <span>{featured ? 'FEATURED' : 'STANDARD'}</span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={isSaving}
              style={{ width: '100%', padding: '12px 16px', justifyContent: 'center' }}
            >
              <Save size={14} style={{ marginRight: 6 }} />
              <span>{isSaving ? 'SAVING CHANGES...' : 'SAVE CHANGES'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
