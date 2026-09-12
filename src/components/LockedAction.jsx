import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function LockedAction({ children, onClick, className = '', ...rest }) {
  const { user } = useAuth()
  if (!user) {
    return (
      <span className="inline-flex items-center gap-2">
        <Link
          to="/signup"
          className={`${className} opacity-60 cursor-not-allowed`}
          aria-disabled="true"
          {...rest}
        >
          🔒 {children}
        </Link>
        <span className="text-xs text-slate-500">Create an account to unlock</span>
      </span>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className} {...rest}>
      {children}
    </button>
  )
}
