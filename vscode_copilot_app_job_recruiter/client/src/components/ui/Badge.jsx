import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Badge = forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center font-medium transition-colors'

  const variantClasses = {
    default: 'bg-bg-tertiary text-text-secondary border border-border',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border border-secondary/20',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-error/10 text-error border border-error/20',
    info: 'bg-info/10 text-info border border-info/20',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs rounded',
    md: 'px-2.5 py-0.5 text-sm rounded-md',
    lg: 'px-3 py-1 text-base rounded-lg',
  }

  return (
    <span
      ref={ref}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'

export default Badge