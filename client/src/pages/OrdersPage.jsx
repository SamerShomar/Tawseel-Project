import { Link } from 'react-router'
import { Page } from '@/components/Layout'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { formatDate, formatPrice, isActiveOrder } from '@/lib/format'

function OrderRow({ order }) {
  return (
    <Link to={`/orders/${order.id}`} className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition hover:shadow-md">
      <div className="flex-1">
        <p className="font-bold">
          {order.restaurant.name} <span className="text-sm font-normal text-stone-500">#{order.id}</span>
        </p>
        <p className="text-sm text-stone-500">
          {formatDate(order.createdAt)} · {order.items.reduce((n, i) => n + i.quantity, 0)} صنف
        </p>
      </div>
      <StatusBadge status={order.status} />
      <span className="w-20 text-end font-bold">{formatPrice(order.total)}</span>
    </Link>
  )
}

export default function OrdersPage() {
  const { data, error, loading } = useApi('/orders', { pollMs: 15000 })

  if (loading) return <Spinner />
  const orders = data?.orders || []
  const active = orders.filter((o) => isActiveOrder(o.status))
  const past = orders.filter((o) => !isActiveOrder(o.status))

  return (
    <Page title="طلباتي">
      <Alert>{error?.message}</Alert>
      {orders.length === 0 ? (
        <EmptyState icon="🧾" title="ما عندك طلبات لسا">
          <Link to="/" className="btn-primary mt-2">
            اطلب أول طلب
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 font-bold text-stone-600">طلبات جارية</h2>
              <div className="space-y-3">
                {active.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 font-bold text-stone-600">الطلبات السابقة</h2>
              <div className="space-y-3">
                {past.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Page>
  )
}
