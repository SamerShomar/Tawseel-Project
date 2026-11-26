import Lenis from 'lenis'
import { useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

let lenisInstance = null

/** Scrolls to the top instantly (used on page change). */
export const scrollToTop = () => (lenisInstance ? lenisInstance.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0))

/**
 * Smoothly scrolls to an element, leaving `offset` pixels above it (e.g. for a sticky bar).
 * The position is worked out here: given an element, Lenis would also add its CSS scroll-margin, doubling the gap.
 */
export const scrollToElement = (el, offset = 0) => {
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  if (lenisInstance) lenisInstance.scrollTo(top)
  else window.scrollTo({ top, behavior: 'smooth' })
}

/** Smoothly scrolls to a page position in pixels. */
export const scrollToPosition = (y) => (lenisInstance ? lenisInstance.scrollTo(y) : window.scrollTo({ top: y, behavior: 'smooth' }))

/** Freezes page scrolling (e.g. while the full-screen menu is open). */
export function setScrollLocked(locked) {
  document.documentElement.style.overflow = locked ? 'hidden' : ''
  if (lenisInstance) locked ? lenisInstance.stop() : lenisInstance.start()
}

/** Smooth scrolling with Lenis, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function useLenis() {
  // Scroll animations measure positions once; when the page grows or shrinks (a list loads, a filter changes),
  // measure again so they still start at the right place.
  useEffect(() => {
    let timer
    const observer = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(() => ScrollTrigger.refresh(), 150)
    })
    observer.observe(document.body)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({ autoRaf: false })
    lenisInstance = lenis
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisInstance = null
    }
  }, [])
}
