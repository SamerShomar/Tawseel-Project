import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ChevronLeft, MapPin, Phone, Plus } from 'lucide-react'
import { FloatingBar } from '@/components/FloatingBar'
import { useReveal } from '@/components/motion/Reveal'
import { QuantityStepper } from '@/components/QuantityStepper'
import { RestaurantCover } from '@/components/RestaurantCover'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useApi } from '@/hooks/useApi'
import { formatPrice } from '@/lib/format'

const sectionId = (name) => `section-${name}`

/** One menu section; its cards rise in as they scroll into view. */
function MenuSection({ name, items, canOrder, qtyInCart, onAdd, onQuantity }) {
  const gridRef = useReveal([items])
  return (
    <section id={sectionId(name)} className="mt-10 scroll-mt-28 md:mt-14">
      <h2 className="mb-4 text-[20px] font-semibold md:text-[24px]">{name}</h2>
      <div ref={gridRef} className="grid gap-4 md:grid-cols-2">
        {items.map((item) => {
          const qty = qtyInCart(item.id)
          return (
            // Text and price on one side, the dish photo on the other (like a menu).
            <article key={item.id} data-tilt="3" className="card group flex gap-4 p-4">
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="text-[15px] font-semibold">{item.name}</h3>
                {item.description && <p className="mt-0.5 line-clamp-2 text-[13px] text-stone-500">{item.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <span className="rounded-full bg-sun px-3 py-1 text-[15px] font-bold text-ink">{formatPrice(item.price)}</span>
                  {!canOrder ? null : qty ? (
                    <QuantityStepper name={item.name} quantity={qty} onChange={(q) => onQuantity(item.id, q)} />
                  ) : (
                    <button className="btn-primary h-11 py-0 ps-3.5 pe-4" onClick={() => onAdd(item)}>
                      <Plus className="size-4" strokeWidth={2.25} aria-hidden />
                      أضف
                    </button>
                  )}
                </div>
              </div>
              {item.imageUrl && (
                <div className="size-28 shrink-0 overflow-hidden rounded-2xl shadow-sm">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="size-full object-cover transition duration-700 ease-apple group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

/** Sticky glass row of section chips; the chip for the section you're reading lights up. */
function SectionNav({ sections }) {
  const [active, setActive] = useState(sections[0])

  useEffect(() => {
    // A section counts as "current" while it crosses a thin line 40% down the screen.
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id.slice('section-'.length))),
      { rootMargin: '-40% 0px -59% 0px' },
    )
    sections.forEach((s) => {
      const el = document.getElementById(sectionId(s))
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  return (
    <nav
      aria-label="أقسام القائمة"
      className="material-bar no-scrollbar sticky top-[calc(3rem+env(safe-area-inset-top))] z-20 -mx-4 mt-8 flex gap-2 overflow-x-auto border-b border-black/5 px-4 py-2"
    >
      {sections.map((s) => (
        <a
          key={s}
          href={`#${sectionId(s)}`}
          aria-current={active === s ? 'true' : undefined}
          onClick={(e) => {
            e.preventDefault()
            document.getElementById(sectionId(s))?.scrollIntoView({ behavior: 'smooth' })
          }}
          className={`flex h-11 shrink-0 items-center rounded-full px-4 text-[13px] whitespace-nowrap transition duration-300 ${
            active === s ? 'bg-sun font-semibold text-ink' : 'text-ink hover:bg-black/5'
          }`}
        >
          {s}
        </a>
      ))}
    </nav>
  )
}

export default function RestaurantPage() {
  const { id } = useParams()
  const { data, error, loading } = useApi(`/restaurants/${id}`)
  const cart = useCart()
  const { canOrder } = useAuth()
  const [pending, setPending] = useState(null) // item waiting for "replace cart?" confirmation

  const restaurant = data?.restaurant
  const sections = useMemo(() => {
    const groups = new Map()
    for (const item of restaurant?.menuItems || []) {
      const key = item.category || 'الأصناف'
      groups.set(key, [...(groups.get(key) || []), item])
    }
    return [...groups]
  }, [restaurant])
  const sectionNames = useMemo(() => sections.map(([name]) => name), [sections])

  if (loading) return <Spinner />
  if (error)
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Alert>{error.message}</Alert>
      </div>
    )

  const qtyInCart = (itemId) => (cart.restaurant?.id === restaurant.id ? cart.items.find((i) => i.id === itemId)?.quantity : 0)

  const handleAdd = (item) => {
    if (cart.restaurant && cart.restaurant.id !== restaurant.id && cart.items.length) setPending(item)
    else cart.add(restaurant, item)
  }

  const showBar = cart.count > 0 && cart.restaurant?.id === restaurant.id

  return (
    <div className="pb-28">
      <RestaurantCover restaurant={restaurant} className="h-44 w-full sm:h-72" />

      <div className="mx-auto max-w-5xl px-4">
        {/* Glass header card overlapping the cover. */}
        <div className="glass relative -mt-16 rounded-[24px] p-5 sm:-mt-24 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] leading-[1.125] font-semibold md:text-[40px]">{restaurant.name}</h1>
            {restaurant.category && <span className="rounded-full bg-sun px-3 py-1 text-[12px] font-semibold text-ink">{restaurant.category}</span>}
          </div>
          {restaurant.description && <p className="mt-2 text-[15px] text-stone-600 md:text-[16px]">{restaurant.description}</p>}
          <div className="mt-3 flex flex-wrap gap-x-5 text-[13px] text-stone-600">
            {restaurant.address && (
              <span className="flex items-center gap-1 py-1">
                <MapPin className="size-4" strokeWidth={1.75} aria-hidden />
                {restaurant.address}
              </span>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 py-1 hover:text-brand-700">
                <Phone className="size-4" strokeWidth={1.75} aria-hidden />
                <span dir="ltr">{restaurant.phone}</span>
              </a>
            )}
          </div>
        </div>

        {pending && (
          <div className="mt-6">
            <Alert type="info">
              <p>السلة فيها أصناف من «{cart.restaurant.name}». بدك تفضّيها وتبدأ طلب جديد من «{restaurant.name}»؟</p>
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-primary"
                  onClick={() => {
                    cart.clear()
                    cart.add(restaurant, pending)
                    setPending(null)
                  }}
                >
                  نعم، طلب جديد
                </button>
                <button className="btn-secondary" onClick={() => setPending(null)}>
                  إلغاء
                </button>
              </div>
            </Alert>
          </div>
        )}

        {sections.length === 0 ? (
          <div className="mt-8">
            <EmptyState title="القائمة فارغة حالياً">هذا المطعم لم يضف أصنافاً بعد</EmptyState>
          </div>
        ) : (
          <>
            {sections.length > 1 && <SectionNav sections={sectionNames} />}
            {sections.map(([name, items]) => (
              <MenuSection
                key={name}
                name={name}
                items={items}
                canOrder={canOrder}
                qtyInCart={qtyInCart}
                onAdd={handleAdd}
                onQuantity={cart.setQuantity}
              />
            ))}
          </>
        )}
      </div>

      {showBar && (
        <FloatingBar>
          <span className="text-[13px]">
            <strong key={cart.count} className="animate-pop inline-block">
              {cart.count}
            </strong>{' '}
            صنف · <strong>{formatPrice(cart.total)}</strong>
          </span>
          <Link to="/cart" data-magnetic className="btn-primary h-11 py-0 ps-5 pe-4">
            عرض السلة
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          </Link>
        </FloatingBar>
      )}
    </div>
  )
}
