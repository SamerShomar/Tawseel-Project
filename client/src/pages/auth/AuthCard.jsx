import { Link } from 'react-router'

export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-gradient-to-b from-brand-50 to-stone-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="card p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-4 text-center text-sm text-stone-600">{footer}</p>}
      </div>
    </div>
  )
}

export const AuthLink = (props) => <Link className="font-semibold text-brand-700 hover:underline" {...props} />
