import { useState } from 'react'
import { Link } from 'react-router'
import { Bike, MapPin, NotebookPen, Phone, Store } from 'lucide-react'
import { Page } from '@/components/Layout'
import { useReveal } from '@/components/motion/Reveal'
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
    <a href={`tel:${phone}`} className="btn-secondary size-11 shrink-0 p-0" aria-label={`اتصال ${phone}`} title={phone}>
      <Phone className="size-4" strokeWidth={1.75} aria-hidden />
    </a>
  )
}

function ActiveDelivery({ order, onAction, onRelease, busy }) {
  const next = DRIVER_ACTION[order.status]
  const pickedUp = order.status === 'ON_THE_WAY'
  return (
    <article className="card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-5 py-4">
        <h2 className="text-[17px] font-semibold">طلب #{order.id}</h2>
        <StatusBadge status={order.status} />
      </div>

      <ol className="relative space-y-5 p-5 text-[14px]">
        <span className="absolute start-[35px] top-14 bottom-14 border-s-2 border-dotted border-stone-300" aria-hidden />
        <li className={`relative flex items-start gap-3 transition-opacity duration-500 ${pickedUp ? 'opacity-50' : ''}`}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/80 text-brand-700 ring-1 ring-black/5">
            <Store className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-stone-500">استلم من المطعم</p>
            <p className="font-semibold">{order.restaurant.name}</p>
            {order.restaurant.address && <p className="text-stone-600">{order.restaurant.address}</p>}
          </div>
          <Call phone={order.restaurant.phone} />
        </li>
        <li className="relative flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-white">
            <MapPin className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-stone-500">وصّل للزبون</p>
            <p className="font-semibold">{order.customer.name}</p>
            <p className="text-stone-600">{order.deliveryAddress}</p>
            {order.notes && (
              <p className="mt-1 flex items-start gap-1.5 text-amber-800">
                <NotebookPen className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                {order.notes}
              </p>
            )}
          </div>
          <Call phone={order.phone} />
        </li>
      </ol>

      <details className="border-t border-stone-100 px-5 text-[14px]">
        <summary className="cursor-pointer py-3 text-stone-600">{order.items.reduce((n, i) => n + i.quantity, 0)} صنف بالطلب</summary>
        <ul className="space-y-1 pb-3">
          {order.items.map((i) => (
            <li key={i.id}>
              {i.quantity} × {i.name}
            </li>
          ))}
        </ul>
      </details>

      {/* Phones: total on its own line, then the buttons side by side across the full width. */}
      <div className="flex flex-col gap-3 bg-black/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[14px]">
          حصّل من الزبون: <b className="text-[17px]">{formatPrice(order.total)}</b>
        </p>
        <div className="flex gap-2 whitespace-nowrap">
          {!pickedUp && (
            <button className="btn-secondary" disabled={busy} onClick={() => onRelease(order)}>
              ترك الطلب
            </button>
          )}
          {next && (
            <button className="btn-primary flex-1 sm:flex-none" disabled={busy} onClick={() => onAction(order, next.status)}>
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

  const activeRef = useReveal([data?.active?.length])

  if (loading) return <Spinner />
  if (error) return <Page title="توصيلاتي">{error.code ? <DriverGate error={error} /> : <Alert>{error.message}</Alert>}</Page>

  const { active, delivered, deliveredCount } = data
  return (
    <Page title="توصيلاتي" subtitle={`${deliveredCount} طلب تم توصيله`}>
      <div className="space-y-6">
        <Alert>{actionError}</Alert>
        <section>
          <h2 className="mb-4 text-[21px] font-semibold">الطلبات الحالية</h2>
          {active.length === 0 ? (
            <EmptyState icon={Bike} title="ما معك طلبات هلأ">
              <Link to="/driver" className="btn-primary mt-2">
                شوف الطلبات المتاحة
              </Link>
            </EmptyState>
          ) : (
            <div ref={activeRef} className="space-y-4">
              {active.map((o) => (
                <ActiveDelivery key={o.id} order={o} onAction={onAction} onRelease={onRelease} busy={busyId === o.id} />
              ))}
            </div>
          )}
        </section>

        {delivered.length > 0 && (
          <section>
            <h2 className="mb-4 text-[21px] font-semibold">آخر التوصيلات</h2>
            <ul className="card divide-y divide-stone-100">
              {delivered.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3.5 text-[14px]">
                  <span className="min-w-0 flex-1 truncate">
                    #{o.id} · {o.restaurant.name} ← {o.customer.name}
                  </span>
                  <span className="text-[12px] text-stone-500">{formatDate(o.updatedAt)}</span>
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
