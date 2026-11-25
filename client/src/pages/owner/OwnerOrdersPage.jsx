import { useState } from 'react'
import { Bike, MapPin, NotebookPen, Phone, ReceiptText } from 'lucide-react'
import { Page } from '@/components/Layout'
import { useReveal } from '@/components/motion/Reveal'
import { SegmentedControl } from '@/components/SegmentedControl'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatDate, formatPrice, NEXT_ACTION } from '@/lib/format'

const TABS = [
  { key: 'new', label: 'جديدة', match: (s) => s === 'PENDING' },
  { key: 'active', label: 'قيد التنفيذ', match: (s) => ['ACCEPTED', 'PREPARING', 'ON_THE_WAY'].includes(s) },
  { key: 'done', label: 'منتهية', match: (s) => ['DELIVERED', 'REJECTED'].includes(s) },
]

function OrderCard({ order, onStatus, busy }) {
  const next = NEXT_ACTION[order.status]
  return (
    // New orders get an orange ring so they stand out.
    <article className={`card flex flex-col p-5 md:p-6 ${order.status === 'PENDING' ? 'ring-2 ring-accent/40' : ''}`}>
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold">
            طلب #{order.id} · {order.customer.name}
          </h3>
          <p className="text-[12px] text-stone-500">{formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {['ACCEPTED', 'PREPARING', 'ON_THE_WAY'].includes(order.status) && (
        <p className={`mt-3 flex flex-wrap items-center gap-1.5 rounded-2xl px-3 py-2 text-[13px] ${order.driver ? 'bg-sky-50 dark:bg-sky-400/15 text-sky-900 dark:text-sky-300' : 'bg-tint/[0.04] text-stone-600'}`}>
          <Bike className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {order.driver ? (
            <>
              السائق: <b>{order.driver.name}</b>{' '}
              <a href={`tel:${order.driver.phone}`} dir="ltr" className="underline">
                {order.driver.phone}
              </a>
            </>
          ) : (
            'بانتظار سائق يستلم الطلب'
          )}
        </p>
      )}

      <ul className="mt-4 space-y-1 text-[13px]">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between">
            <span>
              <strong>{i.quantity}×</strong> {i.name}
            </span>
            <span className="text-stone-500">{formatPrice(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1.5 rounded-2xl bg-tint/[0.04] p-3 text-[13px]">
        <p className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-stone-500" strokeWidth={1.75} aria-hidden />
          {order.deliveryAddress}
        </p>
        <p className="flex items-center gap-1.5">
          <Phone className="size-4 shrink-0 text-stone-500" strokeWidth={1.75} aria-hidden />
          <a href={`tel:${order.phone}`} dir="ltr" className="-my-3 inline-block py-3 hover:underline">
            {order.phone}
          </a>
        </p>
        {order.notes && (
          <p className="flex items-start gap-1.5 text-amber-800 dark:text-amber-300">
            <NotebookPen className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {order.notes}
          </p>
        )}
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4">
        <span className="text-[15px] font-semibold">{formatPrice(order.total)}</span>
        <div className="flex gap-2">
          {order.status === 'PENDING' && (
            <>
              <button className="btn-danger" disabled={busy} onClick={() => onStatus(order, 'REJECTED')}>
                رفض
              </button>
              <button className="btn-primary" disabled={busy} onClick={() => onStatus(order, 'ACCEPTED')}>
                قبول الطلب
              </button>
            </>
          )}
          {next && (
            <button className="btn-primary" disabled={busy} onClick={() => onStatus(order, next.status)}>
              {next.label}
            </button>
          )}
        </div>
      </footer>
    </article>
  )
}

export default function OwnerOrdersPage() {
  // New orders appear automatically: the list refreshes every 10 seconds.
  const { data, error, loading, setData } = useApi('/my-restaurant/orders', { pollMs: 10000 })
  const [tab, setTab] = useState('new')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  const updateStatus = async (order, status) => {
    if (status === 'REJECTED' && !window.confirm(`رفض الطلب #${order.id}؟`)) return
    setBusyId(order.id)
    setActionError('')
    try {
      const { order: updated } = await api(`/my-restaurant/orders/${order.id}/status`, { method: 'PATCH', body: { status } })
      setData((d) => ({ orders: d.orders.map((o) => (o.id === updated.id ? updated : o)) }))
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const orders = data?.orders || []
  const current = TABS.find((t) => t.key === tab)
  const shown = orders.filter((o) => current.match(o.status))
  const gridRef = useReveal([tab, shown.length])

  if (loading) return <Spinner />

  return (
    <Page title="لوحة الطلبات" subtitle="تتحدّث تلقائياً كل 10 ثواني">
      <div className="mb-6">
        <SegmentedControl
          label="حالة الطلبات"
          value={tab}
          onChange={setTab}
          options={TABS.map((t) => {
            const count = orders.filter((o) => t.match(o.status)).length
            return { key: t.key, label: t.label, badge: count, highlight: t.key === 'new' && count > 0 }
          })}
        />
      </div>

      <div className="space-y-4">
        <Alert>{error?.message || actionError}</Alert>
        {shown.length === 0 ? (
          <EmptyState icon={ReceiptText} title={tab === 'new' ? 'ما في طلبات جديدة حالياً' : 'ما في طلبات هون'}>
            {tab === 'new' && 'أول ما يوصل طلب جديد رح يظهر هون'}
          </EmptyState>
        ) : (
          <div ref={gridRef} className="grid gap-4 md:grid-cols-2">
            {shown.map((o) => (
              <OrderCard key={o.id} order={o} onStatus={updateStatus} busy={busyId === o.id} />
            ))}
          </div>
        )}
      </div>
    </Page>
  )
}
