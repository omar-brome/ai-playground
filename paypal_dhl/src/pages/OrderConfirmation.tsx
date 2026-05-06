import { Link, useParams } from 'react-router-dom'
import { getOrderById } from '../lib/orders'

export default function OrderConfirmation() {
  const { orderId: rawId } = useParams()
  const orderId = rawId ? decodeURIComponent(rawId) : undefined
  const order = orderId ? getOrderById(orderId) : undefined

  if (!order) {
    return (
      <div className="page-transition px-4 py-16 text-center sm:px-6">
        <h1 className="font-display text-2xl text-cream">Order not found</h1>
        <p className="mt-3 font-sans text-sm text-cream-muted">
          This order is not in local storage on this device.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-full border border-gold/40 px-6 py-2 font-sans text-xs font-semibold uppercase tracking-widest text-gold transition hover:bg-gold/15"
        >
          Return home
        </Link>
      </div>
    )
  }

  return (
    <div className="page-transition px-4 py-10 sm:px-6 lg:mx-auto lg:max-w-3xl lg:py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-gold/80">
        Thank you
      </p>
      <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
        Your ritual is reserved
      </h1>
      <p className="mt-4 font-sans text-cream-muted">
        Order <span className="text-cream">{order.orderId}</span> is marked paid in
        this demo. PayPal order:{' '}
        <span className="font-mono text-xs text-gold/90">{order.paypalOrderId}</span>
      </p>

      <div className="mt-10 rounded-2xl border border-gold/25 bg-charcoal-deep/60 p-6 card-glow">
        <p className="font-sans text-xs uppercase tracking-widest text-gold/70">
          DHL tracking (demo)
        </p>
        <p className="mt-2 font-mono text-xl text-cream sm:text-2xl">
          {order.trackingNumber}
        </p>
        <Link
          to={`/tracking/${encodeURIComponent(order.trackingNumber)}`}
          className="btn-glow mt-6 inline-block rounded-full border border-gold/45 bg-gold/20 px-8 py-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-cream transition hover:bg-gold/35"
        >
          Track My Order
        </Link>
      </div>

      <section className="mt-10 rounded-2xl border border-gold/15 bg-charcoal-deep/30 p-6">
        <h2 className="font-display text-lg text-gold">Items</h2>
        <ul className="mt-4 space-y-3 font-sans text-sm text-cream-muted">
          {order.items.map(({ product, quantity }) => (
            <li key={product.id} className="flex justify-between gap-4">
              <span>
                {product.name} × {quantity}
              </span>
              <span className="text-gold">${(product.price * quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-gold/10 pt-4 text-right font-display text-xl text-gold">
          Paid ${order.total.toFixed(2)}
        </p>
        <p className="mt-2 text-right font-sans text-xs text-cream-muted">
          {new Date(order.createdAt).toLocaleString()}
        </p>
      </section>
    </div>
  )
}
