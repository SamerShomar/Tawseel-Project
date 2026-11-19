import { useState } from 'react'
import { Link } from 'react-router'
import { Page } from '@/components/Layout'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { DRIVER_ACTION, formatDate, formatPrice } from '@/lib/format'
import { DriverGate } from './DriverGate'

function Call({ phone }) {
  if (!phone) return null
  return (
    <a href={`tel:${phone}`} dir="ltr" className="btn-secondary px-3 py-1.5 text-xs">
      📞 {phone}
    </a>
  )
}

function ActiveDelivery({ order, onAction, onRelease, busy }) {
  const next = DRIVER_ACTION[order.status]
  const pickedUp = order.status === 'ON_THE_WAY'
  return (
    <article className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 sm:px-5">
        <h2 className="font-bold">طلب #{order.id}</h2>
        <StatusBadge status={order.status} />
      </div>

      <ol className="space-y-3 p-4 text-sm sm:p-5">
        <li className={`flex items-start gap-3 ${pickedUp ? 'opacity-50' : ''}`}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">1</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-stone-500">استلم من المطعم</p>
            <p className="font-semibold">{order.restaurant.name}</p>
            {order.restaurant.address && <p className="text-stone-600">{order.restaurant.address}</p>}
          </div>
          <Call phone={order.restaurant.phone} />
        </li>
        <li className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sky-100 font-bold text-sky-700">2</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-stone-500">وصّل للزبون</p>
            <p className="font-semibold">{order.customer.name}</p>
            <p className="text-stone-600">{order.deliveryAddress}</p>
            {order.notes && <p className="mt-1 text-amber-800">📝 {order.notes}</p>}
          </div>
          <Call phone={order.phone} />
        </li>
      </ol>

      <details className="border-t border-stone-100 px-4 py-3 text-sm sm:px-5">
        <summary className="cursor-pointer text-stone-600">{order.items.reduce((n, i) => n + i.quantity, 0)} صنف بالطلب</summary>
        <ul className="mt-2 space-y-1">
          {order.items.map((i) => (
            <li key={i.id}>
              {i.quantity} × {i.name}
            </li>
          ))}
        </ul>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 px-4 py-3 sm:px-5">
        <p className="text-sm">
          حصّل من الزبون: <b className="text-base">{formatPrice(order.total)}</b>
        </p>
        <div className="flex gap-2">
          {!pickedUp && (
            <button className="btn-secondary" disabled={busy} onClick={() => onRelease(order)}>
              ترك الطلب
            </button>
          )}
          {next && (
            <button className="btn-primary" disabled={busy} onClick={() => onAction(order, next.status)}>
              {next.label}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export default function DriverMyPage() {
  const { data, error, loading, reload } = useApi('/driver/mine', { pollMs: 30000 })
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  const run = async (order, request) => {
    setBusyId(order.id)
    setActionError('')
    try {
      await request()
      await reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const onAction = (order, status) => {
    if (status === 'DELIVERED' && !window.confirm(`تأكيد توصيل الطلب #${order.id} واستلام ${formatPrice(order.total)}؟`)) return
    run(order, () => api(`/driver/orders/${order.id}/status`, { method: 'PATCH', body: { status } }))
  }
  const onRelease = (order) => {
    if (!window.confirm('ترك الطلب؟ رح يرجع لقائمة الطلبات المتاحة.')) return
    run(order, () => api(`/driver/orders/${order.id}/release`, { method: 'POST' }))
  }

  if (loading) return <Spinner />
  if (error) return <Page title="توصيلاتي">{error.code ? <DriverGate error={error} /> : <Alert>{error.message}</Alert>}</Page>

  const { active, delivered, deliveredCount } = data
  return (
    <Page title="توصيلاتي" subtitle={`${deliveredCount} طلب تم توصيله`}>
      <div className="space-y-6">
        <Alert>{actionError}</Alert>
        <section className="space-y-3">
          <h2 className="font-bold text-stone-600">الطلبات الحالية</h2>
          {active.length === 0 ? (
            <EmptyState icon="🛵" title="ما معك طلبات هلأ">
              <Link to="/driver" className="btn-primary mt-2">
                شوف الطلبات المتاحة
              </Link>
            </EmptyState>
          ) : (
            active.map((o) => <ActiveDelivery key={o.id} order={o} onAction={onAction} onRelease={onRelease} busy={busyId === o.id} />)
          )}
        </section>

        {delivered.length > 0 && (
          <section>
            <h2 className="mb-3 font-bold text-stone-600">آخر التوصيلات</h2>
            <ul className="card divide-y divide-stone-100">
              {delivered.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    #{o.id} · {o.restaurant.name} ← {o.customer.name}
                  </span>
                  <span className="text-xs text-stone-500">{formatDate(o.updatedAt)}</span>
                  <span className="w-16 text-end font-semibold">{formatPrice(o.total)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Page>
  )
}
