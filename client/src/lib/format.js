export const formatPrice = (n) => `${Number(n).toFixed(2).replace(/\.00$/, '')} ₪`

export const formatDate = (d) =>
  new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d))

export const ORDER_STEPS = ['PENDING', 'ACCEPTED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED']

export const STATUS = {
  PENDING: { label: 'بانتظار التأكيد', className: 'bg-amber-100 text-amber-800' },
  ACCEPTED: { label: 'تم القبول', className: 'bg-sky-100 text-sky-800' },
  PREPARING: { label: 'قيد التحضير', className: 'bg-indigo-100 text-indigo-800' },
  ON_THE_WAY: { label: 'في الطريق', className: 'bg-violet-100 text-violet-800' },
  DELIVERED: { label: 'تم التوصيل', className: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'مرفوض', className: 'bg-rose-100 text-rose-800' },
}

/** Status the restaurant can move an order to next (mirrors the server rules). */
/** What the restaurant does next. Pickup and delivery are the driver's steps. */
export const NEXT_ACTION = {
  ACCEPTED: { status: 'PREPARING', label: 'بدء التحضير' },
}

/** What the driver does next on an order they took. */
export const DRIVER_ACTION = {
  ACCEPTED: { status: 'ON_THE_WAY', label: 'استلمت الطلب من المطعم' },
  PREPARING: { status: 'ON_THE_WAY', label: 'استلمت الطلب من المطعم' },
  ON_THE_WAY: { status: 'DELIVERED', label: 'تم التوصيل ✓' },
}

export const isActiveOrder = (status) => !['DELIVERED', 'REJECTED'].includes(status)

/** Where a user lands after login. */
export const HOME_BY_ROLE = { CUSTOMER: '/', RESTAURANT_OWNER: '/dashboard', ADMIN: '/admin', DRIVER: '/driver' }

export const ROLE_LABEL = { CUSTOMER: 'زبون', RESTAURANT_OWNER: 'صاحب مطعم', DRIVER: 'سائق توصيل', ADMIN: 'أدمن' }
export const homeFor = (user) => HOME_BY_ROLE[user.role] || '/'
