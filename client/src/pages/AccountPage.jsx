import { Link, Navigate, useNavigate } from 'react-router'
import { Page } from '@/components/Layout'
import { useAuth } from '@/context/AuthContext'
import { ROLE_LABEL } from '@/lib/format'


/** Account page (mainly for the phone tab bar): who is logged in, and logout. */
export default function AccountPage() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  if (!loading && !user) return <Navigate to="/login" replace state={{ from: '/account' }} />
  if (!user) return null

  const links =
    user.role === 'DRIVER'
      ? [
          { to: '/driver', label: 'الطلبات المتاحة', icon: '📦' },
          { to: '/driver/mine', label: 'توصيلاتي', icon: '🛵' },
        ]
      : user.role === 'ADMIN'
      ? [
          { to: '/admin', label: 'نظرة عامة', icon: '📊' },
          { to: '/admin/users', label: 'المستخدمين', icon: '👥' },
          { to: '/admin/restaurants', label: 'المطاعم', icon: '🏪' },
          { to: '/admin/orders', label: 'الطلبات', icon: '🧾' },
        ]
      : user.role === 'RESTAURANT_OWNER'
      ? [
          { to: '/dashboard', label: 'لوحة الطلبات', icon: '🧾' },
          { to: '/dashboard/menu', label: 'إدارة القائمة', icon: '📋' },
          { to: '/dashboard/settings', label: 'معلومات المطعم', icon: '🏪' },
        ]
      : [
          { to: '/orders', label: 'طلباتي', icon: '🧾' },
          { to: '/cart', label: 'السلة', icon: '🛒' },
        ]

  return (
    <Page title="حسابي" narrow>
      <div className="card flex items-center gap-4 p-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
          {user.name.trim()[0]}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{user.name}</p>
          <p className="truncate text-sm text-stone-500" dir="ltr">
            {user.email}
          </p>
          <span className="mt-1 inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">{ROLE_LABEL[user.role]}</span>
        </div>
      </div>

      <ul className="card mt-4 divide-y divide-stone-100 overflow-hidden">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="flex items-center gap-3 px-5 py-4 font-medium active:bg-stone-50">
              <span aria-hidden>{l.icon}</span>
              <span className="flex-1">{l.label}</span>
              <span className="text-stone-400" aria-hidden>
                ‹
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        className="btn-danger mt-4 w-full py-3"
        onClick={() => {
          logout()
          navigate('/')
        }}
      >
        تسجيل الخروج
      </button>
    </Page>
  )
}
