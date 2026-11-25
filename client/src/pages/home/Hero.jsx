import { useRef } from 'react'
import { ChevronLeft } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { useTheme } from '@/lib/theme'
import { Phone, ScreenTracking } from './Phone'

/** Sticky glass bar under the global nav, like the bar on a product page: name, section links, and a buy-style button. */
export function LocalNav({ onJump }) {
  const links = [
    ['overview', 'نظرة عامة'],
    ['restaurants', 'المطاعم'],
    ['how', 'كيف بيشتغل'],
    ['why', 'ليش توصيل'],
  ]
  return (
    <nav aria-label="أقسام الصفحة" className="material-bar sticky top-0 z-40 border-b border-tint/10">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <p className="text-[18px] font-semibold">توصيل</p>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 md:flex">
            {links.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault()
                  onJump(id)
                }}
                className="nav-link py-3 text-[12px] text-ink/80 transition hover:text-ink"
              >
                {label}
              </a>
            ))}
          </div>
          <button onClick={() => onJump('restaurants')} data-magnetic className="btn-primary h-11 px-4 py-0 text-[13px] md:h-9 md:text-[12px]">
            اطلب الآن
          </button>
        </div>
      </div>
    </nav>
  )
}

/**
 * Dark hero. On load the words and the phone rise in; while you scroll away the text fades and lifts,
 * the phone rises and tilts, and the glow behind it grows.
 */
export function Hero({ onJump }) {
  const ref = useRef(null)

  // Mouse position over the hero: --px/--py from -0.5 to 0.5 (lean the phone, pull the big glow toward the cursor),
  // and --gx/--gy in pixels (the light that follows the cursor).
  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = ref.current.getBoundingClientRect()
    const s = ref.current.style
    s.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    s.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
    s.setProperty('--gx', `${Math.round(e.clientX - r.left)}px`)
    s.setProperty('--gy', `${Math.round(e.clientY - r.top)}px`)
    s.setProperty('--glow', 1)
  }
  const onPointerLeave = () => {
    const s = ref.current.style
    s.setProperty('--px', 0)
    s.setProperty('--py', 0)
    s.setProperty('--glow', 0)
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
        intro
          .from('.hero-glow', { scale: 0.4, opacity: 0, duration: 2 }, 0)
          .from('.hero-eyebrow', { y: 20, opacity: 0, duration: 1 }, 0.1)
          .from(
            '.hero-word',
            {
              y: 60,
              opacity: 0,
              filter: 'blur(10px)',
              duration: 1.2,
              stagger: 0.08,
            },
            0.2,
          )
          .from('.hero-sub', { y: 20, opacity: 0, duration: 1 }, 0.6)
          .from('.hero-cta', { y: 20, opacity: 0, duration: 1 }, 0.75)
          .from('.hero-phone', { y: 220, rotateX: 25, opacity: 0, duration: 1.6 }, 0.4)

        const scroll = {
          trigger: ref.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        }
        gsap.to('.hero-text', {
          y: -60,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { ...scroll, end: '60% top' },
        })
        gsap.to('.hero-phone-move', {
          y: -140,
          rotate: -6,
          scale: 1.08,
          ease: 'none',
          scrollTrigger: scroll,
        })
        // On its own layer: if the scroll and the intro both animated the same element, scrolling during
        // the intro would pick up the intro's small starting size and the glow would shrink and fade.
        gsap.fromTo('.hero-glow-scroll', { scale: 1 }, { scale: 1.3, ease: 'none', scrollTrigger: scroll })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    // A dark, rounded panel that fills the first screen: text on top, the phone rising from the bottom edge.
    <section
      ref={ref}
      id="overview"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative flex min-h-[calc(100svh-3rem)] scroll-mt-14 flex-col overflow-hidden rounded-b-[36px] bg-black text-center text-white dark:ring-1 dark:ring-white/10 md:mx-3 md:mt-3 md:min-h-[calc(100svh-4.5rem)] md:rounded-[40px]"
    >
      {/* Glow behind the phone, added as light ("screen" blending) so warm colors stay bright instead of turning brown on black. */}
      <div
        className="hero-glow-scroll pointer-events-none absolute inset-x-0 bottom-0 h-[75%] transition-[translate] duration-700 ease-apple [translate:calc(var(--px,0)*55%)_calc(var(--py,0)*45%)]"
        aria-hidden
      >
        <div className="hero-glow absolute inset-0">
          <div className="absolute bottom-[-10%] left-1/2 size-[560px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_96_32/0.85),rgb(255_96_32/0.25)_55%,transparent_75%)] mix-blend-screen md:size-[820px]" />
          <div className="absolute bottom-[18%] left-[55%] size-[300px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_205_70/0.55),transparent_70%)] mix-blend-screen md:size-[440px]" />
        </div>
      </div>

      {/* Warm light that follows the cursor (mouse only), trailing it a little. */}
      <div
        className="pointer-events-none absolute top-0 left-0 size-[460px] rounded-full bg-[radial-gradient(closest-side,rgb(255_130_40/0.6),rgb(255_199_44/0.2)_50%,transparent)] mix-blend-screen transition-[translate,opacity] duration-500 ease-apple [opacity:var(--glow,0)] [translate:calc(var(--gx,50%)-50%)_calc(var(--gy,50%)-50%)] md:size-[620px]"
        aria-hidden
      />

      <div className="hero-text relative px-4 pt-10 md:pt-16">
        <p className="hero-eyebrow bg-gradient-to-l from-sun to-[#ff7a3d] bg-clip-text text-[18px] font-semibold text-transparent md:text-[24px]">
          توصيل
        </p>
        <h1 className="mx-auto mt-2 max-w-4xl text-[36px] leading-[1.08] font-semibold text-balance md:text-[64px]">
          {'أكلك المفضل، لحد باب البيت.'.split(' ').map((w, i) => (
            <span key={i} className="hero-word inline-block">
              {w}&nbsp;
            </span>
          ))}
        </h1>
        <p className="hero-sub mx-auto mt-4 max-w-xl text-[16px] leading-snug text-balance text-[#c7c7cc] md:text-[20px]">
          مطاعم غزة المفضلة، بالأسعار، بكبسة زر. وتابع طلبك لحظة بلحظة.
        </p>
        <div className="hero-cta mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 md:mt-8">
          <button onClick={() => onJump('restaurants')} data-magnetic className="btn-primary">
            اطلب الآن
          </button>
          <button onClick={() => onJump('how')} className="inline-flex items-center gap-0.5 py-3 text-[15px] text-sun hover:underline">
            كيف بيشتغل
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      {/* The phone takes the rest of the screen and is cut off by the panel's bottom edge, fading into it. */}
      <div className="relative mt-8 min-h-[260px] flex-1 [perspective:1200px] md:mt-12 md:min-h-[380px]">
        <div className="hero-phone-move absolute inset-x-0 top-0">
          {/* Leans toward the mouse (a separate layer, so it never fights the scroll and intro animations). */}
          <div className="transition-transform duration-700 ease-apple [transform:perspective(1000px)_rotateY(calc(var(--px,0)*28deg))_rotateX(calc(var(--py,0)*-18deg))]">
            <Phone className="hero-phone mx-auto w-[260px] md:w-[340px]">
              <ScreenTracking current={3} />
            </Phone>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" aria-hidden />
      </div>
    </section>
  )
}

const STATEMENT = 'كل مطاعم غزة المفضلة بمكان واحد. القائمة كاملة بالأسعار، والطلب بكبسة زر. وبعدها؟ بتعرف وين وصل أكلك، لحظة بلحظة، لحد باب البيت.'

/** A big statement whose words light up one by one as you scroll through it. */
export function Statement() {
  const ref = useRef(null)
  const [theme] = useTheme()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.st-word',
          { color: '#6e6e73' }, // unread words stay readable (above 3:1 at this size in both themes), then turn full color
          {
            color: theme === 'dark' ? '#f5f5f7' : '#1d1d1f',
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 75%',
              end: 'bottom 40%',
              scrub: true,
            },
          },
        )
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [theme], revertOnUpdate: true },
  )

  return (
    <section ref={ref} className="px-4 py-28 md:py-44">
      <p className="mx-auto max-w-4xl text-[26px] leading-[1.2] font-semibold md:text-[40px]">
        {STATEMENT.split(' ').map((w, i) => (
          <span key={i} className="st-word">
            {w}{' '}
          </span>
        ))}
      </p>
    </section>
  )
}
