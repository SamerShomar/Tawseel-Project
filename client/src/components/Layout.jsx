import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { scrollToTop, useLenis } from '@/hooks/useLenis'

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:text-ink'}`

function Navbar() {
  const { user, isOwner, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // The mobile menu remembers the page it was opened on, so it closes by itself after navigating.
  const [openOn, setOpenOn] = useState(null)
  const open = openOn === pathname
  const setOpen = (fn) => setOpenOn(fn(open) ? pathname : null)

  const links = isOwner
    ? [
        { to: '/dashboard', label: 'الطلبات', end: true },
        { to: '/dashboard/menu', label: 'القائمة' },
        { to: '/dashboard/settings', label: 'المطعم' },
      ]
    : [
        { to: '/', label: 'المطاعم', end: true },
        ...(user ? [{ to: '/orders', label: 'طلباتي' }] : []),
      ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link to={isOwner ? '/dashboard' : '/'} className="flex items-center gap-2 text-xl font-bold text-ink">
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
          {!isOwner && (
            <Link to="/cart" className="btn-secondary relative px-3" aria-label={`السلة (${count})`}>
              🛒
              <span className="hidden sm:inline">السلة</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -start-1.5 grid min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm text-stone-500">أهلاً، {user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="btn-secondary">
                خروج
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="btn-secondary">
                دخول
              </Link>
              <Link to="/register" className="btn-primary">
                حساب جديد
              </Link>
            </div>
          )}

          <button
            className="btn-secondary px-3 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="القائمة"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <button onClick={handleLogout} className="btn-secondary mt-2">
                خروج ({user.name})
              </button>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-secondary">
                  دخول
                </Link>
                <Link to="/register" className="btn-primary">
                  حساب جديد
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

const YEAR = new Date().getFullYear()

export function Layout() {
  useLenis()
  const { pathname } = useLocation()
  useEffect(() => scrollToTop(), [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
        <p>© {YEAR} توصيل – فريق ORBA</p>
        <p className="mt-1 text-xs text-stone-400">أسماء المطاعم والقوائم المعروضة تجريبية لأغراض العرض</p>
      </footer>
    </div>
  )
}

/** Standard page container with a title. */
export function Page({ title, subtitle, actions, children, narrow = false }) {
  return (
    <div className={`mx-auto px-4 py-8 ${narrow ? 'max-w-md' : 'max-w-6xl'}`}>
      {(title || actions) && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
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
