import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../lib/firebase'

export interface AudioUploadResult {
  url: string
  storagePath: string
  fileName: string
  size: number
  mimeType: string
  duration: number
}

const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/vorbis',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/webm',
]

const MAX_AUDIO_SIZE_BYTES = 30 * 1024 * 1024 // 30 MB

/**
 * Validates audio file type and size
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const isAudioType =
    file.type.startsWith('audio/') ||
    SUPPORTED_AUDIO_TYPES.includes(file.type.toLowerCase()) ||
    /\.(mp3|wav|ogg|m4a|aac|webm)$/i.test(file.name)

  if (!isAudioType) {
    return {
      valid: false,
      error: 'Unsupported audio format. Please upload an MP3, WAV, OGG, or M4A file.',
    }
  }

  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 30 MB.`,
    }
  }

  return { valid: true }
}

/**
 * Calculates duration of an audio file using HTML5 Audio
 */
export function getAudioFileDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file)
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.onloadedmetadata = () => {
        const dur = Math.round(audio.duration) || 0
        URL.revokeObjectURL(url)
        resolve(dur)
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(0)
      }
      audio.src = url
    } catch {
      resolve(0)
    }
  })
}

/**
 * Formats duration in seconds to MM:SS string
 */
export function formatAudioDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * Formats byte size to human readable string (e.g. 4.8 MB)
 */
export function formatAudioSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 MB'
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Uploads an audio file to Firebase Storage with progress tracking
 */
export async function uploadAudioToStorage(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<AudioUploadResult> {
  const validation = validateAudioFile(file)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid audio file')
  }

  const duration = await getAudioFileDuration(file)
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `audio/background/${Date.now()}_${cleanName}`

  try {
    const storageRef = ref(storage, storagePath)
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || 'audio/mpeg',
    })

    const downloadUrl = await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            onProgress?.(Math.min(99, Math.round(progress)))
          }
        },
        (error) => {
          console.warn('[Firebase Storage] Upload error:', error)
          reject(error)
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref)
            onProgress?.(100)
            resolve(url)
          } catch (e) {
            reject(e)
          }
        }
      )
    })

    return {
      url: downloadUrl,
      storagePath,
      fileName: file.name,
      size: file.size,
      mimeType: file.type || 'audio/mpeg',
      duration,
    }
  } catch (error: any) {
    console.error('[Firebase Storage] Audio upload failed:', error)
    throw new Error(`Audio upload failed: ${error?.message || error}`, { cause: error })
  }
}

/**
 * Removes an audio file from Firebase Storage
 */
export async function deleteAudioFromStorage(storagePath: string): Promise<void> {
  if (!storagePath || storagePath.startsWith('local_')) return
  try {
    const storageRef = ref(storage, storagePath)
    await deleteObject(storageRef)
  } catch (error) {
    console.warn('[Firebase Storage] Error deleting audio file:', error)
  }
}
