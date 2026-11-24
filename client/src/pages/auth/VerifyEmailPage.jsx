import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CircleCheckBig } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { homeFor } from '@/lib/format'
import { AuthCard } from './AuthCard'

/** Opened from the link in the verification email: /verify-email?token=… */
export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { user, setUser } = useAuth()
  const [result, setResult] = useState(token ? null : { error: 'الرابط ناقص. افتح الرابط من الإيميل مرة ثانية.' })
  const started = useRef(false)

  useEffect(() => {
    // Run once, even in React StrictMode (a token works only once).
    if (!token || started.current) return
    started.current = true
    api('/auth/verify-email', { method: 'POST', body: { token } })
      .then((res) => {
        setResult({ message: res.message })
        setUser(res.user)
      })
      .catch((err) => setResult({ error: err.message }))
  }, [token, setUser])

  return (
    <AuthCard title="تأكيد الإيميل">
      {!result ? (
        <Spinner className="py-8" />
      ) : result.message ? (
        <div className="flex flex-col gap-4 text-center">
          <CircleCheckBig className="animate-pop mx-auto size-14 text-emerald-600" strokeWidth={1.5} aria-hidden />
          <Alert type="success">{result.message}</Alert>
          <Link to={user ? homeFor(user) : '/login'} className="btn-primary">
            {user ? 'متابعة' : 'تسجيل الدخول'}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Alert>{result.error}</Alert>
          <p className="text-[13px] text-stone-600">
            {user ? 'بتقدر تطلب رابط جديد من الشريط فوق.' : 'سجّل دخول، وبعدين اطلب رابط جديد من الشريط فوق.'}
          </p>
          {!user && (
            <Link to="/login" className="btn-secondary">
              تسجيل الدخول
            </Link>
          )}
        </div>
      )}
    </AuthCard>
  )
}
