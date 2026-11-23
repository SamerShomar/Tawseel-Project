import Lenis from 'lenis'
import { useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

let lenisInstance = null

/** Scrolls to the top instantly (used on page change). */
export const scrollToTop = () => (lenisInstance ? lenisInstance.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0))

/** Freezes page scrolling (e.g. while the full-screen menu is open). */
export function setScrollLocked(locked) {
  document.documentElement.style.overflow = locked ? 'hidden' : ''
  if (lenisInstance) locked ? lenisInstance.stop() : lenisInstance.start()
}

/** Smooth scrolling with Lenis, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function useLenis() {
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
