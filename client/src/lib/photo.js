// The site's own dish photos ship in two sizes: name.webp (large) and name-sm.webp (480px wide).
const OWN = /^\/images\/dishes\/[\w-]+\.webp$/

/**
 * <img> props for a photo: the small file for thumbnails, and a srcset so the browser
 * only downloads the large file when the image is shown big. Other links (photos added
 * by restaurant owners) are used as they are.
 */
export function photo(src, sizes = '100vw') {
  if (!OWN.test(src || '')) return { src }
  const small = src.replace(/\.webp$/, '-sm.webp')
  return { src: small, srcSet: `${small} 480w, ${src} 1400w`, sizes }
}

/** Just the small file (for thumbnails of 112px or less). */
export function thumb(src) {
  return OWN.test(src || '') ? src.replace(/\.webp$/, '-sm.webp') : src
}
