import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { Moon, ShoppingBag, Sun, UserRound } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { scrollToTop, setScrollLocked, useLenis } from '@/hooks/useLenis'
import { homeFor } from '@/lib/format'
import { useTheme } from '@/lib/theme'
import { Backdrop } from './motion/Backdrop'
import { Spinner } from './ui/Spinner'
import { usePointerEffects } from './motion/usePointerEffects'
import { VerifyEmailBanner } from './VerifyEmailBanner'

const YEAR = new Date().getFullYear()

const CUSTOMER_LINKS = [
  { to: '/', label: 'المطاعم', end: true },
  { to: '/orders', label: 'طلباتي' },
]

const OWNER_LINKS = [
  { to: '/dashboard', label: 'الطلبات', end: true },
  { to: '/dashboard/menu', label: 'القائمة' },
  { to: '/dashboard/settings', label: 'المطعم' },
]

const ADMIN_LINKS = [
  { to: '/admin', label: 'نظرة عامة', end: true },
  { to: '/admin/users', label: 'المستخدمين' },
  { to: '/admin/restaurants', label: 'المطاعم' },
  { to: '/admin/orders', label: 'الطلبات' },
]

const DRIVER_LINKS = [
  { to: '/driver', label: 'طلبات متاحة', end: true },
  { to: '/driver/mine', label: 'توصيلاتي' },
]

function useNavLinks() {
  const { user, isOwner, isAdmin, isDriver } = useAuth()
  if (isAdmin) return ADMIN_LINKS
  if (isDriver) return DRIVER_LINKS
  if (isOwner) return OWNER_LINKS
  return user ? CUSTOMER_LINKS : CUSTOMER_LINKS.slice(0, 1)
}

function CartBadge({ count }) {
  if (!count) return null
  return (
    // key={count} replays the pop animation each time the number changes.
    <span
      key={count}
      className="animate-pop absolute -end-1.5 top-1 grid min-w-[18px] place-items-center rounded-full bg-sun px-1 text-[11px] leading-[18px] font-bold text-on-sun"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

/** Icon buttons in the bar: 44×44 hit area around an 18px glyph, as on apple.com. */
const iconBtn = 'group relative grid size-11 place-items-center text-ink/80 transition hover:text-ink'

/** Sun / moon button that switches between light and dark mode. */
function ThemeButton() {
  const [theme, toggle] = useTheme()
  const dark = theme === 'dark'
  const Icon = dark ? Sun : Moon
  return (
    <button type="button" onClick={toggle} className={iconBtn} aria-label={dark ? 'الوضع الفاتح' : 'الوضع الداكن'} title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}>
      <Icon key={theme} className="animate-pop size-[18px] transition duration-300 ease-apple group-hover:rotate-45" strokeWidth={1.5} aria-hidden />
    </button>
  )
}

/** Two lines that turn into an ×, like apple.com's mobile menu button. */
function MenuButton({ open, onClick }) {
  const line = 'absolute start-3 h-[1.5px] w-[18px] rounded-full bg-current transition-transform duration-300'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${iconBtn} md:hidden`}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? 'إغلاق القائمة' : 'القائمة'}
    >
      <span className={`${line} ${open ? 'translate-y-0 rotate-45' : '-translate-y-[3.5px]'}`} />
      <span className={`${line} ${open ? 'translate-y-0 -rotate-45' : 'translate-y-[3.5px]'}`} />
    </button>
  )
}

/** Full-screen frosted-glass menu on phones: large links that slide in one after another. */
function MobileMenu({ open, links, onClose }) {
  const { user, canOrder, logout } = useAuth()

  const items = [
    ...links,
    ...(canOrder ? [{ to: '/cart', label: 'السلة' }] : []),
    ...(user
      ? [{ to: '/account', label: 'حسابي' }]
      : [
          { to: '/login', label: 'تسجيل الدخول' },
          { to: '/register', label: 'حساب جديد' },
        ]),
  ]

  return (
    <div
      id="mobile-menu"
      className={`fixed inset-x-0 top-[calc(3rem+env(safe-area-inset-top))] bottom-0 z-40 overflow-y-auto bg-surface/80 backdrop-blur-2xl backdrop-saturate-[1.8] transition-opacity duration-300 md:hidden ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      inert={!open}
    >
      <ul className="px-10 pt-6 pb-10">
        {items.map((l, i) => (
          <li
            key={l.to}
            className={`transition duration-500 ${open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
            style={{ transitionDelay: open ? `${80 + i * 40}ms` : '0ms' }}
          >
            <NavLink to={l.to} end={l.end} onClick={onClose} className="block py-2 text-[24px] leading-tight font-semibold text-ink">
              {l.label}
            </NavLink>
          </li>
        ))}
        {user && (
          <li
            className={`mt-6 transition duration-500 ${open ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: open ? `${80 + items.length * 40}ms` : '0ms' }}
          >
            <p className="text-[12px] text-stone-500">مسجّل باسم {user.name}</p>
            <button
              type="button"
              onClick={() => {
                onClose()
                logout()
              }}
              className="mt-1 py-2 text-[15px] text-brand-700"
            >
              تسجيل الخروج
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}

/** Global navigation: thin translucent bar, centered links on desktop, menu button on phones. */
function Navbar() {
  const { user, canOrder, logout } = useAuth()
  const { count } = useCart()
  const { pathname } = useLocation()
  const links = useNavLinks()
  const [open, setOpen] = useState(false)

  // Close the menu after navigating, and on Escape.
  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    if (!open) return
    setScrollLocked(true)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      setScrollLocked(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      {/* On the home page the global bar scrolls away and the page's own glass bar sticks instead, as on a product page. */}
      <header
        className={`${pathname === '/' && !open ? 'relative' : 'sticky top-0'} z-50 pt-[env(safe-area-inset-top)] transition-colors ${
          open ? 'bg-surface/80 backdrop-blur-2xl' : 'material-bar'
        }`}
      >
        <nav className="mx-auto flex h-12 max-w-5xl items-center gap-1 px-4">
          <Link to={user ? homeFor(user) : '/'} className="flex h-11 translate-y-1 items-center gap-2.5 text-[19px] leading-none font-semibold text-ink">
            <img src="/favicon.svg" alt="" className="size-8" />
            توصيل
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => `nav-link py-3 text-[12px] transition ${isActive ? 'text-ink' : 'text-ink/70 hover:text-ink'}`}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="ms-auto flex items-center md:ms-0">
            <ThemeButton />
            {canOrder && (
              <Link to="/cart" className={iconBtn} aria-label={`السلة (${count})`}>
                <ShoppingBag className="size-[18px] transition duration-300 ease-apple group-hover:-translate-y-0.5 group-hover:-rotate-12" strokeWidth={1.5} aria-hidden />
                <CartBadge count={count} />
              </Link>
            )}
            {user ? (
              <>
                <Link to="/account" className={`${iconBtn} hidden md:grid`} aria-label="حسابي">
                  <UserRound className="size-[18px] transition duration-300 ease-apple group-hover:scale-110" strokeWidth={1.5} aria-hidden />
                </Link>
                <button onClick={logout} className="hidden px-2 py-3 text-[12px] text-ink/70 transition hover:text-ink md:block">
                  خروج
                </button>
              </>
            ) : (
              <Link to="/login" className="hidden px-2 py-3 text-[12px] text-ink/70 transition hover:text-ink md:block">
                تسجيل الدخول
              </Link>
            )}
            <MenuButton open={open} onClick={() => setOpen((o) => !o)} />
          </div>
        </nav>
      </header>
      <MobileMenu open={open} links={links} onClose={() => setOpen(false)} />
    </>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/60 bg-surface/55 dark:border-white/10 text-[12px] leading-relaxed text-stone-600 backdrop-blur-xl dark:bg-stone-100 dark:backdrop-filter-none">
      <div className="mx-auto max-w-5xl px-4 py-5">
        <p className="border-b border-tint/10 pb-3">أسماء المطاعم والقوائم المعروضة تجريبية لأغراض العرض. الدفع عند الاستلام.</p>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
          <p>© {YEAR} توصيل – فريق ORBA. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            <Link to="/" className="py-2 hover:underline">
              المطاعم
            </Link>
            <Link to="/register?role=owner" className="py-2 hover:underline">
              سجّل مطعمك
            </Link>
            <Link to="/register?role=driver" className="py-2 hover:underline">
              اشتغل سائق
            </Link>
            <Link to="/credits" className="py-2 hover:underline">
              مصادر الصور
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function Layout() {
  useLenis()
  usePointerEffects()
  const { pathname } = useLocation()
  // Braces matter: window.scrollTo can return a Promise, and an effect must return nothing or a cleanup function.
  useEffect(() => {
    scrollToTop()
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Backdrop />
      <Navbar />
      <VerifyEmailBanner />
      <main className="flex-1">
        {/* Keyed by path, so each page fades and rises in when you navigate. */}
        <div key={pathname} className="animate-page-in">
          <Suspense fallback={<Spinner className="py-32" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}

/** Standard page container with a large title, like apple.com's section headers. */
export function Page({ title, subtitle, actions, children, narrow = false }) {
  return (
    <div className={`mx-auto px-4 pt-8 pb-12 md:pt-14 md:pb-20 ${narrow ? 'max-w-md' : 'max-w-5xl'}`}>
      {(title || actions) && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-10">
          <div>
            {title && <h1 className="text-[26px] leading-[1.125] font-semibold md:text-[40px]">{title}</h1>}
            {subtitle && <p className="mt-2 text-[15px] text-stone-500 md:text-[18px]">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}
