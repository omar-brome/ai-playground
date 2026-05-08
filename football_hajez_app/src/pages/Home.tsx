import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { venues } from '../data/mockData'
import { useBooking } from '../context/BookingContext'
import { useRole } from '../context/RoleContext'
import { isSupabaseBackend } from '../config/env'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { beirutWallToUtcIso } from '../utils/beirutTime'
import { VenueCard } from '../components/VenueCard'
import { getHostReservations, setHostReservations } from '../utils/localStorage'
import type { HostReservation } from '../types/domain'
import { HostDateTimePicker } from '../components/HostDateTimePicker'
import { MatchFiltersBar } from '../components/MatchFiltersBar'
import { SkeletonCard } from '../components/ui/Skeleton'
import { usePersistedMatchFilters } from '../hooks/useMatchFilters'
import {
  HOST_MATCH_DURATION_MS,
  hostReservationConflicts,
  hostSlotConflictsWithWindows,
  isHalfHourWallTime,
  matchesToVenueWindows,
} from '../utils/hostScheduling'
import { toast } from '../utils/toast'

export default function Home() {
  const { matches, createHostMatch, matchesLoading } = useBooking()
  const { role } = useRole()
  const { user } = useAuth()
  const { t } = useLocale()
  const [searchParams] = useSearchParams()
  const { filters, updateFilters } = usePersistedMatchFilters()
  const [venueSelection, setVenueSelection] = useState(venues[0]?.id ?? '4b')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [hostError, setHostError] = useState('')
  const [hostReservations, setHostReservationsState] = useState<HostReservation[]>(() => getHostReservations())

  useEffect(() => {
    const vid = searchParams.get('venueId')
    if (vid && venues.some((v) => v.id === vid)) {
      queueMicrotask(() => setVenueSelection(vid))
    }
  }, [searchParams])

  const matchWindows = useMemo(() => matchesToVenueWindows(matches, HOST_MATCH_DURATION_MS), [matches])

  const createHostReservation = () => {
    setHostError('')
    if (isSupabaseBackend() && !user) {
      setHostError(t('home.hostErrorSignIn'))
      return
    }
    if (!startDate || !startTime) {
      setHostError(t('home.hostErrorDateTime'))
      return
    }
    const startsAtIso = beirutWallToUtcIso(startDate, startTime)
    const startMs = new Date(startsAtIso).getTime()
    if (Number.isNaN(startMs)) {
      setHostError(t('home.hostErrorInvalid'))
      return
    }
    if (!isHalfHourWallTime(startTime)) {
      setHostError(t('home.hostErrorHalfHour'))
      return
    }
    const endMs = startMs + HOST_MATCH_DURATION_MS

    const reservationOverlap = hostReservationConflicts(venueSelection, startMs, endMs, hostReservations)
    const matchOverlap = hostSlotConflictsWithWindows(venueSelection, startMs, endMs, matchWindows)

    if (reservationOverlap || matchOverlap) {
      setHostError(t('home.hostErrorOverlap'))
      return
    }

    void (async () => {
      try {
        await createHostMatch({
          venueId: venueSelection,
          startMs,
          startsAtIso,
          startDate,
          startTime,
        })
        toast.success(t('home.toastHostCreated'))
      } catch (error) {
        const msg = error instanceof Error ? error.message : t('home.hostErrorGeneric')
        setHostError(msg)
        toast.error(msg)
        return
      }

      const reservation: HostReservation = {
        id: `HR-${Date.now()}`,
        venueId: venueSelection,
        startAt: new Date(startMs).toISOString(),
        endAt: new Date(endMs).toISOString(),
        createdAt: new Date().toISOString(),
      }
      const next = [reservation, ...hostReservations]
      setHostReservationsState(next)
      setHostReservations(next)
      setStartDate('')
      setStartTime('')
    })()
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <p className="text-3xl font-black">{t('home.title')}</p>
      <p className="text-sm text-white/70">{role === 'pitch_host' ? t('home.taglineHost') : t('home.taglinePlayer')}</p>
      <img
        src={role === 'pitch_host' ? '/images/home-host-hero.png' : '/images/home-hero.png'}
        alt={role === 'pitch_host' ? 'Pitch host coach' : 'Football hero'}
        className="mt-3 h-40 w-full rounded-2xl object-cover"
      />
      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2">
        <p className="text-xs text-white/80">
          {t('home.mode')}: <span className="font-bold">{role === 'pitch_host' ? t('header.roleHost') : t('header.rolePlayer')}</span>
        </p>
        <Link to="/welcome" className="rounded-lg border border-white/20 px-2 py-1 text-xs font-bold">
          {t('home.change')}
        </Link>
      </div>
      {role === 'pitch_host' ? (
        <>
          <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            <p className="font-bold">{t('home.hostPanelTitle')}</p>
            <div className="mt-3 space-y-2">
              <select
                value={venueSelection}
                onChange={(e) => setVenueSelection(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-bg-navy p-2 text-sm"
              >
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              <HostDateTimePicker
                date={startDate}
                time={startTime}
                timeLabel={t('picker.timeLabel')}
                onChange={({ date, time: nextTime }) => {
                  setStartDate(date)
                  setStartTime(nextTime)
                }}
              />
              <button
                type="button"
                onClick={createHostReservation}
                className="w-full rounded-xl bg-accent-green p-2 text-sm font-bold text-black"
              >
                {t('home.hostSubmit')}
              </button>
              {hostError ? <p className="text-xs text-red-300">{hostError}</p> : null}
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-4">
            <p className="font-bold">{t('home.hostedSessions')}</p>
            <div className="mt-2 space-y-2">
              {hostReservations.length === 0 ? (
                <p className="text-sm text-white/70">{t('home.noHostedSessions')}</p>
              ) : (
                hostReservations.map((item) => {
                  const venue = venues.find((v) => v.id === item.venueId)
                  return (
                    <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
                      <p className="font-bold">{venue?.name ?? item.venueId}</p>
                      <p className="text-white/75">
                        {new Date(item.startAt).toLocaleString('en-GB', { timeZone: 'Asia/Beirut' })} -{' '}
                        {new Date(item.endAt).toLocaleTimeString('en-GB', {
                          timeZone: 'Asia/Beirut',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      ) : null}
      <div className="mt-5">
        <MatchFiltersBar filters={filters} onChange={updateFilters} />
      </div>
      <div className="mt-5 space-y-3">
        {matchesLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          venues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              upcomingMatches={matches.filter((m) => m.venueId === venue.id).length}
            />
          ))
        )}
      </div>
    </div>
  )
}
