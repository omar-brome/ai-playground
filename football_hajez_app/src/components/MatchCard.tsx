import { Link } from 'react-router-dom'
import type { Match } from '../types/domain'
import { formatDateTime, formatLbp } from '../utils/format'
import { SessionStatusBadge } from './SessionStatusBadge'

function countSpotsLeft(match: Match) {
  return Object.values(match.spots).reduce((sum, s) => sum + (s.total - s.booked.length), 0)
}

export function MatchCard({ match }: { match: Match }) {
  const left = countSpotsLeft(match)
  const isFull = left === 0

  return (
    <div className="card-glow rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-white/80">{formatDateTime(match.date, match.time)}</p>
        {match.sessionStatus ? <SessionStatusBadge status={match.sessionStatus} /> : null}
      </div>
      <p className="mt-1 text-lg font-bold">{match.type}</p>
      <p className="text-sm text-accent-green">{formatLbp(match.price)} / player</p>
      <p className="mt-2 text-sm">{left} players left</p>
      {isFull ? (
        <span className="mt-3 inline-block rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
          Full
        </span>
      ) : (
        <Link
          to={`/match/${match.id}`}
          className="mt-3 inline-block rounded-full bg-accent-green px-4 py-2 text-sm font-bold text-black"
        >
          Book Now
        </Link>
      )}
    </div>
  )
}
