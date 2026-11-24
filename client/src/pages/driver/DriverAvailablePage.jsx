import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Bike, MapPin, Package, Store } from 'lucide-react'
import { Page } from '@/components/Layout'
import { useReveal } from '@/components/motion/Reveal'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatDate, formatPrice } from '@/lib/format'
import { DriverGate } from './DriverGate'

export default function DriverAvailablePage() {
  // New orders show up by themselves: the list refreshes every 15 seconds.
  const { data, error, loading, reload } = useApi('/driver/available', { pollMs: 15000 })
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const navigate = useNavigate()

  const claim = async (order) => {
    setBusyId(order.id)
    setActionError('')
    try {
      await api(`/driver/orders/${order.id}/claim`, { method: 'POST' })
      navigate('/driver/mine')
    } catch (err) {
      setActionError(err.message)
      setBusyId(null)
      reload()
    }
  }

  const orders = data?.orders || []
  const listRef = useReveal([orders.length])

  if (loading) return <Spinner />
  const gate = <DriverGate error={error} />

  return (
    <Page title="طلبات متاحة للتوصيل" subtitle={data ? 'تتحدّث تلقائياً' : undefined}>
      {error ? (
        error.code ? gate : <Alert>{error.message}</Alert>
      ) : (
        <div className="space-y-3">
          <Alert>{actionError}</Alert>
          {orders.length === 0 ? (
            <EmptyState icon={Package} title="ما في طلبات بتستنى سائق هلأ">
              أول ما مطعم يقبل طلب جديد رح يظهر هون.
            </EmptyState>
          ) : (
            <div ref={listRef} className="space-y-4">
            {orders.map((o) => (
              <article key={o.id} className="card p-5 md:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold">
                      #{o.id} · {o.restaurant.name}
                    </h2>
                    <p className="text-[12px] text-stone-500">{formatDate(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                {/* Route: pickup → drop-off, joined by a dotted line. */}
                <ol className="relative mt-4 space-y-4 rounded-2xl bg-black/[0.04] p-4 text-[13px]">
                  <span className="absolute start-[31px] top-11 bottom-11 border-s-2 border-dotted border-stone-300" aria-hidden />
                  <li className="relative flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-brand-700 shadow-sm">
                      <Store className="size-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div>
                      <span className="block text-[12px] text-stone-500">الاستلام من</span>
                      {o.restaurant.address || o.restaurant.name}
                    </div>
                  </li>
                  <li className="relative flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-white shadow-sm">
                      <MapPin className="size-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div>
                      <span className="block text-[12px] text-stone-500">التوصيل إلى</span>
                      {o.deliveryAddress}
                    </div>
                  </li>
                </ol>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[13px]">
                    {o.items.reduce((n, i) => n + i.quantity, 0)} صنف · التحصيل من الزبون: <b>{formatPrice(o.total)}</b>
                  </p>
                  <button className="btn-primary" disabled={busyId === o.id} onClick={() => claim(o)}>
                    <Bike className="size-5" strokeWidth={1.75} aria-hidden />
                    {busyId === o.id ? 'جاري الحجز…' : 'أنا بوصّله'}
                  </button>
                </div>
              </article>
            ))}
            </div>
          )}
        </div>
      )}
    </Page>
  )
}
