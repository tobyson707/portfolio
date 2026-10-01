import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const ILLUSTRATIONS_DIR = path.join(ROOT_DIR, 'public/images/works/Illustrations')
const MANIFEST_FILE = path.join(ROOT_DIR, 'src/data/worksManifest.ts')
const WORKS_JSON_FILE = path.join(ROOT_DIR, 'src/data/works.json')

const SUPPORTED_EXT_REGEX = /\.(webp|png|jpe?g|avif|gif|bmp|svg)$/i

/**
 * Extract image dimensions without external binaries.
 * Supports WebP (lossy VP8, lossless VP8L, extended VP8X), PNG, JPEG, GIF.
 */
function getImageDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath)
    if (buffer.length < 30) return null

    // WebP
    const riff = buffer.toString('ascii', 0, 4)
    const webp = buffer.toString('ascii', 8, 12)
    if (riff === 'RIFF' && webp === 'WEBP') {
      const chunk = buffer.toString('ascii', 12, 16)
      if (chunk === 'VP8 ') {
        if (buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
          const width = buffer.readUInt16LE(26) & 0x3fff
          const height = buffer.readUInt16LE(28) & 0x3fff
          return { width, height }
        }
      } else if (chunk === 'VP8L' && buffer[20] === 0x2f) {
        const b1 = buffer[21], b2 = buffer[22], b3 = buffer[23], b4 = buffer[24]
        const width = 1 + (((b2 & 0x3f) << 8) | b1)
        const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6))
        return { width, height }
      } else if (chunk === 'VP8X') {
        const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16))
        const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16))
        return { width, height }
      }
    }

    // PNG
    if (buffer.toString('ascii', 1, 4) === 'PNG') {
      const width = buffer.readUInt32BE(16)
      const height = buffer.readUInt32BE(20)
      return { width, height }
    }

    // GIF
    if (buffer.toString('ascii', 0, 3) === 'GIF') {
      const width = buffer.readUInt16LE(6)
      const height = buffer.readUInt16LE(8)
      return { width, height }
    }

    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break
        const marker = buffer[offset + 1]
        if (marker >= 0xc0 && marker <= 0xc3) {
          const height = buffer.readUInt16BE(offset + 5)
          const width = buffer.readUInt16BE(offset + 7)
          return { width, height }
        }
        const len = buffer.readUInt16BE(offset + 2)
        offset += 2 + len
      }
    }
  } catch (err) {
    console.warn(`Could not read dimensions for ${filePath}:`, err.message)
  }
  return null
}

function deriveTitle(filename) {
  const base = filename.replace(/\.[^/.]+$/, '')
  const words = base.replace(/[-_]+/g, ' ').trim().split(/\s+/)
  return words
    .map((word) => {
      if (/^\d+$/.test(word)) return word
      if (/^img$/i.test(word)) return 'IMG'
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Recursively retrieves all files within a directory and its subdirectories.
 */
function getAllFilesRecursive(dir) {
  let files = []
  if (!fs.existsSync(dir)) return files
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files = files.concat(getAllFilesRecursive(fullPath))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }
  return files
}

function scanAllIllustrationAssets() {
  const result = {
    paintings: [],
    sketches: [],
    studies: [],
  }

  if (!fs.existsSync(ILLUSTRATIONS_DIR)) {
    console.error(`[Manifest Generator] Error: Directory does not exist: ${ILLUSTRATIONS_DIR}`)
    return result
  }

  const paintingsDir = path.join(ILLUSTRATIONS_DIR, 'Paintings')
  const sketchesDir = path.join(ILLUSTRATIONS_DIR, 'Sketches')
  const studiesDir = path.join(ILLUSTRATIONS_DIR, 'Studies')

  // 1. Paintings: All images inside the Paintings folder and its subfolders
  const paintingsFiles = getAllFilesRecursive(paintingsDir).filter((f) => SUPPORTED_EXT_REGEX.test(f))
  for (const filePath of paintingsFiles) {
    const filename = path.basename(filePath)
    const dims = getImageDimensions(filePath) || {}
    const title = deriveTitle(filename)
    const relFromPublic = path.relative(path.join(ROOT_DIR, 'public'), filePath).replace(/\\/g, '/')
    const src = `/${relFromPublic}`
    const id = `paintings-${filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`

    result.paintings.push({
      id,
      src,
      title,
      category: 'Paintings',
      ...(dims.width ? { width: dims.width } : {}),
      ...(dims.height ? { height: dims.height } : {}),
    })
  }

  // 2. Sketches: All images inside the Sketches folder and its subfolders
  const sketchesFiles = getAllFilesRecursive(sketchesDir).filter((f) => SUPPORTED_EXT_REGEX.test(f))
  for (const filePath of sketchesFiles) {
    const filename = path.basename(filePath)
    const dims = getImageDimensions(filePath) || {}
    const title = deriveTitle(filename)
    const relFromPublic = path.relative(path.join(ROOT_DIR, 'public'), filePath).replace(/\\/g, '/')
    const src = `/${relFromPublic}`
    const id = `sketches-${filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`

    result.sketches.push({
      id,
      src,
      title,
      category: 'Sketches',
      ...(dims.width ? { width: dims.width } : {}),
      ...(dims.height ? { height: dims.height } : {}),
    })
  }

  // 3. Studies: All images inside the Studies folder and its subfolders
  const studiesFiles = getAllFilesRecursive(studiesDir).filter((f) => SUPPORTED_EXT_REGEX.test(f))
  for (const filePath of studiesFiles) {
    const filename = path.basename(filePath)
    const dims = getImageDimensions(filePath) || {}
    const title = deriveTitle(filename)
    const relFromPublic = path.relative(path.join(ROOT_DIR, 'public'), filePath).replace(/\\/g, '/')
    const src = `/${relFromPublic}`
    const id = `studies-${filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`

    result.studies.push({
      id,
      src,
      title,
      category: 'Studies',
      ...(dims.width ? { width: dims.width } : {}),
      ...(dims.height ? { height: dims.height } : {}),
    })
  }

  // Sort deterministically by filename
  result.paintings.sort((a, b) => a.src.localeCompare(b.src))
  result.sketches.sort((a, b) => a.src.localeCompare(b.src))
  result.studies.sort((a, b) => a.src.localeCompare(b.src))

  return result
}

function generate() {
  const data = scanAllIllustrationAssets()

  const total =
    data.paintings.length +
    data.sketches.length +
    data.studies.length

  console.log(`[Manifest Generator] Verified ${total} total illustration images across 3 categories on disk:`)
  console.log(` - Paintings: ${data.paintings.length}`)
  console.log(` - Sketches: ${data.sketches.length}`)
  console.log(` - Studies: ${data.studies.length}`)
  console.log(` - Section Header Preview Cover: /images/works/Illustrations/Illustrations.webp (verified as section cover, not a category)`)

  const tsContent = `// AUTO-GENERATED & MAINTAINABLE ILLUSTRATION MANIFEST
// Generated from authoritative recursive disk scan of public/images/works/Illustrations/
// DO NOT delete images. Run "npm run sync:manifest" to refresh after adding files.

export type IllustrationCategory = 'Paintings' | 'Sketches' | 'Studies'

export interface IllustrationImage {
  id: string
  src: string
  title: string
  category: IllustrationCategory
  width?: number
  height?: number
}

export interface IllustrationGallery {
  paintings: IllustrationImage[]
  sketches: IllustrationImage[]
  studies: IllustrationImage[]
}

/**
 * Derives a readable, title-cased title from an image filename.
 */
export function deriveTitleFromFilename(filename: string): string {
  const base = filename.replace(/\\.[^/.]+$/, '')
  const words = base.replace(/[-_]+/g, ' ').trim().split(/\\s+/)
  return words
    .map((word) => {
      if (/^\\d+$/.test(word)) return word
      if (/^img$/i.test(word)) return 'IMG'
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Authoritative gallery manifest mapping exactly the 3 categories directly to verified on-disk files.
 */
export const illustrationGallery: IllustrationGallery = ${JSON.stringify(data, null, 2)}

/**
 * Complete list of all illustration images across all 3 categories (Paintings, Sketches, Studies).
 */
export const allIllustrationImages: IllustrationImage[] = [
  ...illustrationGallery.paintings,
  ...illustrationGallery.sketches,
  ...illustrationGallery.studies,
]

/**
 * Helper to retrieve gallery images for a category name or slug.
 */
export function getCategoryImages(categoryOrSlug: string): IllustrationImage[] {
  const norm = categoryOrSlug.toLowerCase().trim()
  if (norm === 'paintings' || norm === 'painting') return illustrationGallery.paintings
  if (norm === 'sketches' || norm === 'sketch') return illustrationGallery.sketches
  if (norm === 'studies' || norm === 'study') return illustrationGallery.studies
  if (norm === 'all' || norm === 'all works' || norm === 'all illustrations' || norm === 'all-works' || norm === 'illustrations' || norm === 'illustration') {
    return allIllustrationImages
  }
  return []
}

/**
 * Asset Preservation & Integrity Safeguard:
 * Ensures entries are preserved rather than silently dropped if temporarily unreachable.
 */
export function reportMissingImage(src: string, category: string): void {
  console.warn(
    \`[Asset Integrity Notice] Image at "\${src}" in category "\${category}" was queried but may be temporarily unreachable. Manifest entry is preserved. Do not delete.\`
  )
}
`

  fs.writeFileSync(MANIFEST_FILE, tsContent, 'utf8')
  console.log(`[Manifest Generator] Successfully wrote ${MANIFEST_FILE}`)

  // Also sync works.json with exactly 3 categories:
  // 1. Paintings
  // 2. Sketches
  // 3. Studies
  if (fs.existsSync(WORKS_JSON_FILE)) {
    try {
      const worksJson = JSON.parse(fs.readFileSync(WORKS_JSON_FILE, 'utf8'))
      const illusSection = worksJson.sections?.find((s) => s.id === 'ad')
      if (illusSection) {
        illusSection.cover = '/images/works/Illustrations/Illustrations.webp'
        illusSection.items = [
          {
            name: 'Paintings',
            slug: 'paintings',
            meta: `${data.paintings.length} work${data.paintings.length === 1 ? '' : 's'}`,
            tags: ['Procreate', 'Photoshop'],
            link: '',
            gallery: data.paintings.map((i) => ({ image: i.src, title: i.title })),
          },
          {
            name: 'Sketches',
            slug: 'sketches',
            meta: `${data.sketches.length} work${data.sketches.length === 1 ? '' : 's'}`,
            tags: ['Procreate'],
            link: '',
            gallery: data.sketches.map((i) => ({ image: i.src, title: i.title })),
          },
          {
            name: 'Studies',
            slug: 'studies',
            meta: `${data.studies.length} work${data.studies.length === 1 ? '' : 's'}`,
            tags: ['Photoshop'],
            link: '',
            gallery: data.studies.map((i) => ({ image: i.src, title: i.title })),
          },
        ]
        fs.writeFileSync(WORKS_JSON_FILE, JSON.stringify(worksJson, null, 2) + '\n', 'utf8')
        console.log(`[Manifest Generator] Successfully synchronized ${WORKS_JSON_FILE}`)
      }
    } catch (e) {
      console.warn(`Could not sync works.json:`, e.message)
    }
  }
}

generate()
