import React, { useState, useRef } from 'react'
import { X, Upload } from 'lucide-react'
import { useContentStore, type Category } from '../../services/contentStore'
import { uploadMediaFile } from '../../services/mediaService'

interface QuickPostModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newWorkId: string) => void
}

export default function QuickPostModal({ isOpen, onClose, onSuccess }: QuickPostModalProps) {
  const categories = useContentStore((s) => s.categories.filter((c) => c.status !== 'archived'))
  const addWork = useContentStore((s) => s.addWork)
  const works = useContentStore((s) => s.works)

  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || 'ad')
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError('')
    try {
      const mediaItem = await uploadMediaFile(file, {
        categoryId,
        source: 'computer',
      })
      setImage(mediaItem.optimizedUrl || mediaItem.url)
    } catch (err: any) {
      console.error('[QuickPost] Image upload error:', err)
      setError(`Failed to upload image: ${err?.message || err}`)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please provide a title.')
      return
    }

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const maxOrder = works
      .filter((w) => w.categoryId === categoryId)
      .reduce((max, w) => Math.max(max, w.order || 0), 0)

    const finalImage = image.trim() || '/images/xp.png'

    const created = addWork({
      title: title.trim(),
      slug: slug || `work-${Date.now()}`,
      categoryId,
      year: String(new Date().getFullYear()),
      description: description.trim(),
      coverImage: finalImage,
      gallery: [{ image: finalImage, title: title.trim() }],
      tools: ['Studio Creative'],
      client: 'Self-initiated',
      projectType: 'Illustration & Design',
      externalUrl: '',
      content: `## ${title.trim()}\n\n${description.trim() || 'A fresh visual drop by TOBI XP.'}`,
      featured: false,
      status: 'published',
      order: maxOrder + 1,
    })

    onSuccess(created.id)
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-quickpost-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-quickpost-header">
          <div>
            <h2 className="admin-quickpost-title">QUICK POST</h2>
            <p className="admin-quickpost-sub">
              GET SOMETHING UP WITHOUT BUILDING THE WHOLE CASE STUDY.
            </p>
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-quickpost-form">
          {/* IMAGE */}
          <div className="admin-form-group">
            <label className="admin-label">IMAGE</label>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileUpload}
            />

            {image ? (
              <div className="admin-quickpost-img-preview" onClick={() => fileInputRef.current?.click()}>
                <img src={image} alt="Preview" />
                <span className="admin-quickpost-change-badge">Change</span>
              </div>
            ) : (
              <div
                className="admin-drop-zone admin-quickpost-drop"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="admin-drop-icon">
                  <Upload size={22} />
                </div>
                <span className="admin-drop-title">DROP IMAGE OR CLICK TO BROWSE</span>
              </div>
            )}
          </div>

          {/* TITLE */}
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="qp-title">
              TITLE
            </label>
            <input
              id="qp-title"
              type="text"
              className="admin-input"
              placeholder="e.g. Neo Tokyo Concept 04"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* CATEGORY */}
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="qp-category">
              CATEGORY
            </label>
            <select
              id="qp-category"
              className="admin-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c: Category) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* SHORT DESCRIPTION */}
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="qp-desc">
              SHORT DESCRIPTION
            </label>
            <textarea
              id="qp-desc"
              className="admin-textarea"
              rows={2}
              placeholder="Quick one-line context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* PUBLISH WORK */}
          <button
            type="submit"
            className="admin-btn-primary admin-quickpost-submit"
            disabled={isUploading}
          >
            {isUploading ? 'UPLOADING ASSET...' : 'PUBLISH WORK'}
          </button>
        </form>
      </div>
    </div>
  )
}
