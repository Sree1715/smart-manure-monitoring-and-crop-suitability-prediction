import React from 'react'

/**
 * Reusable Card component with optional icon header, title, and hover lift.
 */
export default function Card({
  children,
  icon: Icon,
  iconColor = 'text-primary-600',
  iconBg = 'bg-primary-50',
  title,
  subtitle,
  hoverEffect = true,
  padding = 'p-6',
  className = '',
  as: Tag = 'div',
  ...rest
}) {
  return (
    <Tag
      className={`bg-white rounded-2xl shadow-card border border-slate-100 ${padding} transition-all duration-300 ${
        hoverEffect ? 'hover:shadow-card-hover hover:-translate-y-1' : ''
      } ${className}`}
      {...rest}
    >
      {Icon && (
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${iconBg} mb-4`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      )}
      {title && <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{title}</h3>}
      {subtitle && <p className="text-sm text-slate-500 mb-3">{subtitle}</p>}
      {children}
    </Tag>
  )
}

export function StatCard({ icon: Icon, label, value, trend, accent = 'primary' }) {
  const accents = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    accent: 'bg-accent-50 text-accent-600',
  }
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex items-center justify-between hover:shadow-card-hover transition-shadow duration-300">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {trend && <p className="text-xs text-secondary-600 font-medium mt-1">{trend}</p>}
      </div>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accents[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  )
}
