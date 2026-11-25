import { useRef, useState } from 'react'
import { Bike, ShoppingBag, Store } from 'lucide-react'
import { scrollToPosition } from '@/hooks/useLenis'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { Phone, ScreenCart, ScreenRestaurants, ScreenTracking } from './Phone'

const STEPS = [
  {
    icon: Store,
    title: 'اختار المطعم',
    text: 'تصفّح مطاعم غزة، وشوف القائمة كاملة مع الأسعار قبل ما تطلب.',
    Screen: ScreenRestaurants,
  },
  {
    icon: ShoppingBag,
    title: 'اطلب بكبسة زر',
    text: 'أضف للسلة، اكتب عنوانك، وادفع نقداً لما يوصلك الأكل.',
    Screen: ScreenCart,
  },
  {
    icon: Bike,
    title: 'تابع طلبك',
    text: 'من قبول المطعم، للتحضير، للسائق، لحد باب البيت. بدون ولا مكالمة.',
    Screen: ScreenTracking,
  },
]

/**
 * "How it works" told by scrolling: the section stays pinned while you scroll,
 * and each third of the scroll shows the next step on the phone.
 * With Reduce Motion there is no pinning; the steps are buttons that switch the screen.
 */
export function Story() {
  const ref = useRef(null)
  const trigger = useRef(null)
  const [step, setStep] = useState(0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        trigger.current = ScrollTrigger.create({
          trigger: '.story-pin',
          start: 'top 56px', // just under the sticky local nav
          end: '+=150%',
          pin: true,
          scrub: true,
          onUpdate: (self) => setStep(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length))),
        })
        gsap.to('.story-progress', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.story-pin',
            start: 'top 56px',
            end: '+=150%',
            scrub: true,
          },
        })
        return () => (trigger.current = null)
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  // Clicking a step jumps the scroll to that step (or just switches it when nothing is pinned).
  const go = (i) => {
    const t = trigger.current
    if (!t) return setStep(i)
    scrollToPosition(t.start + ((i + 0.5) / STEPS.length) * (t.end - t.start))
  }

  return (
    <section ref={ref} id="how" className="scroll-mt-14">
      <div className="story-pin flex min-h-[calc(100svh-56px)] flex-col justify-center overflow-hidden px-4 py-8">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-6 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="text-[26px] leading-[1.125] font-semibold md:text-[40px]">ثلاث خطوات، والأكل عندك.</h2>
            {/* Progress line that fills as you scroll through the steps. */}
            <div className="mt-5 h-1 overflow-hidden rounded-full bg-tint/10">
              <div className="story-progress h-full origin-right scale-x-0 rounded-full bg-accent motion-reduce:scale-x-100" />
            </div>
            {/* Phones: the three steps as icon buttons, with the current step's text under them. */}
            <div className="mt-4 flex gap-2 md:hidden" role="group" aria-label="الخطوات">
              {STEPS.map(({ icon: Icon, title }, i) => (
                <button
                  key={title}
                  onClick={() => go(i)}
                  aria-label={title}
                  aria-pressed={i === step}
                  className={`grid size-11 place-items-center rounded-full transition-colors duration-500 ${i === step ? 'bg-accent text-white' : 'bg-tint/[0.06] text-ink'}`}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </button>
              ))}
            </div>
            <div key={step} className="animate-page-in mt-3 md:hidden">
              <p className="text-[18px] font-semibold">{STEPS[step].title}</p>
              <p className="text-[15px] text-stone-500">{STEPS[step].text}</p>
            </div>

            <ol className="mt-6 hidden space-y-2 md:block">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title}>
                  <button
                    onClick={() => go(i)}
                    aria-current={i === step ? 'step' : undefined}
                    className={`flex w-full items-start gap-4 rounded-[22px] p-4 text-start transition duration-500 ${
                      i === step ? 'glass' : 'hover:bg-surface/40'
                    }`}
                  >
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors duration-500 ${
                        i === step ? 'bg-accent text-white' : 'bg-tint/[0.06] text-ink'
                      }`}
                    >
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span>
                      <span className={`block text-[18px] font-semibold transition-colors duration-500 ${i === step ? 'text-ink' : 'text-stone-500'}`}>
                        {title}
                      </span>
                      <span className="block text-[15px] text-stone-500">{text}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {/* Phones: a full-width phone whose bottom is cropped and faded, so it fits under the text. */}
          <div className="mx-auto h-[min(46svh,620px)] overflow-hidden [mask-image:linear-gradient(to_bottom,black_80%,transparent)] md:h-auto md:overflow-visible md:[mask-image:none]">
            <Phone className="mx-auto w-[240px] md:h-[min(74svh,660px)] md:w-auto">
              {STEPS.map(({ Screen, title }, i) => (
                // Screens are stacked; the current one fades and scales in, the others fade out.
                <div
                  key={title}
                  className={`absolute inset-x-0 top-10 bottom-0 transition-all duration-700 ease-apple ${
                    i === step ? 'scale-100 opacity-100' : i < step ? 'scale-95 opacity-0' : 'scale-105 opacity-0'
                  }`}
                >
                  <Screen />
                </div>
              ))}
            </Phone>
          </div>
        </div>
      </div>
    </section>
  )
}
