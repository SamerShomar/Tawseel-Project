import { Link } from 'react-router'
import { ChevronLeft, ReceiptText } from 'lucide-react'
import { useReveal } from '@/components/motion/Reveal'
import { Page } from '@/components/Layout'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { formatDate, formatPrice, isActiveOrder } from '@/lib/format'

function OrderList({ title, orders }) {
  const ref = useReveal([orders.length])
  return (
    <section>
      <h2 className="mb-4 text-[18px] font-semibold">{title}</h2>
      <div ref={ref} className="space-y-3">
        {orders.map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
      </div>
    </section>
  )
}

function OrderRow({ order }) {
  return (
    <Link
      to={`/orders/${order.id}`}
      className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-5 transition duration-300 active:scale-[0.99] sm:hover:scale-[1.01] sm:hover:shadow-[2px_4px_16px_rgb(0_0_0/0.16)]"
    >
      <div className="flex-1">
        <p className="text-[15px] font-semibold">
          {order.restaurant.name} <span className="text-[13px] font-normal text-stone-500">#{order.id}</span>
        </p>
        <p className="text-[13px] text-stone-500">
          {formatDate(order.createdAt)} · {order.items.reduce((n, i) => n + i.quantity, 0)} صنف
        </p>
      </div>
      <StatusBadge status={order.status} />
      <span className="w-20 text-end text-[15px] font-semibold">{formatPrice(order.total)}</span>
      <ChevronLeft className="size-5 text-stone-400" strokeWidth={1.75} aria-hidden />
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
        <EmptyState icon={ReceiptText} title="ما عندك طلبات لسا">
          <Link to="/" className="btn-primary mt-2">
            اطلب أول طلب
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-10">
          {active.length > 0 && <OrderList title="طلبات جارية" orders={active} />}
          {past.length > 0 && <OrderList title="الطلبات السابقة" orders={past} />}
        </div>
      )}
    </Page>
  )
}
