import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MatchCard } from '../components/MatchCard'
import { venues } from '../data/mockData'
import { useBooking } from '../context/BookingContext'

export default function VenuePage() {
  const { venueId } = useParams()
  const navigate = useNavigate()
  const { matches } = useBooking()
  const venue = venues.find((v) => v.id === venueId)
  const venueMatches = useMemo(() => matches.filter((m) => m.venueId === venueId), [matches, venueId])

  if (!venue) return <div className="p-6">Venue not found.</div>

  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    `${venue.name} ${venue.location} Lebanon`,
  )}&z=17&output=embed`

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <button
        type="button"
        className="mb-3 rounded-lg border border-white/20 px-3 py-1 text-xs font-bold text-white/85"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <img src={venue.image} alt={venue.name} className="h-40 w-full rounded-2xl object-cover" />
      <h1 className="mt-4 text-3xl font-black">{venue.name}</h1>
      <p className="text-white/70">{venue.location}</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <iframe
          title={`${venue.name} map`}
          src={mapEmbedUrl}
          className="h-52 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={venue.mapUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-bold"
      >
        Open in Google Maps
      </a>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="font-bold">Venue Info</p>
        <p className="mt-2 text-sm text-white/80">{venue.about}</p>
        <p className="mt-2 text-xs text-white/70">Surface: {venue.surface}</p>
        <p className="text-xs text-white/70">Parking: {venue.parking}</p>
        <p className="mt-2 text-xs text-white/70">Amenities: {venue.amenities.join(' • ')}</p>
      </div>
      <div className="mt-5 space-y-3">
        {venueMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}
