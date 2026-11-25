import { useEffect } from 'react'

/**
 * Site-wide hover effects, driven by one pointer listener on the document:
 *
 *  - Spotlight: every `.card` / `.glass` gets --mx / --my (cursor position inside it); CSS draws a soft light there.
 *  - Tilt: elements with `data-tilt` (optionally `data-tilt="8"` = max degrees) lean toward the cursor in 3D.
 *  - Magnetic: elements with `data-magnetic` drift a little toward the cursor while it is over them.
 *
 * Only on devices with a real mouse (hover + fine pointer). Tilt and magnetic are skipped with "Reduce Motion".
 */
export function usePointerEffects() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')

    let frame = 0
    let event = null
    let tiltEl = null
    let magEl = null

    const resetTilt = () => {
      if (tiltEl) tiltEl.style.transform = ''
      tiltEl = null
    }
    const resetMag = () => {
      if (magEl) magEl.style.translate = ''
      magEl = null
    }

    const apply = () => {
      frame = 0
      const e = event
      const target = e.target instanceof Element ? e.target : null

      const lit = target?.closest('.card, .glass')
      if (lit) {
        const r = lit.getBoundingClientRect()
        lit.style.setProperty('--mx', `${e.clientX - r.left}px`)
        lit.style.setProperty('--my', `${e.clientY - r.top}px`)
      }

      const tilt = reduce.matches ? null : target?.closest('[data-tilt]')
      if (tilt !== tiltEl) resetTilt()
      if (tilt) {
        const r = tilt.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        const max = Number(tilt.dataset.tilt) || 6
        tilt.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`
        tiltEl = tilt
      }

      const mag = reduce.matches ? null : target?.closest('[data-magnetic]')
      if (mag !== magEl) resetMag()
      if (mag) {
        const r = mag.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        mag.style.translate = `${(dx * 0.25).toFixed(1)}px ${(dy * 0.35).toFixed(1)}px`
        magEl = mag
      }
    }

    const onMove = (e) => {
      event = e
      if (!frame) frame = requestAnimationFrame(apply)
    }
    const onLeave = () => {
      resetTilt()
      resetMag()
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      onLeave()
      document.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
    }
  }, [])
}
