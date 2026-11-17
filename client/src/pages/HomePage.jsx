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
      gsap.from('.hero-fade', { y: 24, opacity: 0, duration: 0.8, stagger: 0.12, delay: 0.4, ease: 'power3.out' })
      gsap.to('.hero-food', { y: -14, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.4 })
    },
    { scope: ref },
  )

  return (
    <section ref={ref} className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-stone-50">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="hero-fade mb-4 inline-block rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700 shadow-sm">
            الدفع عند الاستلام 💵
          </p>
          <SplitText
            text="أكلك المفضل، لحد باب البيت"
            tag="h1"
            splitType="words"
            trigger="load"
            textAlign="start"
            className="text-4xl leading-tight font-bold sm:text-5xl md:text-6xl"
          />
          <p className="hero-fade mt-5 max-w-md text-lg text-stone-600">
            تصفّح قوائم المطاعم بالأسعار، اطلب بكبسة زر، وتابع طلبك خطوة بخطوة بدون ولا مكالمة.
          </p>
          <div className="hero-fade mt-8 flex flex-wrap gap-3">
            <button onClick={onBrowse} className="btn-primary px-6 py-3 text-base">
              تصفّح المطاعم
            </button>
            <Link to="/register?role=owner" className="btn-secondary px-6 py-3 text-base">
              سجّل مطعمك
            </Link>
          </div>
        </div>

        <div className="relative hidden h-80 md:block" aria-hidden>
          <div className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-100" />
          <span className="hero-food absolute top-4 right-16 text-8xl">🍔</span>
          <span className="hero-food absolute top-28 left-10 text-8xl">🍕</span>
          <span className="hero-food absolute right-28 bottom-0 text-7xl">🌯</span>
          <span className="hero-food absolute bottom-10 left-36 text-6xl">🍰</span>
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
    <section className="mx-auto max-w-6xl px-4 py-14">
      <AnimatedContent distance={40} stagger={0.12} className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.title} className="card p-6">
            <span className="text-3xl" aria-hidden>
              {s.icon}
            </span>
            <h3 className="mt-3 font-bold">{s.title}</h3>
            <p className="mt-1 text-sm text-stone-500">{s.text}</p>
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

      <section ref={listRef} className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">المطاعم</h2>
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
          <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="التصنيفات">
            {['', ...cats.categories].map((c) => (
              <button
                key={c || 'all'}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data?.restaurants.map((r) => (
              <Link
                key={r.id}
                to={`/restaurants/${r.id}`}
                className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
              >
                <RestaurantCover restaurant={r} className="h-40 w-full transition duration-500 group-hover:scale-105" />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold">{r.name}</h3>
                    {r.category && <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">{r.category}</span>}
                  </div>
                  {r.description && <p className="mt-1 line-clamp-2 text-sm text-stone-500">{r.description}</p>}
                  {r.address && <p className="mt-3 text-xs text-stone-400">📍 {r.address}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
