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

let made = 0
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).replace(EXT, '.webp')
  const dest = path.join(OUT, rel)
  if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(file).mtimeMs) continue
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  await sharp(file, { limitInputPixels: false })
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(dest)
  made++
}
console.log(`[Thumbs] ${made} thumbnail(s) generated in public/images/works-thumbs`)
