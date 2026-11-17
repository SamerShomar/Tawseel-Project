import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { AuthCard, AuthLink } from './AuthCard'
import { homeFor } from '@/lib/format'

const ROLES = [
  { value: 'CUSTOMER', icon: '🙋', label: 'زبون', hint: 'بدي أطلب أكل' },
  { value: 'RESTAURANT_OWNER', icon: '👨‍🍳', label: 'صاحب مطعم', hint: 'بدي أستقبل طلبات' },
]

export default function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ role: params.get('role') === 'owner' ? 'RESTAURANT_OWNER' : 'CUSTOMER', name: '', email: '', phone: '', password: '', restaurantName: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={user.role === 'RESTAURANT_OWNER' ? '/dashboard/settings' : homeFor(user)} replace state={{ welcome: true }} />

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const isOwner = form.role === 'RESTAURANT_OWNER'

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setErrors({})
    try {
      const { restaurantName, phone, ...rest } = form
      const u = await register({ ...rest, ...(phone && { phone }), ...(isOwner && { restaurantName }) })
      navigate(isOwner ? '/dashboard/settings' : homeFor(u), { replace: true, state: { welcome: true } })
    } catch (err) {
      setError(err.message)
      setErrors(err.fieldErrors || {})
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="إنشاء حساب"
      footer={
        <>
          عندك حساب؟ <AuthLink to="/login">سجّل الدخول</AuthLink>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="mb-1.5 text-sm font-medium text-stone-700">نوع الحساب</legend>
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`cursor-pointer rounded-xl border-2 p-3 text-center transition ${
                form.role === r.value ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={set('role')} className="sr-only" />
              <span className="block text-2xl" aria-hidden>
                {r.icon}
              </span>
              <span className="block font-semibold">{r.label}</span>
              <span className="block text-xs text-stone-500">{r.hint}</span>
            </label>
          ))}
        </fieldset>

        <Alert>{error}</Alert>
        <Field label="الاسم الكامل" autoComplete="name" required value={form.name} onChange={set('name')} error={errors.name} />
        {isOwner && <Field label="اسم المطعم" required value={form.restaurantName} onChange={set('restaurantName')} error={errors.restaurantName} />}
        <Field label="البريد الإلكتروني" type="email" dir="ltr" autoComplete="email" required value={form.email} onChange={set('email')} error={errors.email} />
        <Field label="رقم الهاتف (اختياري)" type="tel" dir="ltr" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <Field label="كلمة المرور" type="password" dir="ltr" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} error={errors.password} placeholder="8 أحرف على الأقل" />
        <button className="btn-primary py-3" disabled={submitting}>
          {submitting ? 'جاري إنشاء الحساب…' : 'إنشاء الحساب'}
        </button>
      </form>
    </AuthCard>
  )
}
