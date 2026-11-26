import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Banknote, Bike, ChevronLeft, ReceiptText, Store, UsersRound } from 'lucide-react'
import { CountUp } from '@/components/motion/CountUp'
import { useReveal } from '@/components/motion/Reveal'
import { Page } from '@/components/Layout'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { formatDate, formatPrice, ORDER_STEPS, STATUS } from '@/lib/format'

function Stat({ icon: Icon, label, value, format, hint, to }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-stone-500">{label}</span>
        <Icon className="size-5 text-brand-700" strokeWidth={1.75} aria-hidden />
      </div>
      <p className="mt-2 text-[24px] font-semibold tabular-nums sm:text-[28px]">
        <CountUp value={value} format={format} />
      </p>
      {hint && <p className="mt-1 text-[13px] text-stone-500">{hint}</p>}
    </>
  )
  return to ? (
    <Link to={to} data-tilt="12" className="card block p-5">
      {body}
    </Link>
  ) : (
    <div className="card p-5">{body}</div>
  )
}

/** Horizontal bar that grows from zero to its share when the page opens. */
function Bar({ share, className }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(share))
    return () => cancelAnimationFrame(id)
  }, [share])
  return (
    <div className="h-2 overflow-hidden rounded-full bg-stone-100">
      <div className={`h-full rounded-full transition-[width] duration-1000 ease-apple ${className}`} style={{ width: `${width * 100}%` }} />
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data, error, loading } = useApi('/admin/stats', { pollMs: 30000 })
  const statsRef = useReveal([Boolean(data)])

  if (loading) return <Spinner />
  if (error) return <Page title="نظرة عامة"><Alert>{error.message}</Alert></Page>

  const { users, pendingDrivers, restaurants, orders, deliveredRevenue, recentOrders } = data
  const statuses = [...ORDER_STEPS, 'REJECTED']
  const maxStatus = Math.max(1, ...statuses.map((s) => orders.byStatus[s]))

  return (
    <Page title="لوحة الإدارة" subtitle="نظرة عامة على الموقع">
      {pendingDrivers > 0 && (
        <Link to="/admin/users" className="mb-5 flex items-center gap-3 rounded-[18px] bg-sky-50 dark:bg-sky-400/15 p-4 text-[16px] text-sky-900 dark:text-sky-300 transition hover:bg-sky-100 dark:hover:bg-sky-400/25">
          <Bike className="size-6 shrink-0" strokeWidth={1.5} aria-hidden />
          <span className="flex-1">
            <b>{pendingDrivers}</b> سائق بانتظار موافقتك
          </span>
          <span className="flex items-center text-[14px]">
            مراجعة
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          </span>
        </Link>
      )}

      <div ref={statsRef} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={UsersRound} label="المستخدمين" value={users.CUSTOMER + users.RESTAURANT_OWNER + users.DRIVER} hint={`${users.CUSTOMER} زبون · ${users.RESTAURANT_OWNER} مطعم · ${users.DRIVER} سائق`} to="/admin/users" />
        <Stat icon={Store} label="المطاعم" value={restaurants.total} hint={`${restaurants.active} ظاهر للزباين`} to="/admin/restaurants" />
        <Stat icon={ReceiptText} label="الطلبات" value={orders.total} hint={`${orders.today} اليوم`} to="/admin/orders" />
        <Stat icon={Banknote} label="المبيعات المسلّمة" value={deliveredRevenue} format={formatPrice} hint="مجموع الطلبات اللي تم توصيلها" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <section className="card p-5 md:p-7 lg:col-span-2">
          <h2 className="mb-4 text-[19px] font-semibold">الطلبات حسب الحالة</h2>
          <ul className="space-y-3">
            {statuses.map((s) => (
              <li key={s}>
                <Link to={`/admin/orders?status=${s}`} className="block py-1.5">
                  <div className="mb-1 flex justify-between text-[14px]">
                    <span>{STATUS[s].label}</span>
                    <span className="font-semibold tabular-nums">{orders.byStatus[s]}</span>
                  </div>
                  <Bar share={orders.byStatus[s] / maxStatus} className={s === 'REJECTED' ? 'bg-rose-400' : s === 'DELIVERED' ? 'bg-emerald-500' : 'bg-accent'} />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 md:p-7 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[19px] font-semibold">آخر الطلبات</h2>
            <Link to="/admin/orders" className="link py-3 text-[14px]">
              عرض الكل
              <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-stone-500">ما في طلبات لسا</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-semibold">
                        #{o.id} · {o.restaurant.name}
                      </p>
                      <p className="truncate text-[13px] text-stone-500">
                        {o.customer.name} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                    <span className="w-16 text-end text-[14px] font-semibold">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Page>
  )
}
