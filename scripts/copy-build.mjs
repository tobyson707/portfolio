import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const distDir = path.join(root, 'dist')
const buildDir = path.join(root, 'build')

if (fs.existsSync(distDir)) {
  fs.cpSync(distDir, buildDir, { recursive: true })
  console.log('[Build Sync] Successfully mirrored dist/ to build/ directory.')
}
