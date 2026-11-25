import { BatteryFull, Beef, Bike, CakeSlice, ChefHat, CircleCheck, House, Minus, Pizza, Plus, ReceiptText, Sandwich, Search, Signal, Wifi } from 'lucide-react'

/**
 * A generic phone drawn in HTML, used as the "product shot" on the home page.
 * Purely decorative (aria-hidden): the real features are on the real pages.
 */
export function Phone({ children, className = '' }) {
  return (
    <div
      className={`relative aspect-[9/19.5] rounded-[46px] bg-[#1d1d1f] p-[9px] shadow-[0_50px_100px_-20px_rgb(0_0_0/0.55),inset_0_0_0_1.5px_rgb(255_255_255/0.14)] ${className}`}
      aria-hidden
    >
      <div className="relative size-full overflow-hidden rounded-[38px] bg-[#f5f5f7] text-ink theme-light" dir="rtl">
        {/* Status bar with a small front-camera dot. */}
        <div className="relative z-20 flex h-10 items-end justify-between px-6 pb-1 text-[11px] font-semibold" dir="ltr">
          <span>12:30</span>
          <span className="absolute top-2.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-black" />
          <span className="flex items-center gap-1">
            <Signal className="size-3" strokeWidth={2.5} />
            <Wifi className="size-3" strokeWidth={2.5} />
            <BatteryFull className="size-4" strokeWidth={2} />
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

const MINI = [
  {
    name: 'شاورما البيدر',
    cat: 'شاورما',
    icon: Sandwich,
    tint: 'from-orange-100 to-amber-200',
  },
  {
    name: 'بيتزا الزيتونة',
    cat: 'بيتزا',
    icon: Pizza,
    tint: 'from-rose-100 to-orange-200',
  },
  {
    name: 'برجر الميناء',
    cat: 'برجر',
    icon: Beef,
    tint: 'from-amber-100 to-yellow-200',
  },
  {
    name: 'كنافة باب الدار',
    cat: 'حلويات',
    icon: CakeSlice,
    tint: 'from-red-100 to-rose-200',
  },
]

/** Screen 1: choosing a restaurant. */
export function ScreenRestaurants() {
  return (
    <div className="px-4 pt-3">
      <p className="text-[22px] font-semibold">المطاعم</p>
      <div className="mt-2 flex h-8 items-center gap-2 rounded-full bg-black/[0.06] px-3 text-[11px] text-stone-500">
        <Search className="size-3.5" strokeWidth={2} />
        ابحث عن مطعم
      </div>
      <div className="mt-3 space-y-2.5">
        {MINI.map(({ name, cat, icon: Icon, tint }) => (
          <div key={name} className="flex items-center gap-3 rounded-2xl bg-white p-2 shadow-sm">
            <span className={`grid size-12 place-items-center rounded-xl bg-gradient-to-br ${tint}`}>
              <Icon className="size-6 text-brand-700" strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-[13px] font-semibold">{name}</p>
              <p className="text-[10px] text-stone-500">{cat} · غزة</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Screen 2: the cart. */
export function ScreenCart() {
  const items = [
    ['سندويش شاورما دجاج', 2, 40],
    ['بطاطا مقلية', 1, 10],
    ['ثومية إضافية', 1, 3],
  ]
  return (
    <div className="flex h-full flex-col px-4 pt-3">
      <p className="text-[22px] font-semibold">السلة</p>
      <p className="text-[11px] text-stone-500">من شاورما البيدر</p>
      <div className="mt-3 divide-y divide-black/5 rounded-2xl bg-white px-3 shadow-sm">
        {items.map(([name, q, price]) => (
          <div key={name} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-[12px] font-semibold">{name}</p>
              <p className="text-[10px] text-stone-500">₪ {price}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-black/[0.05] px-2 py-1 text-[11px] text-brand-700">
              <Minus className="size-3" strokeWidth={2.5} />
              <span className="font-semibold text-ink">{q}</span>
              <Plus className="size-3" strokeWidth={2.5} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between px-1 text-[14px] font-semibold">
        <span>المجموع</span>
        <span>₪ 53</span>
      </div>
      <div className="mt-auto mb-6 rounded-full bg-accent py-3 text-center text-[13px] font-semibold text-white shadow-lg shadow-accent/30">تأكيد الطلب</div>
    </div>
  )
}

const TRACK = [
  { icon: ReceiptText, label: 'استلمنا طلبك' },
  { icon: CircleCheck, label: 'المطعم قبل الطلب' },
  { icon: ChefHat, label: 'قيد التحضير' },
  { icon: Bike, label: 'في الطريق إليك' },
  { icon: House, label: 'تم التوصيل' },
]

/** Screen 3: tracking the order. `current` is the step that is happening now. */
export function ScreenTracking({ current = 3 }) {
  return (
    <div className="px-4 pt-3">
      <p className="text-[22px] font-semibold">طلب 1042</p>
      <p className="text-[11px] text-stone-500">شاورما البيدر · الدفع عند الاستلام</p>
      <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <ol className="relative space-y-4">
          <span className="absolute start-[15px] top-4 bottom-4 w-0.5 bg-black/5" />
          {TRACK.map(({ icon: Icon, label }, i) => (
            <li key={label} className="relative flex items-center gap-3">
              <span className="relative grid size-8 shrink-0 place-items-center">
                {i === current && <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />}
                <span
                  className={`relative grid size-8 place-items-center rounded-full transition-colors duration-500 ${
                    i <= current ? 'bg-accent text-white' : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  <Icon className="size-4" strokeWidth={2} />
                </span>
              </span>
              <span className={`text-[12px] ${i <= current ? 'font-semibold' : 'text-stone-400'}`}>{label}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <span className="grid size-9 place-items-center rounded-full bg-black/[0.05] text-brand-700">
          <Bike className="size-4" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <p className="text-[10px] text-stone-500">سائق التوصيل</p>
          <p className="text-[12px] font-semibold">أبو أحمد</p>
        </div>
        <span className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-white">اتصال</span>
      </div>
    </div>
  )
}
