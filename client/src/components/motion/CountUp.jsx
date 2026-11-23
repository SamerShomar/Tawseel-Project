import { useLayoutEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'

/**
 * Shows a number that counts up from 0 the first time it appears.
 * `format` turns the number into text (e.g. a price). With "Reduce Motion" the final value shows at once.
 */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString('en'), duration = 1.2 }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = format(value)
      return
    }
    const counter = { n: 0 }
    const tween = gsap.to(counter, {
      n: value,
      duration,
      ease: 'expo.out',
      onUpdate: () => (el.textContent = format(counter.n)),
    })
    return () => tween.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // The final value is rendered first, so it is correct for screen readers and if JavaScript animation fails.
  return <span ref={ref}>{format(value)}</span>
}
