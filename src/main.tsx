// Ensure Three.js GLTFLoader uses standard TextureLoader instead of ImageBitmapLoader.
// This prevents browser decoding errors on WebP texture blobs (e.g. "Couldn't load texture blob:...")
// caused by ImageBitmapLoader's colorSpaceConversion:'none' option and fetch credential checks on blob URLs.
if (typeof window !== 'undefined') {
  try {
    ;(window as any).createImageBitmap = undefined
  } catch {
    // Ignore in non-configurable environments
  }
}

import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(<App />)
