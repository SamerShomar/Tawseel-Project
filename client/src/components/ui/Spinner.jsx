export function Spinner({ className = '' }) {
  return (
    <div role="status" aria-label="جاري التحميل" className={`flex justify-center py-16 ${className}`}>
      <span className="size-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
    </div>
  )
}
