import { useState } from 'react'
import { Page } from '@/components/Layout'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { useApi } from '@/hooks/useApi'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/format'

const emptyForm = { name: '', description: '', price: '', category: '', imageUrl: '', isAvailable: true }

function MenuItemForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? { ...initial, imageUrl: initial.imageUrl || '' } : emptyForm)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setErrors({})
    try {
      const { name, description, price, category, imageUrl, isAvailable } = form
      await onSave({ name, description, price: Number(price), category, imageUrl, isAvailable })
    } catch (err) {
      setError(err.message)
      setErrors(err.fieldErrors || {})
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2" noValidate>
      <h2 className="text-xl font-bold sm:col-span-2">{initial ? `تعديل «${initial.name}»` : 'صنف جديد'}</h2>
      <div className="sm:col-span-2">
        <Alert>{error}</Alert>
      </div>
      <Field label="اسم الصنف" required value={form.name} onChange={set('name')} error={errors.name} />
      <Field label="السعر (₪)" type="number" min="0" step="0.5" dir="ltr" required value={form.price} onChange={set('price')} error={errors.price} />
      <Field label="التصنيف" value={form.category} onChange={set('category')} error={errors.category} placeholder="مثلاً: سندويشات، مشروبات" />
      <Field label="رابط صورة (اختياري)" type="url" dir="ltr" value={form.imageUrl} onChange={set('imageUrl')} error={errors.imageUrl} placeholder="https://…" />
      <Field label="الوصف" as="textarea" rows={2} className="sm:col-span-2" value={form.description} onChange={set('description')} error={errors.description} />
      <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
        <input type="checkbox" checked={form.isAvailable} onChange={set('isAvailable')} className="size-4 accent-brand-500" />
        متوفر للطلب
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button className="btn-primary" disabled={saving}>
          {saving ? 'جاري الحفظ…' : 'حفظ'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </form>
  )
}

function AvailabilitySwitch({ item, onToggle }) {
  return (
    <button
      role="switch"
      aria-checked={item.isAvailable}
      aria-label={`${item.name} متوفر`}
      onClick={() => onToggle(item)}
      className="flex h-11 w-12 shrink-0 items-center"
    >
      {/* The visible switch stays 44×24; the button around it gives a 44×44 tap area. */}
      <span className={`relative h-6 w-12 rounded-full transition ${item.isAvailable ? 'bg-emerald-500' : 'bg-stone-300'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${item.isAvailable ? 'start-6' : 'start-0.5'}`} />
      </span>
    </button>
  )
}

export default function OwnerMenuPage() {
  const { data, error, loading, reload } = useApi('/my-restaurant/menu')
  const [editing, setEditing] = useState(null) // null | 'new' | item
  const [actionError, setActionError] = useState('')

  const save = async (body) => {
    if (editing === 'new') await api('/my-restaurant/menu', { method: 'POST', body })
    else await api(`/my-restaurant/menu/${editing.id}`, { method: 'PATCH', body })
    setEditing(null)
    await reload()
  }

  const toggle = async (item) => {
    setActionError('')
    try {
      await api(`/my-restaurant/menu/${item.id}`, { method: 'PATCH', body: { isAvailable: !item.isAvailable } })
      await reload()
    } catch (err) {
      setActionError(err.message)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`حذف «${item.name}» من القائمة؟`)) return
    setActionError('')
    try {
      await api(`/my-restaurant/menu/${item.id}`, { method: 'DELETE' })
      await reload()
    } catch (err) {
      setActionError(err.message)
    }
  }

  if (loading) return <Spinner />
  const items = data?.menuItems || []

  return (
    <Page
      title="إدارة القائمة"
      subtitle={`${items.length} صنف`}
      actions={
        !editing && (
          <button className="btn-primary" onClick={() => setEditing('new')}>
            + صنف جديد
          </button>
        )
      }
    >
      <div className="space-y-4">
        <Alert>{error?.message || actionError}</Alert>
        {editing && <MenuItemForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} onSave={save} onCancel={() => setEditing(null)} />}

        {items.length === 0 && !editing ? (
          <EmptyState icon="📋" title="القائمة فارغة">
            أضف أول صنف عشان الزباين يقدروا يطلبوا
          </EmptyState>
        ) : (
          <>
          {/* Phones: one card per item */}
          <ul className="space-y-3 sm:hidden">
            {items.map((item) => (
              <li key={item.id} className={`card p-4 ${item.isAvailable ? '' : 'opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.name}</p>
                    {item.description && <p className="line-clamp-1 text-xs text-stone-500">{item.description}</p>}
                    <p className="mt-1 text-sm">
                      <span className="font-bold text-brand-700">{formatPrice(item.price)}</span>
                      {item.category && <span className="text-stone-500"> · {item.category}</span>}
                    </p>
                  </div>
                  <AvailabilitySwitch item={item} onToggle={toggle} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="btn-secondary py-2" onClick={() => setEditing(item)}>
                    تعديل
                  </button>
                  <button className="btn-danger py-2" onClick={() => remove(item)}>
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Tablets and desktop: table */}
          <div className="card hidden overflow-hidden sm:block">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-500">
                <tr>
                  <th className="p-3 text-start font-medium">الصنف</th>
                  <th className="hidden p-3 text-start font-medium sm:table-cell">التصنيف</th>
                  <th className="p-3 text-start font-medium">السعر</th>
                  <th className="p-3 text-start font-medium">متوفر</th>
                  <th className="p-3">
                    <span className="sr-only">إجراءات</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => (
                  <tr key={item.id} className={item.isAvailable ? '' : 'text-stone-500'}>
                    <td className="p-3">
                      <p className="font-semibold">{item.name}</p>
                      {item.description && <p className="line-clamp-1 text-xs text-stone-500">{item.description}</p>}
                    </td>
                    <td className="hidden p-3 sm:table-cell">{item.category || '—'}</td>
                    <td className="p-3 font-semibold whitespace-nowrap">{formatPrice(item.price)}</td>
                    <td className="p-3">
                      <AvailabilitySwitch item={item} onToggle={toggle} />
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button className="btn-secondary px-3 py-1.5" onClick={() => setEditing(item)}>
                          تعديل
                        </button>
                        <button className="btn-danger px-3 py-1.5" onClick={() => remove(item)}>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </Page>
  )
}
