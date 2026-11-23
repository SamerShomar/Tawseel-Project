import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Banknote, Bike, ChefHat, ChevronLeft, House, MapPin, ReceiptText, Search, ShoppingBag, Store } from 'lucide-react'
import AnimatedContent from '@/components/react-bits/AnimatedContent/AnimatedContent'
import SplitText from '@/components/react-bits/SplitText/SplitText'
import { RestaurantCover } from '@/components/RestaurantCover'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { gsap, useGSAP } from '@/lib/gsap'

const TRACK_STEPS = [
  { icon: ReceiptText, label: 'استلمنا طلبك' },
  { icon: ChefHat, label: 'قيد التحضير' },
  { icon: Bike, label: 'في الطريق' },
  { icon: House, label: 'وصل' },
]

/** The "product shot": a sample order being tracked, drawn in HTML instead of a photo. */
function OrderPreview() {
  const done = 3
  return (
    <div className="card mx-auto w-full max-w-sm p-5 text-start md:p-6" aria-hidden>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] text-stone-500">طلب رقم 1042</p>
          <p className="text-[17px] font-semibold">شاورما البيدر</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-700">في الطريق إليك</span>
      </div>

      <ol className="mt-6 grid grid-cols-4">
        {TRACK_STEPS.map(({ icon: Icon, label }, i) => (
          <li key={label} className="relative flex flex-col items-center gap-2 text-center">
            {i > 0 && <span className={`absolute top-5 end-1/2 h-0.5 w-full ${i < done ? 'bg-accent' : 'bg-stone-100'}`} />}
            <span className={`relative grid size-10 place-items-center rounded-full ${i < done ? 'bg-accent text-white' : 'bg-stone-100 text-stone-400'}`}>
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className={`text-[11px] ${i < done ? 'text-ink' : 'text-stone-500'}`}>{label}</span>
          </li>
        ))}
      </ol>

      <dl className="mt-6 space-y-2 border-t border-stone-100 pt-4 text-[14px]">
        <div className="flex justify-between">
          <dt>سندويش شاورما دجاج × 2</dt>
          <dd>₪ 40</dd>
        </div>
        <div className="flex justify-between">
          <dt>بطاطا مقلية</dt>
          <dd>₪ 10</dd>
        </div>
        <div className="flex justify-between border-t border-stone-100 pt-2 text-[17px] font-semibold">
          <dt>المجموع</dt>
          <dd>₪ 50</dd>
        </div>
      </dl>
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-stone-500">
        <Banknote className="size-4" strokeWidth={1.5} />
        الدفع عند الاستلام
      </p>
    </div>
  )
}

function Hero({ onBrowse }) {
  const ref = useRef(null)

  useGSAP(
    () => {
      // Only animate when the person hasn't asked their device to reduce motion.
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.hero-fade', { y: 24, opacity: 0, duration: 0.6, stagger: 0.08, delay: 0.15, ease: 'power3.out' })
        gsap.from('.hero-device', { y: 60, scale: 0.94, opacity: 0, duration: 0.9, delay: 0.35, ease: 'power3.out' })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section ref={ref} className="overflow-hidden bg-white px-4 pt-12 text-center md:pt-20">
      <p className="hero-fade text-[17px] font-semibold text-brand-700 md:text-[21px]">توصيل</p>
      <SplitText
        text="أكلك المفضل، لحد باب البيت."
        tag="h1"
        splitType="words"
        trigger="load"
        duration={0.6}
        delay={40}
        textAlign="center"
        className="mx-auto mt-2 max-w-4xl text-[40px] leading-[1.1] font-semibold text-balance md:text-[64px] lg:text-[76px]"
      />
      <p className="hero-fade mx-auto mt-4 max-w-xl text-[19px] leading-snug text-balance text-stone-500 md:text-[24px]">
        تصفّح قوائم مطاعم غزة بالأسعار، اطلب بكبسة زر، وتابع طلبك خطوة بخطوة.
      </p>
      <div className="hero-fade mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <button onClick={onBrowse} className="btn-primary">
          تصفّح المطاعم
        </button>
        <Link to="/register?role=owner" className="link py-3">
          سجّل مطعمك
          <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
        </Link>
      </div>

      <div className="hero-device mx-auto mt-12 max-w-3xl rounded-t-[28px] bg-gradient-to-b from-brand-50 to-stone-50 px-5 pt-10 pb-12 md:mt-16 md:pt-16 md:pb-16">
        <OrderPreview />
      </div>
    </section>
  )
}

const STEPS = [
  { icon: Store, title: 'اختر المطعم', text: 'شوف القائمة كاملة مع الأسعار قبل ما تطلب.' },
  { icon: ShoppingBag, title: 'اطلب بسهولة', text: 'أضف للسلة، اكتب عنوانك، وادفع عند الاستلام.' },
  { icon: Bike, title: 'تابع طلبك', text: 'اعرف وين وصل طلبك أول بأول، بدون ولا مكالمة.' },
]

function HowItWorks() {
  return (
    <section className="bg-stone-50 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-[32px] leading-[1.125] font-semibold md:text-5xl">ثلاث خطوات، والأكل عندك.</h2>
        <AnimatedContent distance={40} duration={0.5} stagger={0.12} className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-5">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-7 md:p-8">
              <Icon className="size-8 text-brand-700" strokeWidth={1.5} aria-hidden />
              <h3 className="mt-4 text-[21px] font-semibold">{title}</h3>
              <p className="mt-1 text-[17px] text-stone-500">{text}</p>
            </div>
          ))}
        </AnimatedContent>
      </div>
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

      <section ref={listRef} className="mx-auto max-w-5xl scroll-mt-12 px-4 py-16 md:py-24">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
          <div>
            <h2 className="text-[32px] leading-[1.125] font-semibold md:text-5xl">المطاعم</h2>
            <p className="mt-2 text-[17px] text-stone-500 md:text-[21px]">اختر مطعمك، والباقي علينا.</p>
          </div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-500" strokeWidth={1.75} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن مطعم"
              aria-label="ابحث عن مطعم"
              className="input rounded-full ps-11"
            />
          </div>
        </div>

        {cats?.categories?.length > 0 && (
          <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="التصنيفات">
            {['', ...cats.categories].map((c) => (
              <button
                key={c || 'all'}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`h-11 shrink-0 rounded-full px-5 text-[14px] whitespace-nowrap transition ${
                  category === c ? 'bg-ink text-white' : 'bg-stone-50 text-ink hover:bg-stone-100'
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
          <EmptyState icon={Search} title="ما في مطاعم مطابقة">
            جرّب كلمة بحث أو تصنيف ثاني
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {data?.restaurants.map((r) => (
              <Link
                key={r.id}
                to={`/restaurants/${r.id}`}
                className="card group flex items-stretch overflow-hidden transition duration-300 active:scale-[0.99] sm:block sm:hover:scale-[1.01] sm:hover:shadow-[2px_4px_16px_rgb(0_0_0/0.16)]"
              >
                <RestaurantCover restaurant={r} className="w-24 shrink-0 sm:h-36 sm:w-full" />
                <div className="min-w-0 flex-1 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-[17px] font-semibold sm:text-[19px]">{r.name}</h3>
                    {r.category && <span className="shrink-0 rounded-full bg-stone-50 px-3 py-1 text-[12px] text-stone-600">{r.category}</span>}
                  </div>
                  {r.description && <p className="mt-1 line-clamp-1 text-[14px] text-stone-500 sm:line-clamp-2">{r.description}</p>}
                  {r.address && (
                    <p className="mt-2 flex items-center gap-1 truncate text-[12px] text-stone-500 sm:mt-3">
                      <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                      <span className="truncate">{r.address}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
