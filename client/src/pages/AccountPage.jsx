import { Link, Navigate, useNavigate } from 'react-router'
import {
  Bike,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  ShoppingBag,
  Store,
  UsersRound,
} from 'lucide-react'
import { Page } from '@/components/Layout'
import { useAuth } from '@/context/AuthContext'
import { ROLE_LABEL } from '@/lib/format'

/** Account page: who is logged in, shortcuts for their role, and logout. */
export default function AccountPage() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  if (!loading && !user) return <Navigate to="/login" replace state={{ from: '/account' }} />
  if (!user) return null

  const links =
    user.role === 'DRIVER'
      ? [
          { to: '/driver', label: 'الطلبات المتاحة', icon: Package },
          { to: '/driver/mine', label: 'توصيلاتي', icon: Bike },
        ]
      : user.role === 'ADMIN'
      ? [
          { to: '/admin', label: 'نظرة عامة', icon: LayoutDashboard },
          { to: '/admin/users', label: 'المستخدمين', icon: UsersRound },
          { to: '/admin/restaurants', label: 'المطاعم', icon: Store },
          { to: '/admin/orders', label: 'الطلبات', icon: ReceiptText },
        ]
      : user.role === 'RESTAURANT_OWNER'
      ? [
          { to: '/dashboard', label: 'لوحة الطلبات', icon: ReceiptText },
          { to: '/dashboard/menu', label: 'إدارة القائمة', icon: ClipboardList },
          { to: '/dashboard/settings', label: 'معلومات المطعم', icon: Store },
        ]
      : [
          { to: '/orders', label: 'طلباتي', icon: ReceiptText },
          { to: '/cart', label: 'السلة', icon: ShoppingBag },
        ]

  return (
    <Page title="حسابي" narrow>
      <div className="card flex flex-col items-center p-8 text-center">
        <span className="animate-pop grid size-20 place-items-center rounded-full bg-gradient-to-br from-accent to-brand-700 text-[26px] font-semibold text-white shadow-lg shadow-accent/30">
          {user.name.trim()[0]}
        </span>
        <p className="mt-4 text-[20px] font-semibold">{user.name}</p>
        <p className="text-[13px] text-stone-500" dir="ltr">
          {user.email}
        </p>
        <span className="mt-3 rounded-full bg-black/[0.05] px-3 py-1 text-[12px] text-stone-600">{ROLE_LABEL[user.role]}</span>
      </div>

      <ul className="card mt-4 divide-y divide-stone-100 overflow-hidden">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="flex items-center gap-3 px-5 py-3.5 text-[15px] transition hover:bg-white/60 active:bg-white/80">
              <span className="grid size-8 place-items-center rounded-lg bg-accent text-white" aria-hidden>
                <l.icon className="size-[18px]" strokeWidth={1.75} />
              </span>
              <span className="flex-1">{l.label}</span>
              <ChevronLeft className="size-5 text-stone-400" strokeWidth={1.75} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <button
        className="btn-danger mt-4 w-full"
        onClick={() => {
          logout()
          navigate('/')
        }}
      >
        <LogOut className="size-5" strokeWidth={1.75} aria-hidden />
        تسجيل الخروج
      </button>
    </Page>
  )
}
