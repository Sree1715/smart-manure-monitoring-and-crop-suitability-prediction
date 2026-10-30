import React from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-soft hover:shadow-card-hover',
  secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 shadow-soft hover:shadow-card-hover',
  accent: 'bg-accent-600 text-white hover:bg-accent-700 shadow-soft hover:shadow-card-hover',
  outline: 'bg-white text-primary-700 border border-slate-200 hover:border-primary-300 hover:bg-primary-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
}

const SIZES = {
  sm: 'text-sm px-3.5 py-2 rounded-lg',
  md: 'text-sm px-5 py-2.5 rounded-xl',
  lg: 'text-base px-7 py-3.5 rounded-xl',
}

/**
 * Reusable Button component.
 * Renders a <Link> if `to` is provided, an <a> if `href` is provided,
 * otherwise a native <button>.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...rest
}) {
  const classes = `inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`

  const content = (
    <>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    )
  }

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  )
}
