import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, ReceiptText, X } from 'lucide-react'
import { useReveal } from '@/components/motion/Reveal'
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
  const listRef = useReveal([orders])
  const restaurantName = restaurantId && orders[0]?.restaurant.name

  return (
    <Page
      title="كل الطلبات"
      subtitle={restaurantId ? `طلبات ${restaurantName || 'المطعم'}` : data ? `${orders.length} طلب` : undefined}
      actions={
        restaurantId && (
          <Link to={status ? `/admin/orders?status=${status}` : '/admin/orders'} className="btn-secondary">
            كل المطاعم
            <X className="size-4" strokeWidth={2} aria-hidden />
          </Link>
        )
      }
    >
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="الحالة">
        {['', ...ORDER_STEPS, 'REJECTED'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className="chip"
          >
            {s ? STATUS[s].label : 'الكل'}
          </button>
        ))}
      </div>

      <Alert>{error?.message}</Alert>
      {loading && !data ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState icon={ReceiptText} title="ما في طلبات هون" />
      ) : (
        <ul ref={listRef} className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to={`/orders/${o.id}`}
                className="card flex flex-wrap items-center gap-x-4 gap-y-2 p-5 transition duration-300 active:scale-[0.99] sm:hover:scale-[1.01] sm:hover:shadow-[2px_4px_16px_rgb(0_0_0/0.16)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    #{o.id} · {o.restaurant.name}
                  </p>
                  <p className="truncate text-[13px] text-stone-500">
                    {o.customer.name} · {o.items.reduce((n, i) => n + i.quantity, 0)} صنف · {formatDate(o.createdAt)}
                  </p>
                </div>
                <StatusBadge status={o.status} />
                <span className="w-20 text-end text-[15px] font-semibold">{formatPrice(o.total)}</span>
                <ChevronLeft className="size-5 text-stone-400" strokeWidth={1.75} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
