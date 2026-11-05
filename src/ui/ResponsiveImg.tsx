import { forwardRef, useState, type ImgHTMLAttributes } from 'react'
import { getResponsiveImage, type ResponsiveImageOptions } from '../utils/responsiveImage'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> &
  ResponsiveImageOptions & {
    /** Original (full-resolution) image path, as stored in the manifests. */
    src: string
  }

function originalUrl(value: string): string {
  try {
    return encodeURI(decodeURI(value))
  } catch {
    return encodeURI(value)
  }
}

/**
 * <img> that serves memory-safe downscaled variants via srcSet.
 * If a variant fails to load it retries once with the original file before reporting an error,
 * so a missing generated variant can never hide an artwork.
 */
const ResponsiveImg = forwardRef<HTMLImageElement, Props>(function ResponsiveImg(
  { src, maxWidth, sizes, includeOriginal, onError, ...rest },
  ref
) {
  const [failedVariant, setFailedVariant] = useState(false)
  const original = originalUrl(src)
  const responsive = getResponsiveImage(src, { maxWidth, sizes, includeOriginal })
  const usesVariant = !failedVariant && (Boolean(responsive.srcSet) || responsive.src !== original)

  return (
    <img
      ref={ref}
      {...rest}
      src={usesVariant ? responsive.src : original}
      srcSet={usesVariant ? responsive.srcSet : undefined}
      sizes={usesVariant ? responsive.sizes : undefined}
      onError={(e) => {
        if (usesVariant) {
          console.warn(`[TOBI XP] Responsive variant failed for "${src}", falling back to the original.`)
          setFailedVariant(true)
          return
        }
        onError?.(e)
      }}
    />
  )
})

export default ResponsiveImg
