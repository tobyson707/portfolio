// Builds small gallery thumbnails so mobile Safari doesn't decode full-size
// artwork (3000–5000px) for every grid tile, which exhausts tab memory and
// makes iOS silently reload the page.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, 'public/images/works')
const OUT = path.join(root, 'public/images/works-thumbs')
const MAX = 900
const EXT = /\.(webp|png|jpe?g|avif)$/i

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : EXT.test(e.name) ? [p] : []
  })
}

// STURVS canvas artwork (public/assets) includes files up to 8600px wide —
// over 1 GB once decoded — which crashes iPhone Safari. Make two capped sizes:
// one for the canvas cards and a larger one for the focused view.
const ASSETS = path.join(root, 'public/assets')
const ASSETS_OUT = path.join(root, 'public/assets-sized')
const JOBS = [
  { src: SRC, out: OUT, max: MAX, quality: 78 },
  { src: ASSETS, out: path.join(ASSETS_OUT, 'canvas'), max: 1200, quality: 82 },
  { src: ASSETS, out: path.join(ASSETS_OUT, 'focus'), max: 2400, quality: 85 },
]

let made = 0
for (const job of JOBS) {
  for (const file of walk(job.src)) {
    const rel = path.relative(job.src, file).replace(EXT, '.webp')
    const dest = path.join(job.out, rel)
    if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(file).mtimeMs) continue
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    await sharp(file, { limitInputPixels: false })
      .resize({ width: job.max, height: job.max, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: job.quality })
      .toFile(dest)
    made++
  }
}
console.log(`[Thumbs] ${made} resized image(s) generated`)
