import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { useAuth } from '@/context/AuthContext'
import { homeFor } from '@/lib/format'
import { AuthCard, AuthLink } from './AuthCard'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // After login the user goes back to the page that asked for it (e.g. the cart), or to their home page.
  const target = (u) => (u.role === 'CUSTOMER' && state?.from ? state.from : homeFor(u))
  if (user) return <Navigate to={target(user)} replace />

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const u = await login(form.email, form.password)
      navigate(target(u), { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="تسجيل الدخول"
      subtitle="أهلاً فيك من جديد."
      footer={
        <>
          ما عندك حساب؟ <AuthLink to="/register">أنشئ حساب جديد</AuthLink>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Alert>{error}</Alert>
        <Field label="البريد الإلكتروني" type="email" dir="ltr" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label="كلمة المرور" type="password" dir="ltr" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="-mt-3 text-end text-[14px]">
          <AuthLink to="/forgot-password">نسيت كلمة المرور؟</AuthLink>
        </div>
        <button className="btn-primary mt-2" disabled={submitting}>
          {submitting ? 'جاري الدخول…' : 'دخول'}
        </button>
      </form>
    </AuthCard>
  )
}
