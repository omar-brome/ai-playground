export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className ?? ''}`} />
}

export function SkeletonCard() {
  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
      <Skeleton className="h-4 w-3/4 max-w-[12rem]" />
      <Skeleton className="h-3 w-1/2 max-w-[8rem]" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}
