import { Link } from 'react-router-dom'
import type { Venue } from '../types/domain'

type Props = {
  venue: Venue
  upcomingMatches: number
}

export function VenueCard({ venue, upcomingMatches }: Props) {
  return (
    <Link
      to={`/venue/${venue.id}`}
      className="card-glow block rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
    >
      <img src={venue.image} alt={venue.name} className="mb-3 h-32 w-full rounded-xl object-cover" />
      <p className="text-xl font-black">{venue.name}</p>
      <p className="text-sm text-white/75">{venue.location}</p>
      <p className="mt-2 text-xs text-accent-green">{upcomingMatches} upcoming matches</p>
      <p className="mt-1 text-xs text-white/60">{venue.surface} • Parking: {venue.parking}</p>
    </Link>
  )
}
