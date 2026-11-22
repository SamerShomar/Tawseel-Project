import { ORDER_STEPS, STATUS } from '@/lib/format'

/** Step-by-step tracker: Pending → Accepted → Preparing → On the way → Delivered. */
export function OrderProgress({ status }) {
  if (status === 'REJECTED') {
    return (
      <div className="rounded-xl bg-rose-50 p-4 text-center text-sm font-medium text-rose-700">
        نعتذر، المطعم رفض هذا الطلب.
      </div>
    )
  }

  const current = ORDER_STEPS.indexOf(status)
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="حالة الطلب">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= current
        return (
          <li key={step} className="flex flex-col items-center gap-2 text-center" aria-current={i === current ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-1 flex-1 rounded ${i === 0 ? 'invisible' : done ? 'bg-brand-500' : 'bg-stone-200'}`} />
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                  done ? 'bg-brand-500 text-white' : 'bg-stone-200 text-stone-600'
                } ${i === current && status !== 'DELIVERED' ? 'ring-4 ring-brand-100' : ''}`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className={`h-1 flex-1 rounded ${i === ORDER_STEPS.length - 1 ? 'invisible' : i < current ? 'bg-brand-500' : 'bg-stone-200'}`} />
            </div>
            <span className={`text-[11px] leading-tight sm:text-xs ${done ? 'font-semibold text-ink' : 'text-stone-500'}`}>
              {STATUS[step].label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
