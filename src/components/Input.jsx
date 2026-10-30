import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Reusable Input component with label, icon, error state, and password toggle.
 */
export default function Input({
  label,
  type = 'text',
  icon: Icon,
  error,
  hint,
  id,
  className = '',
  containerClassName = '',
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).slice(2)}`
  const isPassword = type === 'password'
  const resolvedType = isPassword && showPassword ? 'text' : type

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-4.5 h-4.5" />
          </span>
        )}
        <input
          id={inputId}
          type={resolvedType}
          className={`w-full rounded-xl border bg-white text-sm text-slate-800 placeholder:text-slate-400 py-2.5 ${
            Icon ? 'pl-10' : 'pl-4'
          } ${isPassword ? 'pr-10' : 'pr-4'} transition-colors duration-200 ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
          } outline-none ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
