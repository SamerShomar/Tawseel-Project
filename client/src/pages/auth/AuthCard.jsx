import { Link } from 'react-router'

/** Sign-in style screen: a frosted-glass card floating over slowly drifting color. */
export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md">
        <div className="glass rounded-[28px] p-6 sm:p-10">
          <h1 className="text-center text-[26px] leading-[1.125] font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-center text-[16px] text-stone-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
        {footer && <p className="mt-5 text-center text-[14px] text-stone-700">{footer}</p>}
      </div>
    </div>
  )
}

export const AuthLink = (props) => <Link className="inline-block py-3 font-semibold text-brand-700 hover:underline" {...props} />
