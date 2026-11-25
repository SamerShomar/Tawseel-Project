/** Soft, slowly drifting color blobs. Put glass panels on top of it to show the frosted effect. */
export function Aurora({ className = '' }) {
  const blob = 'animate-drift absolute rounded-full blur-3xl'
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden dark:opacity-30 ${className}`} aria-hidden>
      <div className={`${blob} -top-[10%] start-[5%] size-[55%] bg-brand-200/70`} />
      <div className={`${blob} top-[25%] end-[0%] size-[50%] bg-amber-200/60 [animation-delay:-6s]`} />
      <div className={`${blob} -bottom-[15%] start-[30%] size-[50%] bg-rose-200/50 [animation-delay:-12s]`} />
    </div>
  )
}
