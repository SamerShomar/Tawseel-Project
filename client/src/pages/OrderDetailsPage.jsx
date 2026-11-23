import { Link, useLocation, useParams } from 'react-router'
import { Bike, ChevronRight, Phone } from 'lucide-react'
import { Aurora } from '@/components/motion/Aurora'
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

        {/* Tracker on frosted glass over slowly drifting color. */}
        <section className="relative overflow-hidden rounded-[24px] bg-stone-50 p-3 sm:p-5">
          <Aurora />
          <div className="glass relative rounded-[20px] p-5 sm:p-7">
            <OrderProgress status={order.status} />
            {isActiveOrder(order.status) && <p className="mt-5 text-center text-[12px] text-stone-600">يتم تحديث الحالة تلقائياً</p>}
          </div>
        </section>

        {order.driver && isActiveOrder(order.status) && (
          <section className="card flex items-center gap-4 p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-stone-50 text-brand-700" aria-hidden>
              <Bike className="size-6" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-stone-500">سائق التوصيل</p>
              <p className="text-[17px] font-semibold">{order.driver.name}</p>
              <p className="text-[14px] text-stone-500" dir="ltr" style={{ textAlign: 'right' }}>
                {order.driver.phone}
              </p>
            </div>
            <a href={`tel:${order.driver.phone}`} className="btn-primary shrink-0" aria-label={`اتصال بالسائق ${order.driver.phone}`}>
              <Phone className="size-4" strokeWidth={2} aria-hidden />
              اتصال
            </a>
          </section>
        )}

        <section className="card p-5 md:p-7">
          <h2 className="mb-3 text-[21px] font-semibold">تفاصيل الطلب</h2>
          <ul className="divide-y divide-stone-100 text-[17px]">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between py-3">
                <span>
                  {i.quantity} × {i.name}
                </span>
                <span>{formatPrice(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-stone-200 pt-4 text-[17px] font-semibold">
            <span>المجموع (الدفع عند الاستلام)</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </section>

        <section className="card grid gap-4 p-5 text-[17px] md:p-7 sm:grid-cols-2">
          <div>
            <p className="text-[12px] text-stone-500">عنوان التوصيل</p>
            <p className="font-medium">{order.deliveryAddress}</p>
          </div>
          <div>
            <p className="text-[12px] text-stone-500">رقم الهاتف</p>
            <p className="font-medium" dir="ltr">
              {order.phone}
            </p>
          </div>
          {order.notes && (
            <div className="sm:col-span-2">
              <p className="text-[12px] text-stone-500">ملاحظات</p>
              <p className="font-medium">{order.notes}</p>
            </div>
          )}
        </section>

        <Link to={BACK[user?.role]?.to || '/orders'} className="link py-2.5">
          <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
          {BACK[user?.role]?.label || 'كل طلباتي'}
        </Link>
      </div>
    </Page>
  )
}
