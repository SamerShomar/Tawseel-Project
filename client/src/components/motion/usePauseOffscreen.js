import { useEffect } from 'react'

/**
 * Pauses the endless CSS animations inside an element while it is off screen (see `[data-offscreen]` in
 * index.css). Nothing changes on screen: they pick up where they were as soon as the element is back in view,
 * but in the meantime the browser stops redrawing them on every frame of the scroll.
 */
export function usePauseOffscreen(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) delete el.dataset.offscreen
      else el.dataset.offscreen = ''
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
}
