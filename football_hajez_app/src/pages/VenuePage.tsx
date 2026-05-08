import { useEffect, useMemo } from 'react'
import { track } from '../analytics/track'
import { useNavigate, useParams } from 'react-router-dom'
import { MatchCard } from '../components/MatchCard'
import { MatchFiltersBar } from '../components/MatchFiltersBar'
import { SkeletonCard } from '../components/ui/Skeleton'
import { venues } from '../data/mockData'
import { useBooking } from '../context/BookingContext'
import { useLocale } from '../context/LocaleContext'
import { usePersistedMatchFilters } from '../hooks/useMatchFilters'
import { defaultMatchListFilters, filterMatches } from '../utils/matchFilters'

export default function VenuePage() {
  const { venueId } = useParams()
  const navigate = useNavigate()
  const { matches, matchesLoading } = useBooking()
  const { t } = useLocale()
  const { filters, updateFilters } = usePersistedMatchFilters()
  const venue = venues.find((v) => v.id === venueId)
  const allVenueMatches = useMemo(
    () => matches.filter((m) => m.venueId === venueId),
    [matches, venueId],
  )
  const venueMatches = useMemo(
    () => filterMatches(allVenueMatches, filters),
    [allVenueMatches, filters],
  )
  const filtersHideAllVenueMatches =
    !matchesLoading && allVenueMatches.length > 0 && venueMatches.length === 0

  useEffect(() => {
    if (venueId) track('venue_view', { venueId })
  }, [venueId])

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
        ← {t('venue.back')}
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
        {t('venue.openMaps')}
      </a>
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="font-bold">{t('venue.info')}</p>
        <p className="mt-2 text-sm text-white/80">{venue.about}</p>
        <p className="mt-2 text-xs text-white/70">Surface: {venue.surface}</p>
        <p className="text-xs text-white/70">Parking: {venue.parking}</p>
        <p className="mt-2 text-xs text-white/70">Amenities: {venue.amenities.join(' • ')}</p>
      </div>
      <div className="mt-4">
        <MatchFiltersBar filters={filters} onChange={updateFilters} />
      </div>
      {filtersHideAllVenueMatches ? (
        <div className="mt-4 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 text-xs text-amber-50">
          <p className="font-bold">{t('venue.filtersHiddenTitle')}</p>
          <p className="mt-1 text-amber-100/85">{t('venue.filtersHiddenBody')}</p>
          <button
            type="button"
            className="mt-2 rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-bold"
            onClick={() => updateFilters(defaultMatchListFilters)}
          >
            {t('venue.clearFilters')}
          </button>
        </div>
      ) : null}
      <div className="mt-5 space-y-3">
        {matchesLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : venueMatches.length === 0 && allVenueMatches.length === 0 ? (
          <p className="text-sm text-white/65">{t('venue.noMatches')}</p>
        ) : (
          venueMatches.map((match) => <MatchCard key={match.id} match={match} />)
        )}
      </div>
    </div>
  )
}
