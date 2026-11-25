import { useRef } from 'react'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * The site's background: large, soft color fields that shift at different speeds as you scroll.
 * They don't move on their own: everything with a frosted blur on top would have to be re-blurred every frame.
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

  // Soft fields drawn as radial gradients: the same look as a heavy blur filter, without repainting a blur every frame.
  const field = 'absolute rounded-full'
  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-stone-50" aria-hidden>
      <div className="backdrop-a absolute inset-0 will-change-transform dark:opacity-35">
        <div className={`${field} -top-[15%] -start-[25%] size-[75vmax] bg-[radial-gradient(closest-side,rgb(255_177_133/0.55),rgb(255_177_133/0.3)_55%,transparent)]`} />
        <div className={`${field} top-[45%] -start-[20%] size-[55vmax] bg-[radial-gradient(closest-side,rgb(217_200_255/0.45),rgb(217_200_255/0.25)_55%,transparent)]`} />
      </div>
      <div className="backdrop-b absolute inset-0 will-change-transform dark:opacity-35">
        <div className={`${field} top-[15%] -end-[30%] size-[70vmax] bg-[radial-gradient(closest-side,rgb(255_216_77/0.6),rgb(255_216_77/0.33)_55%,transparent)]`} />
        <div className={`${field} -bottom-[25%] start-[10%] size-[65vmax] bg-[radial-gradient(closest-side,rgb(255_157_176/0.4),rgb(255_157_176/0.22)_55%,transparent)]`} />
      </div>
    </div>
  )
}
