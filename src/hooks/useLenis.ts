import Lenis from 'lenis'
import { useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

/** Smooth scrolling with Lenis, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])
}
