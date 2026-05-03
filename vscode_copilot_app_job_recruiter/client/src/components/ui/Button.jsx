import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400 focus:ring-primary-500 border-2 border-primary-600 dark:border-primary-500 shadow-soft hover:shadow-medium dark:shadow-glow-primary transition-all duration-200 hover:scale-105 active:scale-95',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 dark:bg-secondary-500 dark:hover:bg-secondary-400 focus:ring-secondary-500 border-2 border-secondary-600 dark:border-secondary-500 shadow-soft hover:shadow-medium dark:shadow-glow transition-all duration-200 hover:scale-105 active:scale-95',
    outline: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500 border-2 border-neutral-300 dark:border-neutral-600 shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105 active:scale-95',
    ghost: 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:ring-primary-500 border-2 border-transparent hover:border-neutral-300 dark:hover:border-neutral-600 shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105 active:scale-95',
    danger: 'bg-error-600 text-white hover:bg-error-700 dark:bg-error-500 dark:hover:bg-error-400 focus:ring-red-500 border-2 border-error-600 dark:border-error-500 shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105 active:scale-95',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg',
    xl: 'px-8 py-4 text-xl rounded-xl',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button