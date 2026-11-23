import { Hourglass, Mail } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

/** Explains why a driver can't see orders yet (email not verified / waiting for admin approval). */
export function DriverGate({ error }) {
  if (error?.code === 'DRIVER_NOT_APPROVED') {
    return (
      <EmptyState icon={Hourglass} title="حسابك قيد المراجعة">
        الإدارة رح تراجع حسابك وتفعّله قريباً. بعدها بتقدر تشوف الطلبات وتستلمها.
      </EmptyState>
    )
  }
  if (error?.code === 'EMAIL_NOT_VERIFIED') {
    return (
      <EmptyState icon={Mail} title="أكّد إيميلك أولاً">
        افتح رابط التأكيد اللي وصلك على إيميلك، أو اطلب رابط جديد من الشريط فوق.
      </EmptyState>
    )
  }
  return null
}
