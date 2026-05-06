import type { Product } from '../data/products'

type ProductCardProps = {
  product: Product
  index: number
  onAdd: (product: Product) => void
}

export function ProductCard({ product, index, onAdd }: ProductCardProps) {
  const delayMs = index * 75

  return (
    <article
      className="animate-candle-in card-glow group flex flex-col overflow-hidden rounded-2xl border border-gold/15 bg-charcoal-deep/60"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={product.image}
          alt=""
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
        <p className="absolute bottom-3 left-3 right-3 font-sans text-xs text-cream-muted">
          {product.weight} · {product.burnTime}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <h2 className="font-display text-lg text-cream sm:text-xl">
          {product.name}
        </h2>
        <p className="font-sans text-sm italic text-gold/85">{product.scent}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="font-display text-xl text-gold">${product.price}</span>
          <button
            type="button"
            onClick={() => onAdd(product)}
            className="btn-glow rounded-full border border-gold/40 bg-gold/10 px-4 py-2 font-sans text-xs font-semibold uppercase tracking-widest text-cream transition hover:bg-gold/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  )
}
