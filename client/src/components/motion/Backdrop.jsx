import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * The site's background: large, soft color fields that drift slowly and shift as you scroll.
 * Everything translucent (cards, bars, menus) shows these colors through it, which is what makes the glass visible.
 */
export function Backdrop() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Scrolling the page slides the color fields at different speeds (depth).
        gsap.to('.backdrop-a', { yPercent: -25, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1 } })
        gsap.to('.backdrop-b', { yPercent: 20, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1 } })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  const field = 'absolute rounded-full blur-[90px] will-change-transform'
  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-stone-50" aria-hidden>
      <div className="backdrop-a absolute inset-0">
        <div className={`${field} animate-drift -top-[15%] -start-[25%] size-[75vmax] bg-[#ffb185]/55`} />
        <div className={`${field} animate-drift top-[45%] -start-[20%] size-[55vmax] bg-[#d9c8ff]/45 [animation-delay:-9s]`} />
      </div>
      <div className="backdrop-b absolute inset-0">
        <div className={`${field} animate-drift top-[15%] -end-[30%] size-[70vmax] bg-[#ffd84d]/60 [animation-delay:-4s]`} />
        <div className={`${field} animate-drift -bottom-[25%] start-[10%] size-[65vmax] bg-[#ff9db0]/40 [animation-delay:-11s]`} />
      </div>
    </div>
  )
}
