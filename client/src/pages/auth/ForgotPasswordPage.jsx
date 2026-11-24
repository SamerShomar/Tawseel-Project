import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { api } from '@/lib/api'
import { AuthCard, AuthLink } from './AuthCard'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await api('/auth/forgot-password', { method: 'POST', body: { email } })
      setMessage(res.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="نسيت كلمة المرور؟"
      subtitle="اكتب بريدك وبنبعتلك رابط لتعيين كلمة مرور جديدة"
      footer={<AuthLink to="/login">→ رجوع لتسجيل الدخول</AuthLink>}
    >
      {message ? (
        <div className="flex flex-col gap-3">
          <Alert type="success">{message}</Alert>
          <p className="text-[13px] text-stone-600">
            الرابط صالح لمدة 30 دقيقة. إذا ما وصلت الرسالة خلال دقيقتين، شيّك على مجلد الرسائل غير المرغوب فيها (Spam).
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Alert>{error}</Alert>
          <Field label="البريد الإلكتروني" type="email" dir="ltr" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-primary mt-2" disabled={submitting}>
            {submitting ? 'جاري الإرسال…' : 'أرسل الرابط'}
          </button>
        </form>
      )}
    </AuthCard>
  )
}
