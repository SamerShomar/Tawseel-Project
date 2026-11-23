import { useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

/**
 * Makes the direct children of an element rise and fade in, a few at a time, as they scroll into view.
 * Works on any element (ul, tbody, div). Children that already appeared are left alone,
 * so reloading a list doesn't replay the whole thing. Does nothing when the device asks to reduce motion.
 *
 *   const ref = useReveal([items.length])
 *   <ul ref={ref}>…</ul>
 */
export function useReveal(deps = []) {
  const ref = useRef(null)
  const shown = useRef(new WeakSet()) // children that have finished appearing

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const fresh = [...el.children].filter((c) => !shown.current.has(c))
    if (!fresh.length) return

    gsap.set(fresh, { opacity: 0, y: 28 })
    const triggers = ScrollTrigger.batch(fresh, {
      start: 'top 96%',
      once: true,
      onEnter: (batch) => {
        batch.forEach((c) => shown.current.add(c))
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'expo.out', overwrite: true })
      },
    })

    // On re-run or unmount: stop watching, and make anything still hidden visible again
    // (the next run hides it again if it is still waiting to appear).
    return () => {
      triggers.forEach((t) => t.kill())
      fresh.filter((c) => !shown.current.has(c)).forEach((c) => gsap.set(c, { clearProps: 'opacity,transform' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
