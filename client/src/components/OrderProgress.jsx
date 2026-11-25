import { useEffect, useState } from 'react'
import { Bike, ChefHat, CircleCheck, CircleX, House, ReceiptText } from 'lucide-react'
import { ORDER_STEPS, STATUS } from '@/lib/format'

const ICONS = { PENDING: ReceiptText, ACCEPTED: CircleCheck, PREPARING: ChefHat, ON_THE_WAY: Bike, DELIVERED: House }

/** Step-by-step tracker: Pending → Accepted → Preparing → On the way → Delivered. */
export function OrderProgress({ status }) {
  const current = ORDER_STEPS.indexOf(status)
  // Start the line empty, then let it grow to the current step (CSS transition).
  const [fill, setFill] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setFill(Math.max(current, 0) / (ORDER_STEPS.length - 1)))
    return () => cancelAnimationFrame(id)
  }, [current])

  if (status === 'REJECTED') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-400/15 p-4 text-[13px] font-medium text-rose-800 dark:text-rose-300">
        <CircleX className="size-5" strokeWidth={1.75} aria-hidden />
        نعتذر، المطعم رفض هذا الطلب.
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Track from the first icon's center to the last one's; the orange part grows with progress. */}
      <div className="absolute inset-x-[10%] top-5 h-1 rounded-full bg-tint/5" aria-hidden>
        <div className="absolute inset-y-0 start-0 rounded-full bg-accent transition-[width] duration-1000 ease-apple" style={{ width: `${fill * 100}%` }} />
      </div>
      <ol className="relative grid grid-cols-5 gap-1" aria-label="حالة الطلب">
        {ORDER_STEPS.map((step, i) => {
          const done = i <= current
          const isCurrent = i === current && status !== 'DELIVERED'
          const Icon = ICONS[step]
          return (
            <li key={step} className="flex flex-col items-center gap-2 text-center" aria-current={i === current ? 'step' : undefined}>
              <span className="relative grid size-10 place-items-center">
                {isCurrent && <span className="absolute inset-0 animate-ping rounded-full bg-sun/70" aria-hidden />}
                <span
                  className={`relative grid size-10 place-items-center rounded-full transition-colors delay-300 duration-500 ${
                    done ? 'bg-accent text-white' : 'bg-surface text-stone-400 ring-1 ring-tint/5'
                  }`}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
              </span>
              <span className={`text-[12px] leading-tight ${done ? 'font-semibold text-ink' : 'text-stone-500'}`}>{STATUS[step].label}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
