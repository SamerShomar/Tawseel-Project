import { useState } from 'react'
import { Page } from '@/components/Layout'
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
    <article className="card flex flex-col p-5">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold">
            طلب #{order.id} · {order.customer.name}
          </h3>
          <p className="text-xs text-stone-500">{formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {['ACCEPTED', 'PREPARING', 'ON_THE_WAY'].includes(order.status) && (
        <p className={`mt-3 rounded-xl px-3 py-2 text-sm ${order.driver ? 'bg-sky-50 text-sky-900' : 'bg-stone-50 text-stone-600'}`}>
          🛵{' '}
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

      <ul className="mt-4 space-y-1 text-sm">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between">
            <span>
              <strong>{i.quantity}×</strong> {i.name}
            </span>
            <span className="text-stone-500">{formatPrice(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1 rounded-xl bg-stone-50 p-3 text-sm">
        <p>📍 {order.deliveryAddress}</p>
        <p dir="ltr" className="text-end">
          📞 {order.phone}
        </p>
        {order.notes && <p className="text-amber-800">📝 {order.notes}</p>}
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4">
        <span className="font-bold">{formatPrice(order.total)}</span>
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

  if (loading) return <Spinner />
  const orders = data?.orders || []
  const current = TABS.find((t) => t.key === tab)
  const shown = orders.filter((o) => current.match(o.status))

  return (
    <Page title="لوحة الطلبات" subtitle="تتحدّث تلقائياً كل 10 ثواني">
      <div className="mb-6 flex gap-2 overflow-x-auto" role="tablist">
        {TABS.map((t) => {
          const count = orders.filter((o) => t.match(o.status)).length
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
                tab === t.key ? 'bg-ink text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'
              }`}
            >
              {t.label}
              <span className={`rounded-full px-2 text-xs ${tab === t.key ? 'bg-white/20' : t.key === 'new' && count ? 'bg-brand-500 text-white' : 'bg-stone-100'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        <Alert>{error?.message || actionError}</Alert>
        {shown.length === 0 ? (
          <EmptyState icon="🧾" title={tab === 'new' ? 'ما في طلبات جديدة حالياً' : 'ما في طلبات هون'}>
            {tab === 'new' && 'أول ما يوصل طلب جديد رح يظهر هون'}
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((o) => (
              <OrderCard key={o.id} order={o} onStatus={updateStatus} busy={busyId === o.id} />
            ))}
          </div>
        )}
      </div>
    </Page>
  )
}
