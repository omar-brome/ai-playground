import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PayPalButton } from '../components/PayPalButton'
import { useCart } from '../context/useCart'
import { appendOrder } from '../lib/orders'
import type { PayPalOnApproveData } from '../types/paypal'

const DEMO_TRACKING = 'JD014600006251903756'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, shipping, total, clearCart } = useCart()

  const finalizePaidOrder = useCallback(
    (
      data: PayPalOnApproveData,
      next: 'order-confirmation' | 'tracking',
    ) => {
      const orderId = `PAY-${Date.now()}`
      appendOrder({
        orderId,
        paypalOrderId: data.orderID,
        payerID: data.payerID,
        items: [...items],
        total,
        status: 'paid',
        trackingNumber: DEMO_TRACKING,
        createdAt: new Date().toISOString(),
      })
      clearCart()
      if (next === 'tracking') {
        navigate(`/tracking/${encodeURIComponent(DEMO_TRACKING)}`)
      } else {
        navigate(`/order-confirmation/${encodeURIComponent(orderId)}`)
      }
    },
    [clearCart, items, navigate, total],
  )

  const onApproved = useCallback(
    (data: PayPalOnApproveData) => finalizePaidOrder(data, 'order-confirmation'),
    [finalizePaidOrder],
  )

  const skipPayPalDemoToDhl = useCallback(() => {
    finalizePaidOrder(
      { orderID: `DEMO-SKIP-PAYPAL-${Date.now()}`, payerID: 'DEMO-SKIP' },
      'tracking',
    )
  }, [finalizePaidOrder])

  return (
    <div className="page-transition px-4 py-10 sm:px-6 lg:mx-auto lg:max-w-6xl lg:py-14">
      <h1 className="font-display text-3xl text-cream sm:text-4xl">Checkout</h1>
      <p className="mt-2 font-sans text-sm text-cream-muted">
        PayPal sandbox — no real charges. Order ships with a demo DHL label.
      </p>

      {items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-gold/15 bg-charcoal-deep/50 p-8 text-center">
          <p className="font-sans text-cream-muted">Your cart is empty.</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full border border-gold/40 px-6 py-2 font-sans text-xs font-semibold uppercase tracking-widest text-gold transition hover:bg-gold/15"
          >
            Browse candles
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <section className="rounded-2xl border border-gold/15 bg-charcoal-deep/40 p-6 card-glow">
            <h2 className="font-display text-xl text-gold">Order summary</h2>
            <ul className="mt-6 space-y-4">
              {items.map(({ product, quantity }) => (
                <li
                  key={product.id}
                  className="flex justify-between gap-4 border-b border-gold/10 pb-4 font-sans text-sm"
                >
                  <span className="text-cream">
                    {product.name}{' '}
                    <span className="text-cream-muted">× {quantity}</span>
                  </span>
                  <span className="shrink-0 text-gold">
                    ${(product.price * quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 font-sans text-sm text-cream-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-cream">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-cream">${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gold/15 pt-3 font-display text-lg text-gold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gold/15 bg-charcoal-deep/40 p-6">
            <h2 className="font-display text-xl text-cream">Pay with PayPal</h2>
            <p className="mt-2 font-sans text-sm text-cream-muted">
              Use a PayPal sandbox buyer account to complete this demo purchase.
            </p>
            <div className="mt-6 rounded-xl border border-gold/20 bg-charcoal-deep/50 p-4">
              <p className="font-sans text-xs leading-relaxed text-cream-muted">
                Demo shortcut: skip the PayPal step, record the order as paid, and open DHL
                tracking (same mock label as a real checkout).
              </p>
              <button
                type="button"
                onClick={skipPayPalDemoToDhl}
                className="btn-glow mt-3 w-full rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-widest text-cream transition hover:bg-gold/25 sm:w-auto"
              >
                Skip PayPal — assume paid (demo → DHL)
              </button>
            </div>
            <div className="mt-8">
              <PayPalButton amountUsd={total} onApproved={onApproved} />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
