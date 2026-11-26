import { useLayoutEffect, useRef } from 'react'

/**
 * Makes the direct children of an element rise and fade in, a few at a time, as they scroll into view.
 * Works on any element (ul, tbody, div). Children that already appeared are left alone,
 * so reloading a list doesn't replay the whole thing. Does nothing when the device asks to reduce motion.
 *
 * The motion itself is a CSS animation (see `[data-reveal]` in index.css), so the browser runs it off the main
 * thread instead of a script rewriting every card's style on every frame while the page scrolls.
 *
 *   const ref = useReveal([items.length])
 *   <ul ref={ref}>…</ul>
 */
export function useReveal(deps = []) {
  const ref = useRef(null)
  const shown = useRef(new WeakSet()) // children that have appeared

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const fresh = [...el.children].filter((c) => !shown.current.has(c))
    if (!fresh.length) return

    fresh.forEach((c) => (c.dataset.reveal = 'hidden'))

    // When the animation ends the card goes back to plain CSS, so hover tilt and hover scale work on it.
    const done = (e) => {
      if (e.target !== e.currentTarget) return
      const c = e.currentTarget
      delete c.dataset.reveal
      c.style.animationDelay = ''
      c.removeEventListener('animationend', done)
    }

    // A child counts as in view once its top passes 96% of the screen height (only up and down matter: cards
    // in a sideways row, still off to the side, come in with the ones on screen). The ones that enter together
    // come in one after another.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting || e.boundingClientRect.top < 0)) return
        const line = window.innerHeight * 0.96
        fresh
          .filter((c) => !shown.current.has(c) && c.getBoundingClientRect().top < line)
          .forEach((c, i) => {
            observer.unobserve(c)
            shown.current.add(c)
            c.style.animationDelay = `${i * 80}ms`
            c.addEventListener('animationend', done)
            c.dataset.reveal = 'in'
          })
      },
      { rootMargin: '0px 0px -4% 0px' },
    )
    fresh.forEach((c) => observer.observe(c))

    // On re-run or unmount: stop watching, and make anything still hidden visible again
    // (the next run hides it again if it is still waiting to appear).
    return () => {
      observer.disconnect()
      fresh.filter((c) => !shown.current.has(c)).forEach((c) => delete c.dataset.reveal)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
