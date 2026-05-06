import { Link } from 'react-router-dom'

type NavbarProps = {
  itemCount: number
  onCartClick: () => void
}

export function Navbar({ itemCount, onCartClick }: NavbarProps) {
  return (
    <header className="relative z-10 border-b border-gold/15 bg-charcoal/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="font-display text-xl tracking-[0.12em] text-cream transition hover:text-gold sm:text-2xl"
        >
          Lumière
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden rounded-full border border-gold/35 bg-charcoal-deep/90 px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-widest text-gold/90 sm:inline">
            🧪 Demo Mode
          </span>
          <span className="inline rounded-full border border-gold/35 bg-charcoal-deep/90 px-2.5 py-1 font-sans text-[9px] font-medium uppercase tracking-wider text-gold/90 sm:hidden">
            🧪 Demo
          </span>

          <button
            type="button"
            onClick={onCartClick}
            className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-gold/25 bg-charcoal-deep/80 text-cream transition hover:border-gold/50 hover:shadow-[0_0_24px_-4px_rgba(201,169,110,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            aria-label={`Open cart, ${itemCount} items`}
          >
            <CartIcon className="h-5 w-5" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 font-sans text-[10px] font-semibold text-charcoal">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  )
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  )
}
