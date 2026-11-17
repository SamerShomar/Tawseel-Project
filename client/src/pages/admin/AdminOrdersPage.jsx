import { Link, useSearchParams } from 'react-router'
import { Page } from '@/components/Layout'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { formatDate, formatPrice, ORDER_STEPS, STATUS } from '@/lib/format'

export default function AdminOrdersPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const restaurantId = params.get('restaurantId') || ''
  const { data, error, loading } = useApi('/admin/orders', { query: { status, restaurantId }, pollMs: 20000 })

  const setStatus = (s) => {
    const next = new URLSearchParams(params)
    if (s) next.set('status', s)
    else next.delete('status')
    setParams(next, { replace: true })
  }

  const orders = data?.orders || []
  const restaurantName = restaurantId && orders[0]?.restaurant.name

  return (
    <Page
      title="كل الطلبات"
      subtitle={restaurantId ? `طلبات ${restaurantName || 'المطعم'}` : data ? `${orders.length} طلب` : undefined}
      actions={
        restaurantId && (
          <Link to={status ? `/admin/orders?status=${status}` : '/admin/orders'} className="btn-secondary py-2">
            كل المطاعم ✕
          </Link>
        )
      }
    >
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="الحالة">
        {['', ...ORDER_STEPS, 'REJECTED'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition ${
              status === s ? 'bg-ink text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'
            }`}
          >
            {s ? STATUS[s].label : 'الكل'}
          </button>
        ))}
      </div>

      <Alert>{error?.message}</Alert>
      {loading && !data ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState icon="🧾" title="ما في طلبات هون" />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/orders/${o.id}`} className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition hover:shadow-md">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    #{o.id} · {o.restaurant.name}
                  </p>
                  <p className="truncate text-sm text-stone-500">
                    {o.customer.name} · {o.items.reduce((n, i) => n + i.quantity, 0)} صنف · {formatDate(o.createdAt)}
                  </p>
                </div>
                <StatusBadge status={o.status} />
                <span className="w-20 text-end font-bold">{formatPrice(o.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
