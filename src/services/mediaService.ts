import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useContentStore, type MediaItem } from './contentStore'
import { handleFirestoreError, OperationType } from './firestoreSync'

export interface RegisterAssetPayload {
  name: string
  publicPath: string
  type?: MediaItem['type']
  altText?: string
  categoryId?: string
  workGroupId?: string
  disciplineIds?: string[]
  workId?: string
  width?: number
  height?: number
  size?: string
  tools?: string[]
  status?: 'published' | 'hidden' | 'archived'
}

/**
 * Format raw bytes into human readable file size
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Validates whether a public asset path is well-formed
 */
export function validatePublicAssetPath(pathStr: string): { valid: boolean; error?: string; mediaType: MediaItem['type'] } {
  if (!pathStr || !pathStr.trim()) {
    return { valid: false, error: 'Asset path is required.', mediaType: 'other' }
  }

  const clean = pathStr.trim()
  if (!clean.startsWith('/')) {
    return { valid: false, error: 'Public asset path must start with "/" (e.g. /images/works/my-art.webp)', mediaType: 'other' }
  }

  const ext = clean.split('.').pop()?.toLowerCase() || ''
  let mediaType: MediaItem['type'] = 'other'

  if (['webp', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'avif'].includes(ext)) {
    mediaType = 'image'
  } else if (['mp4', 'webm', 'mov', 'ogg'].includes(ext)) {
    mediaType = 'video'
  } else if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) {
    mediaType = 'audio'
  } else if (['glb', 'gltf'].includes(ext)) {
    mediaType = '3d'
  }

  return { valid: true, mediaType }
}

/**
 * Register a static WebP / public asset in the Firestore Media catalog
 */
export async function registerStaticAsset(payload: RegisterAssetPayload): Promise<MediaItem> {
  const validation = validatePublicAssetPath(payload.publicPath)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const filename = payload.publicPath.split('/').pop() || 'asset.webp'
  const cleanId = `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  const newAsset: MediaItem = {
    id: cleanId,
    name: payload.name.trim() || filename,
    filename,
    url: payload.publicPath.trim(),
    optimizedUrl: payload.publicPath.trim(),
    thumbnailUrl: payload.publicPath.trim(),
    type: payload.type || validation.mediaType,
    mediaType: payload.type || validation.mediaType,
    width: payload.width,
    height: payload.height,
    size: payload.size || 'Optimized WebP',
    categoryId: payload.categoryId || undefined,
    workGroupId: payload.workGroupId || undefined,
    disciplineIds: payload.disciplineIds || [],
    workId: payload.workId || undefined,
    status: payload.status || 'published',
    visibility: payload.status || 'published',
    source: 'public-directory',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Update in local Zustand store
  useContentStore.getState().addMedia(newAsset)

  // Save to Firestore
  try {
    await setDoc(doc(db, 'media', newAsset.id), newAsset)
  } catch (err) {
    console.error('[Asset Registry] Firestore save error:', err)
    handleFirestoreError(err, OperationType.WRITE, `media/${newAsset.id}`)
  }

  return newAsset
}

/**
 * Update asset metadata in Firestore
 */
export async function updateStaticAsset(id: string, updates: Partial<MediaItem>): Promise<void> {
  useContentStore.getState().updateMedia(id, updates)
  try {
    await setDoc(doc(db, 'media', id), updates, { merge: true })
  } catch (err) {
    console.error('[Asset Registry] Firestore update error:', err)
    handleFirestoreError(err, OperationType.UPDATE, `media/${id}`)
  }
}

/**
 * Delete an asset reference from the Firestore Media catalog
 */
export async function deleteStaticAsset(idOrAsset: string | MediaItem): Promise<void> {
  const id = typeof idOrAsset === 'string' ? idOrAsset : idOrAsset.id
  useContentStore.getState().deleteMedia(id)
  try {
    await deleteDoc(doc(db, 'media', id))
  } catch (err) {
    console.error('[Asset Registry] Firestore delete error:', err)
    handleFirestoreError(err, OperationType.DELETE, `media/${id}`)
  }
}

/**
 * Backward compatibility alias for deleting an asset
 */
export const deleteMediaAsset = deleteStaticAsset

/**
 * Validates a media file
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string; mediaType: MediaItem['type'] } {
  if (!file) return { valid: false, error: 'No file provided', mediaType: 'other' }
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  let mediaType: MediaItem['type'] = 'other'

  if (['webp', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'avif'].includes(ext)) {
    mediaType = 'image'
  } else if (['mp4', 'webm', 'mov', 'ogg'].includes(ext)) {
    mediaType = 'video'
  } else if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) {
    mediaType = 'audio'
  } else if (['glb', 'gltf'].includes(ext)) {
    mediaType = '3d'
  }
  return { valid: true, mediaType }
}

/**
 * Backward-compatible helper for uploading or registering a media file
 */
export async function uploadMediaFile(
  file: File | Blob,
  options?: {
    categoryId?: string
    workGroupId?: string
    source?: string
    onProgress?: (percent: number, status: string) => void
  }
): Promise<MediaItem> {
  const filename = (file as File).name || 'asset.webp'
  const path = `/images/works/${filename}`
  if (options?.onProgress) {
    options.onProgress(50, 'Registering public asset...')
  }
  const asset = await registerStaticAsset({
    name: filename.replace(/\.[^/.]+$/, ''),
    publicPath: path,
    size: formatFileSize((file as File).size),
  })
  if (options?.onProgress) {
    options.onProgress(100, 'Registered')
  }
  return asset
}

/**
 * Scan work references to compute live asset usage
 */
export function calculateAssetUsage(asset: MediaItem): { isUsed: boolean; referencedWorks: string[]; referencedCategories: string[] } {
  const store = useContentStore.getState()
  const works = store.works
  const categories = store.categories

  const referencedWorks = works
    .filter((w) => {
      if (w.coverImage === asset.url || (w as any).imagePath === asset.url) return true
      return w.gallery?.some((g) => g.image === asset.url)
    })
    .map((w) => w.title)

  const referencedCategories = categories
    .filter((c) => c.cover === asset.url || c.imageUrl === asset.url)
    .map((c) => c.name)

  const isUsed = referencedWorks.length > 0 || referencedCategories.length > 0

  return { isUsed, referencedWorks, referencedCategories }
}


