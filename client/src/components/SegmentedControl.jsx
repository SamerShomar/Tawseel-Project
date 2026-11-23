import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Apple-style segmented control: a gray pill with a white indicator that slides to the selected option.
 * options: [{ key, label, badge? }]. Keeps role="tablist" semantics.
 */
export function SegmentedControl({ options, value, onChange, label }) {
  const refs = useRef({})
  const [indicator, setIndicator] = useState(null)

  // Measure the selected button and move the indicator under it (also on resize).
  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value]
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [value, options])

  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="tablist" aria-label={label} className="relative inline-flex rounded-full bg-stone-100 p-1">
        {indicator && (
          <span
            className="absolute top-1 bottom-1 rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.12)] transition-all duration-400 ease-apple"
            style={{ left: indicator.left, width: indicator.width }}
            aria-hidden
          />
        )}
        {options.map((o) => (
          <button
            key={o.key}
            ref={(el) => (refs.current[o.key] = el)}
            role="tab"
            aria-selected={value === o.key}
            onClick={() => onChange(o.key)}
            className={`relative flex h-11 items-center gap-2 rounded-full px-4 text-[14px] whitespace-nowrap transition-colors ${
              value === o.key ? 'font-semibold text-ink' : 'text-stone-600 hover:text-ink'
            }`}
          >
            {o.label}
            {o.badge != null && (
              <span
                className={`min-w-6 rounded-full px-1.5 text-[12px] leading-5 ${o.highlight ? 'bg-accent text-white' : 'bg-black/5 text-stone-600'}`}
              >
                {o.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
