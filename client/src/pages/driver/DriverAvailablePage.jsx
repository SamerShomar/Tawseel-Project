import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Page } from '@/components/Layout'
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

  if (loading) return <Spinner />
  const gate = <DriverGate error={error} />
  const orders = data?.orders || []

  return (
    <Page title="طلبات متاحة للتوصيل" subtitle={data ? 'تتحدّث تلقائياً' : undefined}>
      {error ? (
        error.code ? gate : <Alert>{error.message}</Alert>
      ) : (
        <div className="space-y-3">
          <Alert>{actionError}</Alert>
          {orders.length === 0 ? (
            <EmptyState icon="📦" title="ما في طلبات بتستنى سائق هلأ">
              أول ما مطعم يقبل طلب جديد رح يظهر هون.
            </EmptyState>
          ) : (
            orders.map((o) => (
              <article key={o.id} className="card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-bold">
                      #{o.id} · {o.restaurant.name}
                    </h2>
                    <p className="text-xs text-stone-500">{formatDate(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="rounded-xl bg-stone-50 p-3">
                    <span className="block text-xs text-stone-500">الاستلام من</span>
                    🏪 {o.restaurant.address || o.restaurant.name}
                  </p>
                  <p className="rounded-xl bg-stone-50 p-3">
                    <span className="block text-xs text-stone-500">التوصيل إلى</span>
                    📍 {o.deliveryAddress}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    {o.items.reduce((n, i) => n + i.quantity, 0)} صنف · التحصيل من الزبون: <b>{formatPrice(o.total)}</b>
                  </p>
                  <button className="btn-primary" disabled={busyId === o.id} onClick={() => claim(o)}>
                    {busyId === o.id ? 'جاري الحجز…' : '🛵 أنا بوصّله'}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </Page>
  )
}
