import { useEffect, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { Page } from '@/components/Layout'
import { useReveal } from '@/components/motion/Reveal'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatDate, ROLE_LABEL } from '@/lib/format'

const ROLES = [
  { value: '', label: 'الكل' },
  { value: 'CUSTOMER', label: 'زباين' },
  { value: 'RESTAURANT_OWNER', label: 'أصحاب مطاعم' },
  { value: 'DRIVER', label: 'سائقين' },
  { value: 'ADMIN', label: 'أدمن' },
]

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [role, setRole] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(id)
  }, [search])

  const { data, error, loading, setData } = useApi('/admin/users', { query: { search: debounced, role } })
  const listRef = useReveal([data?.users])

  const update = async (u, body) => {
    setBusyId(u.id)
    setActionError('')
    try {
      const { user } = await api(`/admin/users/${u.id}`, { method: 'PATCH', body })
      setData((d) => ({ users: d.users.map((x) => (x.id === user.id ? { ...x, ...user } : x)) }))
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const toggle = (u) => {
    if (u.isActive && !window.confirm(`إيقاف حساب «${u.name}»؟ ما رح يقدر يسجّل دخول لحد ما ترجّع تفعّله.`)) return
    update(u, { isActive: !u.isActive })
  }
  const approveDriver = (u, approved) => {
    if (!approved && !window.confirm(`إلغاء موافقة السائق «${u.name}»؟ ما رح يقدر يشوف الطلبات.`)) return
    update(u, { driverApproved: approved })
  }

  return (
    <Page title="المستخدمين" subtitle={data ? `${data.users.length} مستخدم` : undefined}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-500" strokeWidth={1.75} aria-hidden />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الإيميل" aria-label="بحث" className="input rounded-full ps-11" />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="نوع الحساب">
          {ROLES.map((r) => (
            <button
              key={r.value || 'all'}
              onClick={() => setRole(r.value)}
              aria-pressed={role === r.value}
              className="chip"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Alert>{error?.message || actionError}</Alert>
        {loading && !data ? (
          <Spinner />
        ) : data?.users.length === 0 ? (
          <EmptyState icon={Search} title="ما في مستخدمين مطابقين" />
        ) : (
          <ul ref={listRef} className="card divide-y divide-stone-100 overflow-hidden">
            {data?.users.map((u) => (
              <li key={u.id} className={`flex flex-wrap items-center gap-3 p-5 ${u.isActive ? '' : 'bg-tint/[0.04]'}`}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-brand-700 text-[15px] font-semibold text-white">
                  {u.name.trim()[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                    <span className="truncate">{u.name}</span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[12px] font-normal text-stone-600">{ROLE_LABEL[u.role]}</span>
                    {!u.isActive && <span className="rounded-full bg-rose-100 dark:bg-rose-400/15 px-2 py-0.5 text-[12px] font-normal text-rose-700 dark:text-rose-300">موقوف</span>}
                    {u.role === 'DRIVER' && !u.driverApproved && (
                      <span className="rounded-full bg-sky-100 dark:bg-sky-400/15 px-2 py-0.5 text-[12px] font-normal text-sky-800 dark:text-sky-300">بانتظار الموافقة</span>
                    )}
                    {!u.emailVerified && <span className="rounded-full bg-amber-100 dark:bg-amber-400/15 px-2 py-0.5 text-[12px] font-normal text-amber-800 dark:text-amber-300">الإيميل غير مؤكد</span>}
                  </p>
                  <p className="truncate text-[13px] text-stone-500" dir="ltr" style={{ textAlign: 'right' }}>
                    {u.email}
                  </p>
                  <p className="text-[12px] text-stone-500">
                    {u.restaurant
                      ? `مطعم: ${u.restaurant.name} · `
                      : u.role === 'CUSTOMER'
                      ? `${u.ordersCount} طلب · `
                      : u.role === 'DRIVER'
                      ? `${u.phone || ''} · ${u.deliveriesCount} توصيلة · `
                      : ''}
                    انضم {formatDate(u.createdAt)}
                  </p>
                </div>
                {u.role !== 'ADMIN' && (
                  <div className="flex flex-wrap gap-2">
                    {u.role === 'DRIVER' &&
                      (u.driverApproved ? (
                        <button className="btn-secondary h-11 py-0" disabled={busyId === u.id} onClick={() => approveDriver(u, false)}>
                          إلغاء الموافقة
                        </button>
                      ) : (
                        <button className="btn-primary h-11 py-0" disabled={busyId === u.id} onClick={() => approveDriver(u, true)}>
                          <Check className="size-4" strokeWidth={2.25} aria-hidden />
                          موافقة على السائق
                        </button>
                      ))}
                    <button className={u.isActive ? 'btn-danger h-11 py-0' : 'btn-secondary h-11 py-0'} disabled={busyId === u.id} onClick={() => toggle(u)}>
                      {u.isActive ? 'إيقاف الحساب' : 'إعادة التفعيل'}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Page>
  )
}
