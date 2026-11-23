import { createPortal } from 'react-dom'

/**
 * A floating glass bar pinned to the bottom of the screen (cart total, checkout button).
 * Rendered into <body> so page transitions (which move the page) never move it.
 */
export function FloatingBar({ children, className = '' }) {
  return createPortal(
    <div className={`animate-rise fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-2xl ${className}`}>
      <div className="glass flex items-center justify-between gap-3 rounded-[22px] py-2.5 ps-5 pe-2.5">{children}</div>
    </div>,
    document.body,
  )
}
