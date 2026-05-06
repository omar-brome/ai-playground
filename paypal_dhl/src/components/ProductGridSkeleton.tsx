export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-gold/10 bg-charcoal-deep/40"
        >
          <div className="aspect-[4/5] animate-pulse bg-charcoal-deep" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-gold/10" />
            <div className="h-4 w-full animate-pulse rounded bg-gold/5" />
            <div className="flex justify-between pt-2">
              <div className="h-6 w-16 animate-pulse rounded bg-gold/15" />
              <div className="h-9 w-28 animate-pulse rounded-full bg-gold/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
