import type { BookingStatus } from '../types/domain'

const styles: Record<BookingStatus, string> = {
  confirmed: 'bg-green-500/20 text-green-300 border-green-400/40',
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
  awaiting_host_approval: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
  expired: 'bg-red-500/20 text-red-300 border-red-400/40',
  cancelled: 'bg-white/10 text-white/70 border-white/25',
}

export function StatusBadge({ status, label }: { status: BookingStatus; label?: string }) {
  const defaultLabel =
    status === 'pending'
      ? 'Pending Payment'
      : status === 'awaiting_host_approval'
        ? 'Awaiting host'
        : status === 'cancelled'
          ? 'Cancelled'
          : status[0].toUpperCase() + status.slice(1)
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status]}`}>{label ?? defaultLabel}</span>
  )
}
