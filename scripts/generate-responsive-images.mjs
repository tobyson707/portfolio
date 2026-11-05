/**
 * Generates downscaled display variants for the large gallery images used in the Works section.
 *
 * Why: several originals are 3000–8600px wide (up to ~70 MP). Browsers decode an <img> at its
 * intrinsic size regardless of how small it is displayed, so loading the originals into thumbnail
 * grids exhausted mobile memory and caused the browser to kill and reload the tab.
 *
 * Originals are NEVER modified. Variants are written to public/_responsive/w<width>/<original path>
 * (always .webp), and src/data/responsiveManifest.json records which widths exist for each source
 * so the app only ever references files that were generated (it falls back to the original otherwise).
 *
 * Incremental: a variant is only (re)built when missing or older than its source.
 * Usage: node scripts/generate-responsive-images.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const MANIFEST = path.join(ROOT, 'src/data/responsiveManifest.json')

// Directories (relative to public/) whose images are shown in Works galleries / viewers
const SOURCE_DIRS = ['images/works', 'assets', 'case-studies']
const WIDTHS = [640, 960, 1600, 2400]
const QUALITY = 80
const IMAGE_RE = /\.(webp|png|jpe?g)$/i

let sharp
try {
  sharp = (await import('sharp')).default
} catch (err) {
  console.error('[responsive-images] sharp is not available; cannot generate variants.', err?.message)
  process.exit(1)
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walk(full, out)
    else if (IMAGE_RE.test(name)) out.push(full)
  }
  return out
}

const variantRel = (rel, w) => path.posix.join('_responsive', `w${w}`, rel.replace(IMAGE_RE, '.webp'))

const manifest = {}
let built = 0
let reused = 0
let bytes = 0

for (const dir of SOURCE_DIRS) {
  for (const file of walk(path.join(PUBLIC, dir))) {
    const rel = path.relative(PUBLIC, file).split(path.sep).join('/')
    const srcStat = fs.statSync(file)
    let meta
    try {
      meta = await sharp(file).metadata()
    } catch (err) {
      console.warn(`[responsive-images] skipping unreadable image ${rel}: ${err.message}`)
      continue
    }
    // Account for EXIF rotation so width/height match what the browser displays
    const rotated = (meta.orientation ?? 1) >= 5
    const width = rotated ? meta.height : meta.width
    const height = rotated ? meta.width : meta.height
    const widths = WIDTHS.filter((w) => w < width)
    if (widths.length === 0) continue

    for (const w of widths) {
      const outFile = path.join(PUBLIC, variantRel(rel, w))
      if (fs.existsSync(outFile) && fs.statSync(outFile).mtimeMs >= srcStat.mtimeMs) {
        reused++
      } else {
        fs.mkdirSync(path.dirname(outFile), { recursive: true })
        await sharp(file, { limitInputPixels: false })
          .rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toFile(outFile)
        built++
      }
      bytes += fs.statSync(outFile).size
    }
    manifest['/' + rel] = { w: width, h: height, v: widths }
  }
}

const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]))
fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 0) + '\n')
console.log(
  `[responsive-images] ${Object.keys(sorted).length} sources, ${built} built, ${reused} up to date, ` +
    `${(bytes / 1e6).toFixed(1)} MB of variants`
)
