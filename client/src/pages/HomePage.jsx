import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { MapPin, Search } from 'lucide-react'
import { useReveal } from '@/components/motion/Reveal'
import { RestaurantCover } from '@/components/RestaurantCover'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import photos from '@/data/dish-photos.json'
import { useApi } from '@/hooks/useApi'
import { scrollToElement } from '@/hooks/useLenis'
import { Bento, ClosingCta, Highlights } from './home/Features'
import { Hero, LocalNav, Statement } from './home/Hero'
import { Story } from './home/Story'

/*
 * The home page is laid out like a product page, with ordering first:
 * glass local nav → dark hero with the phone → the restaurant list (search + categories) →
 * swipeable popular dishes → statement that lights up as you read → pinned "how it works" story →
 * "why" bento → closing call to action.
 */

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
  const { data: all } = useApi('/restaurants')

  const gridRef = useReveal([data?.restaurants])

  // Popular dishes: the signature dish of each restaurant that is open on the site.
  const featured = (photos.dishes || [])
    .filter((d) => d.featured)
    .map((d) => ({ ...d, restaurantId: all?.restaurants.find((r) => r.name === d.restaurant)?.id }))
    .filter((d) => d.restaurantId)

  // Jump to a section, leaving room for the sticky local nav (56px).
  const jump = (id) => scrollToElement(document.getElementById(id), 56)

  return (
    <>
      <Hero onJump={jump} />
      {/* Sits after the hero so it only sticks once the hero has scrolled away (no doubled bars on top). */}
      <LocalNav onJump={jump} />

      {/* The restaurant list comes first after the hero: ordering is what most people came for. */}
      <section ref={listRef} id="restaurants" className="mx-auto max-w-5xl scroll-mt-14 px-4 py-16 md:py-24">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
          <div>
            <h2 className="text-[32px] leading-[1.1] font-semibold md:text-[48px]">كل المطاعم.</h2>
            <p className="mt-2 text-[16px] text-stone-500 md:text-[20px]">ابحث، اختار، واطلب.</p>
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
                className="chip px-5"
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
          <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {data?.restaurants.map((r) => (
              <Link
                key={r.id}
                to={`/restaurants/${r.id}`}
                data-tilt="6"
                className="card group flex items-stretch overflow-hidden active:scale-[0.99] sm:block"
              >
                <RestaurantCover restaurant={r} className="w-24 shrink-0 transition duration-700 ease-apple group-hover:scale-110 sm:h-36 sm:w-full" />
                <div className="min-w-0 flex-1 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-[15px] font-semibold sm:text-[16px]">{r.name}</h3>
                    {r.category && <span className="shrink-0 rounded-full bg-sun-100 px-3 py-1 text-[12px] font-medium text-ink">{r.category}</span>}
                  </div>
                  {r.description && <p className="mt-1 line-clamp-1 text-[13px] text-stone-500 sm:line-clamp-2">{r.description}</p>}
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

      <Highlights dishes={featured} />
      <Statement />
      <Story />
      <Bento restaurantCount={all?.restaurants.length ?? 0} />
      <ClosingCta onJump={jump} />
    </>
  )
}
