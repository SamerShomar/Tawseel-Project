import { Minus, Plus } from 'lucide-react'

/** Pill-shaped − n + control. Each button keeps a 44×44 tap area; the number pops when it changes. */
export function QuantityStepper({ name, quantity, onChange }) {
  const btn = 'grid size-11 place-items-center rounded-full text-brand-700 transition active:scale-90 hover:bg-white'
  return (
    <div className="flex items-center rounded-full bg-stone-50">
      <button type="button" className={btn} onClick={() => onChange(quantity - 1)} aria-label={`إنقاص ${name}`}>
        <Minus className="size-4" strokeWidth={2} aria-hidden />
      </button>
      <span key={quantity} className="animate-pop w-6 text-center text-[17px] font-semibold" aria-live="polite">
        {quantity}
      </span>
      <button type="button" className={btn} onClick={() => onChange(quantity + 1)} aria-label={`زيادة ${name}`}>
        <Plus className="size-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}
