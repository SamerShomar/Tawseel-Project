export function Spinner({ className = '' }) {
  return (
    <div role="status" aria-label="جاري التحميل" className={`flex justify-center py-16 ${className}`}>
      <span className="size-7 animate-spin rounded-full border-[3px] border-stone-200 border-t-stone-500" />
    </div>
  )
}
