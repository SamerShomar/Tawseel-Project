import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { api } from '@/lib/api'
import { AuthCard, AuthLink } from './AuthCard'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين')
    setSubmitting(true)
    setError('')
    try {
      const res = await api('/auth/reset-password', { method: 'POST', body: { token, password } })
      setMessage(res.message)
    } catch (err) {
      setError(err.fieldErrors?.password || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="تعيين كلمة مرور جديدة">
      {!token ? (
        <Alert>الرابط غير صالح. اطلب رابطاً جديداً من صفحة «نسيت كلمة المرور».</Alert>
      ) : message ? (
        <div className="flex flex-col gap-4">
          <Alert type="success">{message}</Alert>
          <AuthLink to="/login">تسجيل الدخول ←</AuthLink>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Alert>{error}</Alert>
          <Field label="كلمة المرور الجديدة" type="password" dir="ltr" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Field label="تأكيد كلمة المرور" type="password" dir="ltr" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button className="btn-primary mt-2" disabled={submitting}>
            {submitting ? 'جاري الحفظ…' : 'حفظ كلمة المرور'}
          </button>
        </form>
      )}
    </AuthCard>
  )
}
