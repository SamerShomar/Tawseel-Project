import { Link } from 'react-router'
import { SearchX } from 'lucide-react'
import { Page } from '@/components/Layout'
import { EmptyState } from '@/components/ui/EmptyState'

export default function NotFoundPage() {
  return (
    <Page narrow>
      <EmptyState icon={SearchX} title="الصفحة غير موجودة">
        <Link to="/" className="btn-primary mt-2">
          الرئيسية
        </Link>
      </EmptyState>
    </Page>
  )
}
