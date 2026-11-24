import { UtensilsCrossed } from 'lucide-react'

/** Centered message for empty lists. `icon` is a lucide icon component (an emoji string still works). */
export function EmptyState({ icon: Icon = UtensilsCrossed, title, children }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {typeof Icon === 'string' ? (
        <span className="text-5xl" aria-hidden>
          {Icon}
        </span>
      ) : (
        <Icon className="size-12 text-stone-400" strokeWidth={1.25} aria-hidden />
      )}
      <h2 className="text-[18px] font-semibold">{title}</h2>
      {children && <div className="text-[15px] text-stone-500">{children}</div>}
    </div>
  )
}
