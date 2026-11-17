import { useEffect, useState } from 'react'
import { Page } from '@/components/Layout'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'

const ROLES = [
  { value: '', label: 'الكل' },
  { value: 'CUSTOMER', label: 'زباين' },
  { value: 'RESTAURANT_OWNER', label: 'أصحاب مطاعم' },
  { value: 'ADMIN', label: 'أدمن' },
]
const ROLE_LABEL = { CUSTOMER: 'زبون', RESTAURANT_OWNER: 'صاحب مطعم', ADMIN: 'أدمن' }

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

  const toggle = async (u) => {
    if (u.isActive && !window.confirm(`إيقاف حساب «${u.name}»؟ ما رح يقدر يسجّل دخول لحد ما ترجّع تفعّله.`)) return
    setBusyId(u.id)
    setActionError('')
    try {
      const { user } = await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { isActive: !u.isActive } })
      setData((d) => ({ users: d.users.map((x) => (x.id === user.id ? { ...x, isActive: user.isActive } : x)) }))
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Page title="المستخدمين" subtitle={data ? `${data.users.length} مستخدم` : undefined}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الإيميل…" aria-label="بحث" className="input sm:max-w-xs" />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="نوع الحساب">
          {ROLES.map((r) => (
            <button
              key={r.value || 'all'}
              onClick={() => setRole(r.value)}
              aria-pressed={role === r.value}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                role === r.value ? 'bg-ink text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200'
              }`}
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
          <EmptyState icon="🔍" title="ما في مستخدمين مطابقين" />
        ) : (
          <ul className="card divide-y divide-stone-100 overflow-hidden">
            {data?.users.map((u) => (
              <li key={u.id} className={`flex flex-wrap items-center gap-3 p-4 ${u.isActive ? '' : 'bg-stone-50'}`}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{u.name.trim()[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    <span className="truncate">{u.name}</span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-normal text-stone-600">{ROLE_LABEL[u.role]}</span>
                    {!u.isActive && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-normal text-rose-700">موقوف</span>}
                  </p>
                  <p className="truncate text-sm text-stone-500" dir="ltr" style={{ textAlign: 'right' }}>
                    {u.email}
                  </p>
                  <p className="text-xs text-stone-400">
                    {u.restaurant ? `مطعم: ${u.restaurant.name} · ` : u.role === 'CUSTOMER' ? `${u.ordersCount} طلب · ` : ''}
                    انضم {formatDate(u.createdAt)}
                  </p>
                </div>
                {u.role !== 'ADMIN' && (
                  <button className={u.isActive ? 'btn-danger py-2' : 'btn-secondary py-2'} disabled={busyId === u.id} onClick={() => toggle(u)}>
                    {u.isActive ? 'إيقاف الحساب' : 'إعادة التفعيل'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Page>
  )
}
