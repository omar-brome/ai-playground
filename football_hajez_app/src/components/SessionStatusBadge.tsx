import type { MatchSessionStatus } from '../types/domain'

const styles: Record<MatchSessionStatus, string> = {
  open: 'border-accent-green/50 bg-accent-green/15 text-accent-green',
  full: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
  cancelled: 'border-red-400/40 bg-red-500/15 text-red-200',
  finished: 'border-white/25 bg-white/10 text-white/70',
}

const labels: Record<MatchSessionStatus, string> = {
  open: 'Open',
  full: 'Full',
  cancelled: 'Cancelled',
  finished: 'Finished',
}

export function SessionStatusBadge({ status }: { status: MatchSessionStatus }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
