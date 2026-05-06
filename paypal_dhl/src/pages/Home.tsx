import { useEffect, useState } from 'react'
import { ProductCard } from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/ProductGridSkeleton'
import { products } from '../data/products'
import { useCart } from '../context/useCart'

export default function Home() {
  const { addItem } = useCart()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 600)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="page-transition px-4 py-12 sm:px-6 lg:mx-auto lg:max-w-6xl lg:py-16">
      <header className="mx-auto mb-14 max-w-2xl text-center">
        <p className="mb-4 font-sans text-[11px] uppercase tracking-[0.35em] text-gold/80">
          Artisan designer candles
        </p>
        <h1 className="font-display text-4xl leading-tight text-cream drop-shadow-[0_0_40px_rgba(201,169,110,0.15)] sm:text-5xl md:text-6xl">
          Lumière
        </h1>
        <p className="mt-6 font-sans text-base leading-relaxed text-cream-muted sm:text-lg">
          Small-batch wax, woven with smoke and bloom. Compose your evening ritual
          from our atelier edits.
        </p>
      </header>

      {!ready ? (
        <ProductGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onAdd={addItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
