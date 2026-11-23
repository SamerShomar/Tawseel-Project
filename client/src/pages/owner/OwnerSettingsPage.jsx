import { useState } from 'react'
import { useLocation } from 'react-router'
import { Page } from '@/components/Layout'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'

const FIELDS = ['name', 'description', 'category', 'address', 'phone', 'imageUrl']

function SettingsForm({ restaurant }) {
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f, restaurant[f] || ''])))
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setSaveError('')
    setErrors({})
    try {
      await api('/my-restaurant', { method: 'PATCH', body: form })
      setMessage('تم حفظ معلومات المطعم')
    } catch (err) {
      setSaveError(err.message)
      setErrors(err.fieldErrors || {})
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Alert>{saveError}</Alert>
      <Alert type="success">{message}</Alert>
      <form onSubmit={submit} className="card grid gap-4 p-5 md:p-7 sm:grid-cols-2" noValidate>
        <Field label="اسم المطعم" required value={form.name} onChange={set('name')} error={errors.name} />
        <Field label="التصنيف" value={form.category} onChange={set('category')} error={errors.category} placeholder="برجر، بيتزا، حلويات…" />
        <Field label="الوصف" as="textarea" rows={3} className="sm:col-span-2" value={form.description} onChange={set('description')} error={errors.description} />
        <Field label="العنوان" value={form.address} onChange={set('address')} error={errors.address} />
        <Field label="رقم الهاتف" type="tel" dir="ltr" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <Field label="رابط صورة الغلاف (اختياري)" type="url" dir="ltr" className="sm:col-span-2" value={form.imageUrl} onChange={set('imageUrl')} error={errors.imageUrl} placeholder="https://…" />
        <div className="sm:col-span-2">
          <button className="btn-primary" disabled={saving}>
            {saving ? 'جاري الحفظ…' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>
    </>
  )
}

export default function OwnerSettingsPage() {
  const { state } = useLocation()
  const { data, error, loading } = useApi('/my-restaurant')

  if (loading) return <Spinner />

  return (
    <Page title="معلومات المطعم" subtitle="هذي المعلومات بتظهر للزباين">
      <div className="mx-auto max-w-2xl space-y-4">
        {state?.welcome && <Alert type="success">أهلاً فيك! كمّل معلومات مطعمك، وبعدها أضف أصناف القائمة.</Alert>}
        <Alert>{error?.message}</Alert>
        {data && <SettingsForm restaurant={data.restaurant} />}
      </div>
    </Page>
  )
}
