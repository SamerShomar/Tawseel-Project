import { useState } from 'react'
import { Link } from 'react-router'
import { Page } from '@/components/Layout'
import { RestaurantCover } from '@/components/RestaurantCover'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'

export default function AdminRestaurantsPage() {
  const { data, error, loading, setData } = useApi('/admin/restaurants')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  const toggle = async (r) => {
    if (r.isActive && !window.confirm(`إخفاء «${r.name}» عن الزباين؟ ما رح يظهر بالموقع وما حدا بيقدر يطلب منه.`)) return
    setBusyId(r.id)
    setActionError('')
    try {
      const { restaurant } = await api(`/admin/restaurants/${r.id}`, { method: 'PATCH', body: { isActive: !r.isActive } })
      setData((d) => ({ restaurants: d.restaurants.map((x) => (x.id === restaurant.id ? { ...x, isActive: restaurant.isActive } : x)) }))
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner />
  const list = data?.restaurants || []

  return (
    <Page title="المطاعم" subtitle={`${list.length} مطعم · ${list.filter((r) => r.isActive).length} ظاهر للزباين`}>
      <div className="space-y-3">
        <Alert>{error?.message || actionError}</Alert>
        {list.length === 0 ? (
          <EmptyState icon="🏪" title="ما في مطاعم لسا" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((r) => (
              <article key={r.id} className={`card flex overflow-hidden ${r.isActive ? '' : 'opacity-70'}`}>
                <RestaurantCover restaurant={r} className="w-20 shrink-0 sm:w-24" />
                <div className="min-w-0 flex-1 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-bold">{r.name}</h2>
                    {r.category && <span className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-600">{r.category}</span>}
                    <span className={`rounded-full px-2 py-1 text-xs ${r.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>
                      {r.isActive ? 'ظاهر' : 'مخفي'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-stone-500">
                    {r.owner.name}
                    {!r.owner.isActive && <span className="text-rose-600"> (حساب موقوف)</span>}
                    {!r.owner.emailVerifiedAt && <span className="text-amber-700"> (الإيميل غير مؤكد، المطعم مش ظاهر للزباين)</span>}
                  </p>
                  <p className="text-xs text-stone-500">
                    {r.menuItemsCount} صنف · {r.ordersCount} طلب {r.address && `· ${r.address}`}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className={r.isActive ? 'btn-danger py-1.5' : 'btn-primary py-1.5'} disabled={busyId === r.id} onClick={() => toggle(r)}>
                      {r.isActive ? 'إخفاء المطعم' : 'إظهار المطعم'}
                    </button>
                    <Link to={`/admin/orders?restaurantId=${r.id}`} className="btn-secondary py-1.5">
                      الطلبات
                    </Link>
                    {r.isActive && (
                      <Link to={`/restaurants/${r.id}`} className="btn-secondary py-1.5">
                        القائمة
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Page>
  )
}
