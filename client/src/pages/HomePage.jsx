import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import AnimatedContent from '@/components/react-bits/AnimatedContent/AnimatedContent'
import SplitText from '@/components/react-bits/SplitText/SplitText'
import { RestaurantCover } from '@/components/RestaurantCover'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { gsap, useGSAP } from '@/lib/gsap'

function Hero({ onBrowse }) {
  const ref = useRef(null)

  useGSAP(
    () => {
      // Only animate when the person hasn't asked their device to reduce motion.
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.hero-fade', { y: 24, opacity: 0, duration: 0.5, stagger: 0.08, delay: 0.15, ease: 'power3.out' })
        gsap.to('.hero-food', { y: -14, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.4 })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-stone-50">
      <div className="mx-auto grid max-w-6xl items-center gap-2 px-4 pt-4 pb-8 md:grid-cols-2 md:gap-10 md:py-16">
        <div>
          <p className="hero-fade mb-3 inline-block rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700 shadow-sm md:mb-4">
            الدفع عند الاستلام 💵
          </p>
          <SplitText
            text="أكلك المفضل، لحد باب البيت"
            tag="h1"
            splitType="words"
            trigger="load"
            duration={0.6}
            delay={40}
            textAlign="start"
            className="max-w-[18rem] text-4xl leading-tight font-bold sm:max-w-none sm:text-5xl md:text-6xl"
          />
          <p className="hero-fade mt-3 max-w-md text-stone-600 md:mt-5 md:text-lg">
            تصفّح قوائم المطاعم بالأسعار، اطلب بكبسة زر، وتابع طلبك خطوة بخطوة بدون ولا مكالمة.
          </p>
          <div className="hero-fade mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap md:mt-8">
            <button onClick={onBrowse} className="btn-primary px-5 py-3 text-base">
              تصفّح المطاعم
            </button>
            <Link to="/register?role=owner" className="btn-secondary px-5 py-3 text-base">
              سجّل مطعمك
            </Link>
          </div>
        </div>

        {/* Food illustration: small and above the text on phones, large beside it on desktop. */}
        <div className="relative order-first mx-auto h-32 w-full max-w-72 md:order-none md:h-80 md:max-w-none" aria-hidden>
          <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-100 md:size-72" />
          <span className="hero-food absolute top-1 right-[18%] text-5xl md:top-4 md:right-16 md:text-8xl">🍔</span>
          <span className="hero-food absolute top-[38%] left-[6%] text-5xl md:top-28 md:left-10 md:text-8xl">🍕</span>
          <span className="hero-food absolute right-[30%] bottom-0 text-5xl md:right-28 md:text-7xl">🌯</span>
          <span className="hero-food absolute top-[34%] right-0 text-4xl md:hidden">🧆</span>
          <span className="hero-food absolute bottom-3 left-[34%] text-4xl md:bottom-10 md:left-36 md:text-6xl">🍰</span>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  { icon: '📋', title: 'اختر المطعم', text: 'شوف القائمة كاملة مع الأسعار' },
  { icon: '🛒', title: 'اطلب بسهولة', text: 'أضف للسلة واكتب عنوانك' },
  { icon: '🛵', title: 'تابع طلبك', text: 'اعرف حالة طلبك أول بأول' },
]

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-4 md:py-14">
      <AnimatedContent distance={40} duration={0.5} stagger={0.12} className="grid grid-cols-3 gap-2 md:gap-4">
        {STEPS.map((s) => (
          <div key={s.title} className="card p-3 text-center md:p-6 md:text-start">
            <span className="text-2xl md:text-3xl" aria-hidden>
              {s.icon}
            </span>
            <h3 className="mt-2 text-sm font-bold md:mt-3 md:text-base">{s.title}</h3>
            <p className="mt-1 hidden text-sm text-stone-500 md:block">{s.text}</p>
          </div>
        ))}
      </AnimatedContent>
    </section>
  )
}

export default function HomePage() {
  const listRef = useRef(null)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  const { data: cats } = useApi('/restaurants/categories')
  const { data, error, loading } = useApi('/restaurants', { query: { search: debounced, category } })

  const scrollToList = () => listRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      <Hero onBrowse={scrollToList} />
      <HowItWorks />

      <section ref={listRef} className="mx-auto max-w-6xl scroll-mt-16 px-4 pt-4 pb-10 md:scroll-mt-20 md:pb-20">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[28px] font-bold sm:text-3xl">المطاعم</h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن مطعم…"
            aria-label="ابحث عن مطعم"
            className="input sm:max-w-xs"
          />
        </div>

        {cats?.categories?.length > 0 && (
          <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:mb-6 sm:flex-wrap sm:px-0" role="group" aria-label="التصنيفات">
            {['', ...cats.categories].map((c) => (
              <button
                key={c || 'all'}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition sm:py-1.5 ${
                  category === c ? 'bg-ink text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-stone-300'
                }`}
              >
                {c || 'الكل'}
              </button>
            ))}
          </div>
        )}

        <Alert>{error?.message}</Alert>
        {loading && !data ? (
          <Spinner />
        ) : data?.restaurants.length === 0 ? (
          <EmptyState icon="🔍" title="ما في مطاعم مطابقة">
            جرّب كلمة بحث أو تصنيف ثاني
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {data?.restaurants.map((r) => (
              <Link
                key={r.id}
                to={`/restaurants/${r.id}`}
                className="card group flex items-stretch overflow-hidden transition active:scale-[0.99] sm:block sm:hover:-translate-y-1 sm:hover:shadow-lg"
              >
                <RestaurantCover restaurant={r} className="w-24 shrink-0 transition duration-300 sm:h-28 sm:w-full sm:group-hover:scale-105" />
                <div className="min-w-0 flex-1 p-3.5 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-bold sm:text-lg">{r.name}</h3>
                    {r.category && <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">{r.category}</span>}
                  </div>
                  {r.description && <p className="mt-1 line-clamp-1 text-sm text-stone-500 sm:line-clamp-2">{r.description}</p>}
                  {r.address && <p className="mt-2 truncate text-xs text-stone-500 sm:mt-3">📍 {r.address}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
