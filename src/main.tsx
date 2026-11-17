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

// Temporary diagnostics for the iPhone reload: ?noblur=1 turns off blur and
// GPU-layer CSS effects across the site
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('noblur') === '1') {
  const style = document.createElement('style')
  style.textContent =
    '*,*::before,*::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;filter:none!important;will-change:auto!important}'
  document.head.appendChild(style)
}

createRoot(document.getElementById('root')!).render(<App />)
