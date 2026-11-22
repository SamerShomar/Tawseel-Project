import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Page } from '@/components/Layout'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/format'

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

  if (!cart.items.length) {
    return (
      <Page title="السلة" narrow>
        <EmptyState icon="🛒" title="السلة فارغة">
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
    <Page title="السلة وإتمام الطلب" subtitle={`من ${cart.restaurant.name}`}>
      <div className="grid gap-6 pb-20 md:pb-0 lg:grid-cols-5">
        <section className="card h-fit p-5 lg:col-span-3">
          <ul className="divide-y divide-stone-100">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-stone-500">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary size-11 p-0" onClick={() => cart.setQuantity(item.id, item.quantity - 1)} aria-label={`إنقاص ${item.name}`}>
                    −
                  </button>
                  <span className="w-6 text-center font-semibold">{item.quantity}</span>
                  <button className="btn-secondary size-11 p-0" onClick={() => cart.setQuantity(item.id, item.quantity + 1)} aria-label={`زيادة ${item.name}`}>
                    +
                  </button>
                </div>
                <span className="w-20 text-end font-bold">{formatPrice(item.price * item.quantity)}</span>
                <button className="grid size-11 shrink-0 place-items-center text-base text-stone-500 hover:text-rose-600" onClick={() => cart.setQuantity(item.id, 0)} aria-label={`حذف ${item.name}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-stone-200 pt-4 text-lg font-bold">
            <span>المجموع</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
          <Link to={`/restaurants/${cart.restaurant.id}`} className="mt-3 inline-block text-sm text-brand-700 hover:underline">
            + أضف أصناف أخرى
          </Link>
        </section>

        <form id="checkout-form" onSubmit={submit} className="card flex h-fit flex-col gap-4 p-5 lg:col-span-2" noValidate>
          <h2 className="text-lg font-bold">معلومات التوصيل</h2>
          <Alert>{error}</Alert>
          <Field label="عنوان التوصيل" as="textarea" rows={2} required value={form.deliveryAddress} onChange={set('deliveryAddress')} error={errors.deliveryAddress} placeholder="المدينة، الحي، الشارع، أقرب معلم" />
          <Field label="رقم الهاتف" type="tel" dir="ltr" required value={phone} onChange={set('phone')} error={errors.phone} placeholder="059xxxxxxx" />
          <Field label="ملاحظات (اختياري)" as="textarea" rows={2} value={form.notes} onChange={set('notes')} error={errors.notes} placeholder="مثلاً: بدون بصل" />
          <p className="rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-600">💵 الدفع نقداً عند الاستلام</p>
          {needsVerification && <Alert type="info">أكّد إيميلك أولاً عشان تقدر تكمل الطلب. الرابط وصلك على إيميلك، أو اطلب رابط جديد من الشريط الأصفر فوق.</Alert>}
          <button className="btn-primary hidden py-3 text-base md:inline-flex" disabled={submitting || needsVerification}>
            {submitting ? 'جاري إرسال الطلب…' : user ? `تأكيد الطلب · ${formatPrice(cart.total)}` : 'سجّل الدخول لإتمام الطلب'}
          </button>
        </form>
      </div>

      {/* Phones: the confirm button stays visible above the tab bar instead of being below the form. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">
            المجموع <strong>{formatPrice(cart.total)}</strong>
          </span>
          <button type="submit" form="checkout-form" className="btn-primary flex-1 text-base" disabled={submitting || needsVerification}>
            {submitting ? 'جاري الإرسال…' : user ? 'تأكيد الطلب' : 'سجّل الدخول لإتمام الطلب'}
          </button>
        </div>
      </div>
    </Page>
  )
}
