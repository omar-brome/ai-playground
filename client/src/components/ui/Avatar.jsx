import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Avatar = forwardRef(({
  src,
  alt = '',
  fallback,
  size = 'md',
  className,
  ...props
}, ref) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderFallback = () => {
    if (fallback) {
      return typeof fallback === 'string' ? getInitials(fallback) : fallback
    }
    return getInitials(alt)
  }

  return (
    <div
      ref={ref}
      className={clsx(
        'relative flex items-center justify-center rounded-full bg-bg-tertiary border border-border overflow-hidden',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      ) : null}

      {(!src || src === '') && (
        <span className="flex items-center justify-center w-full h-full text-text-primary font-medium">
          {renderFallback()}
        </span>
      )}
    </div>
  )
})

Avatar.displayName = 'Avatar'

export default Avatar