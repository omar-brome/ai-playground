import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'

type CartDrawerProps = {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const {
    items,
    subtotal,
    shipping,
    total,
    updateQty,
    removeItem,
  } = useCart()
  const navigate = useNavigate()

  function goCheckout() {
    onClose()
    navigate('/checkout')
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[10000] bg-charcoal/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 z-[10001] flex h-full w-full max-w-md flex-col border-l border-gold/20 bg-charcoal-deep shadow-[-20px_0_80px_-20px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-gold/15 px-5 py-4">
          <h2 className="font-display text-xl text-cream">Your Selection</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-cream-muted transition hover:bg-gold/10 hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            aria-label="Close cart"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="mt-8 text-center font-sans text-sm text-cream-muted">
              Your cart is quiet as an unlit wick.
            </p>
          ) : (
            <ul className="flex flex-col gap-5">
              {items.map(({ product, quantity }) => (
                <li
                  key={product.id}
                  className="flex gap-4 border-b border-gold/10 pb-5"
                >
                  <img
                    src={product.image}
                    alt=""
                    className="h-20 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-cream">{product.name}</p>
                    <p className="truncate font-sans text-xs text-gold/80">
                      {product.scent}
                    </p>
                    <p className="mt-1 font-sans text-sm text-cream-muted">
                      ${product.price} each
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-full border border-gold/25">
                        <button
                          type="button"
                          className="px-3 py-1 font-sans text-sm text-cream hover:bg-gold/10"
                          onClick={() => updateQty(product.id, quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center font-sans text-sm text-cream">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          className="px-3 py-1 font-sans text-sm text-cream hover:bg-gold/10"
                          onClick={() => updateQty(product.id, quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        className="font-sans text-xs uppercase tracking-wider text-gold/70 underline-offset-2 hover:text-gold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gold/15 bg-charcoal/90 px-5 py-5">
          <div className="space-y-2 font-sans text-sm text-cream-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-cream">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping (flat)</span>
              <span className="text-cream">
                {subtotal > 0 ? `$${shipping.toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="flex justify-between border-t border-gold/10 pt-3 font-display text-lg text-gold">
              <span>Total</span>
              <span>{subtotal > 0 ? `$${total.toFixed(2)}` : '—'}</span>
            </div>
          </div>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={goCheckout}
            className="btn-glow mt-4 w-full rounded-full border border-gold/45 bg-gold/20 py-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-cream transition enabled:hover:bg-gold/35 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Proceed to Checkout
          </button>
        </div>
      </aside>
    </>
  )
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
