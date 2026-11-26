import { STATUS } from '@/lib/format'

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, className: 'bg-stone-100 text-stone-700' }
  return <span className={`inline-block rounded-full px-3 py-1 text-[13px] font-semibold whitespace-nowrap ${s.className}`}>{s.label}</span>
}
