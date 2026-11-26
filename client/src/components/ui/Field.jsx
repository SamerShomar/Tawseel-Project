import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/** Label + input (or textarea/select via `as`) + error message. Password inputs get an eye button that shows or hides the text. */
export function Field({ label, error, as: Tag = 'input', className = '', type, ...props }) {
  const id = useId()
  const isPassword = type === 'password'
  const [shown, setShown] = useState(false)

  const input = (
    <Tag
      id={id}
      type={isPassword && shown ? 'text' : type}
      className={isPassword ? 'input pr-12' : 'input'}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
  )

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[14px] font-medium text-stone-700">
        {label}
      </label>
      {isPassword ? (
        // Password text runs left to right, so the eye sits on the right, after it.
        <div className="relative">
          {input}
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            aria-pressed={shown}
            aria-controls={id}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-stone-500 transition hover:text-ink"
          >
            {shown ? <EyeOff className="size-5" strokeWidth={1.75} aria-hidden /> : <Eye className="size-5" strokeWidth={1.75} aria-hidden />}
          </button>
        </div>
      ) : (
        input
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[13px] text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
}
