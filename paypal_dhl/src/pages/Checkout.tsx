import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PayPalButton } from '../components/PayPalButton'
import { useCart } from '../context/useCart'
import { appendOrder } from '../lib/orders'
import type { PayPalOnApproveData } from '../types/paypal'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, shipping, total, clearCart } = useCart()

  const onApproved = useCallback(
    (data: PayPalOnApproveData) => {
      const orderId = `PAY-${Date.now()}`
      appendOrder({
        orderId,
        paypalOrderId: data.orderID,
        payerID: data.payerID,
        items: [...items],
        total,
        status: 'paid',
        trackingNumber: 'JD014600006251903756',
        createdAt: new Date().toISOString(),
      })
      clearCart()
      navigate(`/order-confirmation/${encodeURIComponent(orderId)}`)
    },
    [clearCart, items, navigate, total],
  )

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
            <div className="mt-8">
              <PayPalButton amountUsd={total} onApproved={onApproved} />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
