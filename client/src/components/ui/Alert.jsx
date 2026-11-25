const styles = {
  error: 'bg-rose-50 dark:bg-rose-400/15 text-rose-800 dark:text-rose-300',
  success: 'bg-emerald-50 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-300',
  info: 'bg-sky-50 dark:bg-sky-400/15 text-sky-900 dark:text-sky-300',
}

export function Alert({ type = 'error', children }) {
  if (!children) return null
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`animate-page-in rounded-2xl px-4 py-3 text-[13px] ${styles[type]}`}>
      {children}
    </div>
  )
}
