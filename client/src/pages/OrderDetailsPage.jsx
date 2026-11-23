import { Link, useLocation, useParams } from 'react-router'
import { Page } from '@/components/Layout'
import { OrderProgress } from '@/components/OrderProgress'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/hooks/useApi'
import { formatDate, formatPrice, isActiveOrder } from '@/lib/format'

const BACK = {
  ADMIN: { to: '/admin/orders', label: 'كل الطلبات' },
  DRIVER: { to: '/driver/mine', label: 'توصيلاتي' },
  RESTAURANT_OWNER: { to: '/dashboard', label: 'لوحة الطلبات' },
}

export default function OrderDetailsPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const { user } = useAuth()
  // Refresh every 10 seconds so the customer sees status changes without reloading.
  const { data, error, loading } = useApi(`/orders/${id}`, { pollMs: 10000 })

  if (loading) return <Spinner />
  if (error && !data)
    return (
      <Page narrow>
        <Alert>{error.message}</Alert>
      </Page>
    )

  const { order } = data
  return (
    <Page
      title={`طلب #${order.id}`}
      subtitle={`${order.restaurant.name} · ${formatDate(order.createdAt)}`}
      actions={<StatusBadge status={order.status} />}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        {state?.justPlaced && <Alert type="success">تم إرسال طلبك بنجاح! رح يوصلك إشعار هون لما المطعم يأكّده.</Alert>}

        <section className="card p-5 sm:p-6">
          <OrderProgress status={order.status} />
          {isActiveOrder(order.status) && <p className="mt-4 text-center text-xs text-stone-500">يتم تحديث الحالة تلقائياً</p>}
        </section>

        {order.driver && isActiveOrder(order.status) && (
          <section className="card flex items-center gap-4 p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sky-100 text-2xl" aria-hidden>
              🛵
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-stone-500">سائق التوصيل</p>
              <p className="font-bold">{order.driver.name}</p>
              <p className="text-sm text-stone-500" dir="ltr" style={{ textAlign: 'right' }}>
                {order.driver.phone}
              </p>
            </div>
            <a href={`tel:${order.driver.phone}`} className="btn-primary shrink-0" aria-label={`اتصال بالسائق ${order.driver.phone}`}>
              📞 اتصال
            </a>
          </section>
        )}

        <section className="card p-5">
          <h2 className="mb-3 font-bold">تفاصيل الطلب</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between py-2">
                <span>
                  {i.quantity} × {i.name}
                </span>
                <span>{formatPrice(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 font-bold">
            <span>المجموع (الدفع عند الاستلام)</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </section>

        <section className="card grid gap-3 p-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-stone-500">عنوان التوصيل</p>
            <p className="font-medium">{order.deliveryAddress}</p>
          </div>
          <div>
            <p className="text-stone-500">رقم الهاتف</p>
            <p className="font-medium" dir="ltr">
              {order.phone}
            </p>
          </div>
          {order.notes && (
            <div className="sm:col-span-2">
              <p className="text-stone-500">ملاحظات</p>
              <p className="font-medium">{order.notes}</p>
            </div>
          )}
        </section>

        <Link to={BACK[user?.role]?.to || '/orders'} className="inline-block text-sm text-brand-700 hover:underline">
          → {BACK[user?.role]?.label || 'كل طلباتي'}
        </Link>
      </div>
    </Page>
  )
}
