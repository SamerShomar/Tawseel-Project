import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Banknote, Plus, ShoppingBag, X } from 'lucide-react'
import { FloatingBar } from '@/components/FloatingBar'
import { useReveal } from '@/components/motion/Reveal'
import { Page } from '@/components/Layout'
import { QuantityStepper } from '@/components/QuantityStepper'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import { thumb } from '@/lib/photo'

export default function CartPage() {
  const cart = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  // phone stays null until the user types, so it can fall back to the account's phone (which may load after this page).
  const [form, setForm] = useState({ deliveryAddress: '', phone: null, notes: '' })
  const phone = form.phone ?? user?.phone ?? ''
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const listRef = useReveal([cart.items.length])

  if (!cart.items.length) {
    return (
      <Page title="السلة" narrow>
        <EmptyState icon={ShoppingBag} title="السلة فارغة">
          <Link to="/" className="btn-primary mt-2">
            تصفّح المطاعم
          </Link>
        </EmptyState>
      </Page>
    )
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const needsVerification = user && !user.emailVerified

  const submit = async (e) => {
    e.preventDefault()
    if (!user) return navigate('/login', { state: { from: '/cart' } })
    if (needsVerification) return

    setSubmitting(true)
    setError('')
    setErrors({})
    try {
      const { order } = await api('/orders', {
        method: 'POST',
        body: {
          restaurantId: cart.restaurant.id,
          items: cart.items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
          ...form,
          phone,
        },
      })
      cart.clear()
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } })
    } catch (err) {
      setError(err.message)
      setErrors(err.fieldErrors || {})
      setSubmitting(false)
    }
  }

  return (
    <Page title="السلة" subtitle={`من ${cart.restaurant.name}`}>
      <div className="grid gap-6 pb-24 md:pb-0 lg:grid-cols-5">
        <section className="card h-fit p-5 md:p-7 lg:col-span-3">
          <ul ref={listRef} className="divide-y divide-stone-100">
            {cart.items.map((item) => (
              <li key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 py-4 first:pt-0 last:pb-0 sm:flex sm:gap-3">
                {/* Phones: two lines (name + total, then quantity + remove). From sm up: one row. */}
                <div className="flex min-w-0 items-center gap-3 sm:order-1 sm:flex-1">
                  {item.imageUrl && <img src={thumb(item.imageUrl)} alt="" className="size-12 shrink-0 rounded-xl object-cover" loading="lazy" />}
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold">{item.name}</p>
                    <p className="text-[13px] text-stone-500">{formatPrice(item.price)}</p>
                  </div>
                </div>
                <span className="text-end text-[15px] font-semibold sm:order-3 sm:w-20">{formatPrice(item.price * item.quantity)}</span>
                <div className="sm:order-2">
                  <QuantityStepper name={item.name} quantity={item.quantity} onChange={(q) => cart.setQuantity(item.id, q)} />
                </div>
                <button
                  className="grid size-11 shrink-0 place-items-center justify-self-end rounded-full text-stone-500 transition hover:bg-rose-50 hover:text-rose-700 sm:order-4"
                  onClick={() => cart.setQuantity(item.id, 0)}
                  aria-label={`حذف ${item.name}`}
                >
                  <X className="size-5" strokeWidth={1.75} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-stone-200 pt-4 text-[18px] font-semibold">
            <span>المجموع</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
          <Link to={`/restaurants/${cart.restaurant.id}`} className="link mt-1 py-3 text-[13px]">
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            أضف أصناف أخرى
          </Link>
        </section>

        <form id="checkout-form" onSubmit={submit} className="card flex h-fit flex-col gap-4 p-5 md:p-7 lg:col-span-2" noValidate>
          <h2 className="text-[18px] font-semibold">معلومات التوصيل</h2>
          <Alert>{error}</Alert>
          <Field label="عنوان التوصيل" as="textarea" rows={2} required value={form.deliveryAddress} onChange={set('deliveryAddress')} error={errors.deliveryAddress} placeholder="المدينة، الحي، الشارع، أقرب معلم" />
          <Field label="رقم الهاتف" type="tel" dir="ltr" required value={phone} onChange={set('phone')} error={errors.phone} placeholder="059xxxxxxx" />
          <Field label="ملاحظات (اختياري)" as="textarea" rows={2} value={form.notes} onChange={set('notes')} error={errors.notes} placeholder="مثلاً: بدون بصل" />
          <p className="flex items-center gap-2 rounded-2xl bg-black/[0.04] px-4 py-3 text-[13px] text-stone-600">
            <Banknote className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
            الدفع نقداً عند الاستلام
          </p>
          {needsVerification && <Alert type="info">أكّد إيميلك أولاً عشان تقدر تكمل الطلب. الرابط وصلك على إيميلك، أو اطلب رابط جديد من الشريط فوق.</Alert>}
          <button className="btn-primary hidden md:inline-flex" disabled={submitting || needsVerification}>
            {submitting ? 'جاري إرسال الطلب…' : user ? `تأكيد الطلب · ${formatPrice(cart.total)}` : 'سجّل الدخول لإتمام الطلب'}
          </button>
        </form>
      </div>

      {/* Phones: the confirm button floats at the bottom of the screen instead of sitting below the form. */}
      <FloatingBar className="md:hidden">
        <span className="text-[13px]">
          المجموع <strong>{formatPrice(cart.total)}</strong>
        </span>
        <button type="submit" form="checkout-form" className="btn-primary h-11 flex-1 py-0" disabled={submitting || needsVerification}>
          {submitting ? 'جاري الإرسال…' : user ? 'تأكيد الطلب' : 'سجّل الدخول لإتمام الطلب'}
        </button>
      </FloatingBar>
    </Page>
  )
}
