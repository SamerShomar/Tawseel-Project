import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { scrollToTop, useLenis } from '@/hooks/useLenis'
import { homeFor } from '@/lib/format'

const YEAR = new Date().getFullYear()

const CUSTOMER_TABS = [
  { to: '/', label: 'المطاعم', icon: '🍽️', end: true },
  { to: '/cart', label: 'السلة', icon: '🛒', badge: 'cart' },
  { to: '/orders', label: 'طلباتي', icon: '🧾' },
  { to: '/account', label: 'حسابي', icon: '👤' },
]

const OWNER_TABS = [
  { to: '/dashboard', label: 'الطلبات', icon: '🧾', end: true },
  { to: '/dashboard/menu', label: 'القائمة', icon: '📋' },
  { to: '/dashboard/settings', label: 'المطعم', icon: '🏪' },
  { to: '/account', label: 'حسابي', icon: '👤' },
]

const ADMIN_TABS = [
  { to: '/admin', label: 'نظرة عامة', icon: '📊', end: true },
  { to: '/admin/users', label: 'المستخدمين', icon: '👥' },
  { to: '/admin/restaurants', label: 'المطاعم', icon: '🏪' },
  { to: '/admin/orders', label: 'الطلبات', icon: '🧾' },
  { to: '/account', label: 'حسابي', icon: '👤' },
]

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:text-ink'}`

function CartBadge({ count, className = '' }) {
  if (!count) return null
  return (
    <span className={`grid min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[11px] leading-5 font-bold text-white ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

/** Top bar. On desktop it holds all links; on phones only the logo (the bottom tab bar has the rest). */
function Navbar() {
  const { user, isOwner, isAdmin, canOrder, logout } = useAuth()
  const { count } = useCart()

  const links = isAdmin
    ? ADMIN_TABS.slice(0, 4)
    : isOwner
    ? OWNER_TABS.slice(0, 3)
    : [{ to: '/', label: 'المطاعم', end: true }, ...(user ? [{ to: '/orders', label: 'طلباتي' }] : [])]

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:h-16">
        <Link to={user ? homeFor(user) : '/'} className="flex items-center gap-2 text-xl font-bold text-ink">
          <img src="/favicon.svg" alt="" className="size-8" />
          توصيل
        </Link>

        <div className="ms-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="ms-auto flex items-center gap-2">
          {canOrder && (
            <Link to="/cart" className="btn-secondary relative hidden px-3 md:inline-flex" aria-label={`السلة (${count})`}>
              🛒 السلة
              <CartBadge count={count} className="absolute -top-1.5 -start-1.5" />
            </Link>
          )}
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm text-stone-500">أهلاً، {user.name.split(' ')[0]}</span>
              <button onClick={logout} className="btn-secondary">
                خروج
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-secondary py-2 md:py-2.5">
                دخول
              </Link>
              <Link to="/register" className="btn-primary hidden md:inline-flex">
                حساب جديد
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

/** App-style bottom navigation, phones only. */
function MobileTabBar() {
  const { isOwner, isAdmin } = useAuth()
  const { count } = useCart()
  const tabs = isAdmin ? ADMIN_TABS : isOwner ? OWNER_TABS : CUSTOMER_TABS

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className={`grid ${tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {tabs.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                  isActive ? 'text-brand-600' : 'text-stone-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`relative text-xl transition ${isActive ? 'scale-110' : 'opacity-70 grayscale'}`} aria-hidden>
                    {t.icon}
                    {t.badge === 'cart' && <CartBadge count={count} className="absolute -top-1.5 -end-3" />}
                  </span>
                  {t.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Layout() {
  useLenis()
  const { pathname } = useLocation()
  useEffect(() => scrollToTop(), [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Bottom padding on phones keeps content above the tab bar. */}
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>
      <footer className="hidden border-t border-stone-200 py-6 text-center text-sm text-stone-500 md:block">
        <p>© {YEAR} توصيل – فريق ORBA</p>
        <p className="mt-1 text-xs text-stone-400">أسماء المطاعم والقوائم المعروضة تجريبية لأغراض العرض</p>
      </footer>
      <MobileTabBar />
    </div>
  )
}

/** Standard page container with a title. */
export function Page({ title, subtitle, actions, children, narrow = false }) {
  return (
    <div className={`mx-auto px-4 py-6 md:py-8 ${narrow ? 'max-w-md' : 'max-w-6xl'}`}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-6">
          <div>
            {title && <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>}
            {subtitle && <p className="mt-1 text-stone-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}
