import { useRef } from 'react'
import { Link } from 'react-router'
import {
  Banknote,
  Beef,
  Bike,
  CakeSlice,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Coffee,
  House,
  PhoneOff,
  Pizza,
  ReceiptText,
  Sandwich,
  Soup,
  Store,
} from 'lucide-react'
import { CountUp } from '@/components/motion/CountUp'
import { useReveal } from '@/components/motion/Reveal'
import { gsap, useGSAP } from '@/lib/gsap'
import { photo } from '@/lib/photo'

const DOTS = [ReceiptText, CircleCheck, ChefHat, Bike, House]

/** "Why Tawseel": a bento grid of glass tiles that rise in as you scroll. */
export function Bento({ restaurantCount }) {
  const gridRef = useReveal([restaurantCount])
  const tile = 'card relative overflow-hidden p-6 md:p-8'

  return (
    <section id="why" className="scroll-mt-14 px-4 py-24 md:py-36">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-[32px] leading-[1.1] font-semibold md:text-[48px]">ليش توصيل؟</h2>
        <div ref={gridRef} className="mt-12 grid grid-cols-2 gap-4 md:mt-16 md:grid-cols-4 md:gap-5">
          {/* Big dark tile. */}
          <div data-tilt="8" className="relative col-span-2 overflow-hidden rounded-[28px] bg-black p-8 text-white dark:ring-1 dark:ring-white/10 md:row-span-2 md:p-10">
            <div className="pointer-events-none absolute -end-24 -bottom-24 size-80 rounded-full bg-[radial-gradient(closest-side,rgb(232_93_30/0.6),transparent)]" />
            <Banknote className="relative size-14 text-sun" strokeWidth={1.25} aria-hidden />
            <p className="relative mt-10 text-[32px] leading-[1.05] font-semibold md:mt-24 md:text-[40px]">الدفع عند الاستلام.</p>
            <p className="relative mt-3 max-w-sm text-[15px] text-[#d2d2d7]">ما في بطاقات ولا تحويلات. بتدفع نقداً للسائق لما يوصلك أكلك.</p>
          </div>

          <div data-tilt="10" className={`${tile} col-span-2`}>
            <p className="bg-gradient-to-l from-brand-700 to-accent bg-clip-text text-[48px] leading-none font-semibold text-transparent tabular-nums md:text-[60px]">
              <CountUp value={restaurantCount} />
            </p>
            <p className="mt-2 text-[18px] font-semibold">مطعم من غزة</p>
            <p className="text-[15px] text-stone-500">من الشاورما للكنافة، كلها بمكان واحد.</p>
          </div>

          <div data-tilt="10" className={tile}>
            <div className="flex gap-1" aria-hidden>
              {DOTS.map((Icon, i) => (
                <span key={i} className="grid size-7 place-items-center rounded-full bg-accent text-white" style={{ opacity: 0.35 + i * 0.16 }}>
                  <Icon className="size-3.5" strokeWidth={2} />
                </span>
              ))}
            </div>
            <p className="mt-6 text-[18px] leading-tight font-semibold">تتبّع مباشر</p>
            <p className="mt-1 text-[13px] text-stone-500">5 مراحل، بتتحدّث لحالها.</p>
          </div>

          <div data-tilt="10" className={tile}>
            <PhoneOff className="size-8 text-brand-700" strokeWidth={1.5} aria-hidden />
            <p className="mt-6 text-[18px] leading-tight font-semibold">ولا مكالمة</p>
            <p className="mt-1 text-[13px] text-stone-500">كل شي بيصير من الموقع.</p>
          </div>

          <div data-tilt="10" className={`${tile} col-span-2`}>
            <Store className="size-8 text-brand-700" strokeWidth={1.5} aria-hidden />
            <p className="mt-6 text-[20px] font-semibold">عندك مطعم؟</p>
            <p className="mt-1 text-[15px] text-stone-500">استقبل الطلبات، عدّل قائمتك، وتابع كل طلب من لوحة وحدة.</p>
            <Link to="/register?role=owner" className="link mt-3 py-2">
              سجّل مطعمك
              <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>

          <div data-tilt="10" className={`${tile} col-span-2`}>
            <Bike className="size-8 text-brand-700" strokeWidth={1.5} aria-hidden />
            <p className="mt-6 text-[20px] font-semibold">بدك تشتغل سائق؟</p>
            <p className="mt-1 text-[15px] text-stone-500">اختار الطلبات اللي بتناسبك، ووصّلها بوقتك.</p>
            <Link to="/register?role=driver" className="link mt-3 py-2">
              اشتغل سائق
              <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Popular dishes: a row of large photo cards you swipe through (or step with the arrows); each opens its restaurant. */
export function Highlights({ dishes }) {
  const rowRef = useRef(null)
  const listRef = useReveal([dishes.length])

  // In RTL the row scrolls toward negative scrollLeft, so "next" moves left.
  const step = (dir) => {
    const row = rowRef.current
    const card = row?.querySelector('li')
    if (!card) return
    row.scrollBy({ left: -dir * (card.offsetWidth + 16), behavior: 'smooth' })
  }

  if (!dishes.length) return null
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-[32px] leading-[1.1] font-semibold md:text-[48px]">أطباق بتحبها.</h2>
        <p className="mt-2 text-[16px] text-stone-500 md:text-[20px]">اسحب، اختار، واطلب من المطعم مباشرة.</p>
      </div>
      <div ref={rowRef} className="no-scrollbar mt-8 overflow-x-auto scroll-smooth">
        <ul ref={listRef} className="flex snap-x snap-mandatory gap-4 px-4 md:px-[max(1rem,calc((100vw-64rem)/2+1rem))]">
          {dishes.map((d) => (
            <li key={d.name} className="w-[72vw] max-w-[320px] shrink-0 snap-start">
              <Link
                to={`/restaurants/${d.restaurantId}`}
                data-tilt="8"
                className="group relative block h-[380px] overflow-hidden rounded-[28px] bg-stone-100 shadow-[0_8px_30px_rgb(120_40_0/0.12)] md:h-[420px]"
              >
                <img
                  {...photo(d.image, '(min-width: 450px) 320px, 72vw')}
                  alt={d.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover transition duration-700 ease-apple group-hover:scale-[1.15]"
                />
                {/* Glass caption over the photo. */}
                <div className="glass absolute inset-x-3 bottom-3 rounded-[22px] p-4">
                  <p className="inline-block rounded-full bg-sun px-2.5 py-0.5 text-[12px] font-semibold text-on-sun">{d.restaurant}</p>
                  <p className="mt-0.5 text-[18px] leading-tight font-semibold">{d.name}</p>
                  <span className="link mt-1 text-[13px]">
                    اطلب الآن
                    <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto mt-6 flex max-w-5xl justify-end gap-3 px-4">
        <button onClick={() => step(-1)} className="glass grid size-11 place-items-center rounded-full transition active:scale-90" aria-label="السابق">
          <ChevronRight className="size-5" strokeWidth={2} aria-hidden />
        </button>
        <button onClick={() => step(1)} className="glass grid size-11 place-items-center rounded-full transition active:scale-90" aria-label="التالي">
          <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </section>
  )
}

const FOOD = [
  { icon: Pizza, className: 'top-[6%] left-[6%] size-9 text-sun md:size-12', delay: '0s' },
  { icon: Sandwich, className: 'top-[58%] left-[2%] size-8 text-[#ff7a3d] md:size-11', delay: '-1.2s' },
  { icon: CakeSlice, className: 'top-[0%] left-[38%] size-7 text-[#ffdd6e] md:size-10', delay: '-2.4s' },
  { icon: Beef, className: 'top-[4%] right-[8%] size-9 text-[#ff9a3c] md:size-12', delay: '-0.6s' },
  { icon: Coffee, className: 'top-[60%] right-[3%] size-8 text-sun md:size-11', delay: '-1.8s' },
  { icon: Soup, className: 'top-[2%] right-[36%] size-7 text-[#ff7a3d] md:size-9', delay: '-3s' },
]

/** Closing dark section: "جوعان؟" bounces in, shimmers, rumbles like a hungry stomach, with food floating around it. */
export function ClosingCta({ onJump }) {
  const ref = useRef(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.cta-title', {
          scale: 0.7,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top 90%',
            end: 'top 30%',
            scrub: true,
          },
        })
        // Once in view, the word pops in with a bounce and the food icons burst out from it.
        const pop = { trigger: ref.current, start: 'top 60%', once: true }
        gsap.from('.cta-pop', { scale: 0.2, rotate: -15, duration: 1.4, ease: 'elastic.out(1, 0.45)', scrollTrigger: pop })
        gsap.from('.cta-food', { y: 60, scale: 0, rotate: -40, opacity: 0, duration: 1.1, stagger: 0.07, ease: 'back.out(2)', scrollTrigger: pop })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} className="relative overflow-hidden bg-black px-4 py-28 text-center text-white md:py-40">
      <div className="animate-halo pointer-events-none absolute top-[38%] left-1/2 size-[700px] rounded-full bg-[radial-gradient(closest-side,rgb(255_110_30/0.55),rgb(255_199_44/0.18)_55%,transparent)] mix-blend-screen md:size-[900px]" />

      {/* Food icons floating around the word. */}
      <div className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-[220px] max-w-3xl md:top-14 md:h-[300px]" aria-hidden>
        {FOOD.map(({ icon: Icon, className, delay }) => (
          <span key={className} className={`cta-food absolute ${className}`}>
            <Icon className="animate-food-float size-full" strokeWidth={1.5} style={{ animationDelay: delay }} />
          </span>
        ))}
      </div>

      <p className="cta-title relative">
        <span className="cta-pop inline-block">
          <span className="animate-hungry inline-block cursor-default bg-[linear-gradient(90deg,var(--color-sun),#ff7a3d,#ffdd6e,#ff9a3c,var(--color-sun))] bg-[length:200%_auto] bg-clip-text px-2 text-[64px] leading-[1.2] font-semibold text-transparent transition-[scale] duration-300 ease-apple hover:scale-[1.15] md:text-[112px]">
            جوعان؟
          </span>
        </span>
      </p>
      <p className="relative mt-5 text-[16px] text-[#d2d2d7] md:text-[20px]">اختار مطعمك واطلب، والباقي علينا.</p>
      <button onClick={() => onJump('restaurants')} data-magnetic className="btn-primary relative mt-8">
        اطلب الآن
      </button>
    </section>
  )
}
