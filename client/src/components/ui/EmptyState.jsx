export function EmptyState({ icon = '🍽️', title, children }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="text-5xl" aria-hidden>
        {icon}
      </span>
      <h2 className="text-lg font-bold">{title}</h2>
      {children && <div className="text-sm text-stone-500">{children}</div>}
    </div>
  )
}
