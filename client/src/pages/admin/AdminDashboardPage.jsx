import { Link } from 'react-router'
import { Page } from '@/components/Layout'
import { StatusBadge } from '@/components/StatusBadge'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { formatDate, formatPrice, ORDER_STEPS, STATUS } from '@/lib/format'

function Stat({ icon, label, value, hint, to }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-500">{label}</span>
        <span className="text-xl" aria-hidden>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </>
  )
  return to ? (
    <Link to={to} className="card block p-4 transition hover:shadow-md sm:p-5">
      {body}
    </Link>
  ) : (
    <div className="card p-4 sm:p-5">{body}</div>
  )
}

export default function AdminDashboardPage() {
  const { data, error, loading } = useApi('/admin/stats', { pollMs: 30000 })

  if (loading) return <Spinner />
  if (error) return <Page title="نظرة عامة"><Alert>{error.message}</Alert></Page>

  const { users, restaurants, orders, deliveredRevenue, recentOrders } = data
  const statuses = [...ORDER_STEPS, 'REJECTED']
  const maxStatus = Math.max(1, ...statuses.map((s) => orders.byStatus[s]))

  return (
    <Page title="لوحة الإدارة" subtitle="نظرة عامة على الموقع">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon="👥" label="المستخدمين" value={users.CUSTOMER + users.RESTAURANT_OWNER} hint={`${users.CUSTOMER} زبون · ${users.RESTAURANT_OWNER} صاحب مطعم`} to="/admin/users" />
        <Stat icon="🏪" label="المطاعم" value={restaurants.total} hint={`${restaurants.active} ظاهر للزباين`} to="/admin/restaurants" />
        <Stat icon="🧾" label="الطلبات" value={orders.total} hint={`${orders.today} اليوم`} to="/admin/orders" />
        <Stat icon="💵" label="المبيعات المسلّمة" value={formatPrice(deliveredRevenue)} hint="مجموع الطلبات اللي تم توصيلها" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold">الطلبات حسب الحالة</h2>
          <ul className="space-y-3">
            {statuses.map((s) => (
              <li key={s}>
                <Link to={`/admin/orders?status=${s}`} className="block">
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{STATUS[s].label}</span>
                    <span className="font-semibold tabular-nums">{orders.byStatus[s]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={`h-full rounded-full ${s === 'REJECTED' ? 'bg-rose-400' : s === 'DELIVERED' ? 'bg-emerald-500' : 'bg-brand-500'}`}
                      style={{ width: `${(orders.byStatus[s] / maxStatus) * 100}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">آخر الطلبات</h2>
            <Link to="/admin/orders" className="text-sm text-brand-700 hover:underline">
              عرض الكل
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-500">ما في طلبات لسا</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        #{o.id} · {o.restaurant.name}
                      </p>
                      <p className="truncate text-xs text-stone-500">
                        {o.customer.name} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                    <span className="w-16 text-end text-sm font-bold">{formatPrice(o.total)}</span>
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
