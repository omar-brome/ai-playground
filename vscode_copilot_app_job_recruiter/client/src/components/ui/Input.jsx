import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  ...props
}, ref) => {
  const inputClasses = clsx(
    'flex h-10 w-full rounded-lg border bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
    error && 'border-error focus:ring-error',
    !error && 'border-border',
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    className
  )

  return (
    <div className={clsx('space-y-1', fullWidth && 'w-full')}>
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-sm text-text-muted">{helperText}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input