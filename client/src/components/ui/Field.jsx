import { useId } from 'react'

/** Label + input (or textarea/select via `as`) + error message. */
export function Field({ label, error, as: Tag = 'input', className = '', ...props }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-base font-medium text-stone-700 md:text-sm">
        {label}
      </label>
      <Tag
        id={id}
        className="input"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
