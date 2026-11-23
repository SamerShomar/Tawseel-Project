import { useState } from 'react'
import { Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

const WHY = {
  CUSTOMER: 'عشان تقدر تطلب',
  RESTAURANT_OWNER: 'عشان يظهر مطعمك للزباين',
  DRIVER: 'عشان تقدر تستلم طلبات توصيل',
}

/** Shown under the top bar until the user verifies their email. */
export function VerifyEmailBanner() {
  const { user } = useAuth()
  const [state, setState] = useState('idle') // idle | sending | sent | error
  const [message, setMessage] = useState('')

  if (!user || user.emailVerified || user.role === 'ADMIN') return null

  const resend = async () => {
    setState('sending')
    try {
      const res = await api('/auth/resend-verification', { method: 'POST' })
      setMessage(res.message)
      setState('sent')
    } catch (err) {
      setMessage(err.message)
      setState('error')
    }
  }

  return (
    <div role="status" className="bg-amber-50 text-amber-900">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-[14px]">
        <Mail className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <p className="min-w-0 flex-1">
          {state === 'sent' || state === 'error' ? (
            message
          ) : (
            <>
              أكّد إيميلك {WHY[user.role]}. بعتنالك رابط على <b dir="ltr">{user.email}</b>
            </>
          )}
        </p>
        {state !== 'sent' && (
          <button onClick={resend} disabled={state === 'sending'} className="py-2 font-semibold text-amber-900 underline underline-offset-2 disabled:opacity-50">
            {state === 'sending' ? 'جاري الإرسال…' : 'إعادة إرسال الرابط'}
          </button>
        )}
      </div>
    </div>
  )
}
