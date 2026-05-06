import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { CartDrawer } from './components/CartDrawer'
import { Navbar } from './components/Navbar'
import { CartProvider } from './context/CartProvider'
import { useCart } from './context/useCart'

const Home = lazy(() => import('./pages/Home'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'))
const Tracking = lazy(() => import('./pages/Tracking'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-24">
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <p className="mt-8 font-display text-xl text-gold">Lumière</p>
      <p className="mt-3 font-sans text-sm text-cream-muted">Unfolding the page…</p>
      <div className="mt-10 h-1 w-32 overflow-hidden rounded-full bg-charcoal-deep">
        <div className="h-full w-1/2 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-gold/40" />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  )
}

function RoutedLayout() {
  const location = useLocation()
  const { itemCount } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      <Navbar itemCount={itemCount} onCartClick={() => setCartOpen(true)} />
      <main className="relative flex-1">
        <Suspense fallback={<PageFallback />}>
          <div key={location.pathname} className="page-transition">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route
                path="/order-confirmation/:orderId"
                element={<OrderConfirmation />}
              />
              <Route
                path="/tracking/:trackingNumber"
                element={<Tracking />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Suspense>
      </main>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="ambient-glow" aria-hidden />
        <div className="grain-overlay" aria-hidden />
        <div className="relative z-10 flex min-h-svh flex-col">
          <RoutedLayout />
        </div>
      </CartProvider>
    </BrowserRouter>
  )
}
