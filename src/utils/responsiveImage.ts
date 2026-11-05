/**
 * Responsive image helper for the Works galleries.
 *
 * The gallery originals are very large (up to ~8600px / ~70 MP). Browsers decode an <img> at its
 * intrinsic resolution no matter how small it is drawn, so loading originals into thumbnail grids
 * exhausted mobile memory and made the browser kill and reload the tab.
 *
 * scripts/generate-responsive-images.mjs writes downscaled variants to /_responsive/w<width>/...
 * and a manifest of what exists. This helper builds src/srcSet from that manifest. When the manifest
 * (or an entry) is missing it falls back to the original file, so the site keeps working unchanged.
 */

type ManifestEntry = { w: number; h: number; v: number[] }

// Eager glob instead of a static import: resolves to {} when the generated manifest is absent,
// so a missing generation step degrades to original images instead of breaking the build.
const manifestModules = import.meta.glob<{ default: Record<string, ManifestEntry> }>(
  '../data/responsiveManifest.json',
  { eager: true }
)
const MANIFEST: Record<string, ManifestEntry> = Object.values(manifestModules)[0]?.default ?? {}

export interface ResponsiveImageOptions {
  /** Largest candidate width (in physical pixels) to offer. Use to cap memory on mobile. */
  maxWidth?: number
  /** `sizes` attribute describing the rendered CSS width. */
  sizes?: string
  /** Whether the full-resolution original may be offered as the largest candidate. */
  includeOriginal?: boolean
}

export interface ResponsiveImageProps {
  src: string
  srcSet?: string
  sizes?: string
  width?: number
  height?: number
}

function normalizeKey(src: string): string {
  let path = src
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname
  } catch {
    // Not a parseable absolute URL: treat it as a path below.
  }
  try {
    path = decodeURI(path)
  } catch {
    // Malformed escape sequence: use the raw value as the lookup key.
  }
  return path.startsWith('/') ? path : `/${path}`
}

const variantUrl = (key: string, width: number) =>
  encodeURI(`/_responsive/w${width}${key.replace(/\.(webp|png|jpe?g)$/i, '.webp')}`)

/** Returns intrinsic dimensions for a gallery image if known (used to reserve layout space). */
export function getImageDimensions(src: string): { width: number; height: number } | null {
  const entry = MANIFEST[normalizeKey(src)]
  return entry ? { width: entry.w, height: entry.h } : null
}

export function getResponsiveImage(src: string, options: ResponsiveImageOptions = {}): ResponsiveImageProps {
  const { maxWidth = Infinity, sizes, includeOriginal = true } = options
  const key = normalizeKey(src)
  const original = encodeURI(key)
  const entry = MANIFEST[key]
  if (!entry) return { src: original }

  const candidates: Array<{ url: string; w: number }> = entry.v
    .filter((w) => w <= maxWidth)
    .map((w) => ({ url: variantUrl(key, w), w }))

  if (includeOriginal && entry.w <= maxWidth) {
    candidates.push({ url: original, w: entry.w })
  }

  // maxWidth is below every variant: use the smallest variant so memory stays bounded.
  if (candidates.length === 0) {
    const smallest = entry.v[0]
    return { src: variantUrl(key, smallest), width: entry.w, height: entry.h }
  }

  const largest = candidates[candidates.length - 1]
  return {
    src: largest.url,
    srcSet: candidates.map((c) => `${c.url} ${c.w}w`).join(', '),
    sizes,
    width: entry.w,
    height: entry.h,
  }
}
