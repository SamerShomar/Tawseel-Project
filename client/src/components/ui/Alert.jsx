const styles = {
  error: 'bg-rose-50 text-rose-800',
  success: 'bg-emerald-50 text-emerald-800',
  info: 'bg-sky-50 text-sky-900',
}

export function Alert({ type = 'error', children }) {
  if (!children) return null
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`animate-page-in rounded-2xl px-4 py-3 text-[14px] ${styles[type]}`}>
      {children}
    </div>
  )
}
