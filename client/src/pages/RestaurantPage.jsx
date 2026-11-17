import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { RestaurantCover } from '@/components/RestaurantCover'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useApi } from '@/hooks/useApi'
import { formatPrice } from '@/lib/format'

export default function RestaurantPage() {
  const { id } = useParams()
  const { data, error, loading } = useApi(`/restaurants/${id}`)
  const cart = useCart()
  const { isOwner } = useAuth()
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

  if (loading) return <Spinner />
  if (error)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Alert>{error.message}</Alert>
      </div>
    )

  const qtyInCart = (itemId) => (cart.restaurant?.id === restaurant.id ? cart.items.find((i) => i.id === itemId)?.quantity : 0)

  const handleAdd = (item) => {
    if (cart.restaurant && cart.restaurant.id !== restaurant.id && cart.items.length) setPending(item)
    else cart.add(restaurant, item)
  }

  return (
    <div className="pb-28">
      <div className="relative">
        <RestaurantCover restaurant={restaurant} className="h-48 w-full sm:h-64" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="card relative -mt-12 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">{restaurant.name}</h1>
            {restaurant.category && <span className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">{restaurant.category}</span>}
          </div>
          {restaurant.description && <p className="mt-2 text-stone-600">{restaurant.description}</p>}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-500">
            {restaurant.address && <span>📍 {restaurant.address}</span>}
            {restaurant.phone && <span dir="ltr">📞 {restaurant.phone}</span>}
          </div>
        </div>

        {pending && (
          <div className="mt-6">
            <Alert type="info">
              <p>السلة فيها أصناف من «{cart.restaurant.name}». بدك تفضّيها وتبدأ طلب جديد من «{restaurant.name}»؟</p>
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-primary py-1.5"
                  onClick={() => {
                    cart.clear()
                    cart.add(restaurant, pending)
                    setPending(null)
                  }}
                >
                  نعم، طلب جديد
                </button>
                <button className="btn-secondary py-1.5" onClick={() => setPending(null)}>
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
          sections.map(([section, items]) => (
            <section key={section} className="mt-10">
              <h2 className="mb-4 text-xl font-bold">{section}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((item) => {
                  const qty = qtyInCart(item.id)
                  return (
                    <article key={item.id} className="card flex gap-4 p-4">
                      {item.imageUrl && <img src={item.imageUrl} alt="" className="size-24 shrink-0 rounded-xl object-cover" loading="lazy" />}
                      <div className="flex flex-1 flex-col">
                        <h3 className="font-bold">{item.name}</h3>
                        {item.description && <p className="mt-1 text-sm text-stone-500">{item.description}</p>}
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <span className="font-bold text-brand-700">{formatPrice(item.price)}</span>
                          {isOwner ? null : qty ? (
                            <div className="flex items-center gap-2">
                              <button className="btn-secondary size-9 p-0" onClick={() => cart.setQuantity(item.id, qty - 1)} aria-label={`إنقاص ${item.name}`}>
                                −
                              </button>
                              <span className="w-6 text-center font-semibold" aria-live="polite">
                                {qty}
                              </span>
                              <button className="btn-primary size-9 p-0" onClick={() => cart.setQuantity(item.id, qty + 1)} aria-label={`زيادة ${item.name}`}>
                                +
                              </button>
                            </div>
                          ) : (
                            <button className="btn-primary py-2" onClick={() => handleAdd(item)}>
                              أضف للسلة
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {cart.count > 0 && cart.restaurant?.id === restaurant.id && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <span className="text-sm">
              <strong>{cart.count}</strong> صنف · <strong>{formatPrice(cart.total)}</strong>
            </span>
            <Link to="/cart" className="btn-primary px-6">
              عرض السلة وإتمام الطلب
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
