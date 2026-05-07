import type { BookingStatus } from '../types/domain'

const styles: Record<BookingStatus, string> = {
  confirmed: 'bg-green-500/20 text-green-300 border-green-400/40',
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
  expired: 'bg-red-500/20 text-red-300 border-red-400/40',
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const label = status === 'pending' ? 'Pending Payment' : status[0].toUpperCase() + status.slice(1)
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status]}`}>{label}</span>
}
