import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { venues } from '../data/mockData'
import { useBooking } from '../context/BookingContext'
import { useRole } from '../context/RoleContext'
import { VenueCard } from '../components/VenueCard'
import { getHostReservations, setHostReservations } from '../utils/localStorage'
import type { HostReservation } from '../types/domain'

export default function Home() {
  const { matches, createHostMatch } = useBooking()
  const { role } = useRole()
  const [venueSelection, setVenueSelection] = useState(venues[0]?.id ?? '4b')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [hostError, setHostError] = useState('')
  const [hostReservations, setHostReservationsState] = useState<HostReservation[]>(() => getHostReservations())
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  const timeInputRef = useRef<HTMLInputElement | null>(null)

  const openNativePicker = (ref: { current: HTMLInputElement | null }) => {
    const input = ref.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }
    input.focus()
    input.click()
  }

  const matchIntervals = useMemo(
    () =>
      matches.map((match) => {
        const [y, m, d] = match.date.split('-').map(Number)
        const [hh, mm] = match.time.split(':').map(Number)
        const startMs = new Date(y, m - 1, d, hh, mm).getTime()
        return { venueId: match.venueId, startMs, endMs: startMs + 90 * 60 * 1000 }
      }),
    [matches],
  )

  const createHostReservation = () => {
    setHostError('')
    if (!startDate || !startTime) {
      setHostError('Please pick date and time.')
      return
    }
    const startMs = new Date(`${startDate}T${startTime}`).getTime()
    if (Number.isNaN(startMs)) {
      setHostError('Invalid date/time.')
      return
    }
    const minute = new Date(startMs).getMinutes()
    if (minute !== 0 && minute !== 30) {
      setHostError('Only :00 and :30 start times are allowed.')
      return
    }
    const endMs = startMs + 90 * 60 * 1000

    const reservationOverlap = hostReservations.some((item) => {
      if (item.venueId !== venueSelection) return false
      const existingStart = new Date(item.startAt).getTime()
      const existingEnd = new Date(item.endAt).getTime()
      return startMs < existingEnd && existingStart < endMs
    })

    const matchOverlap = matchIntervals.some(
      (item) => item.venueId === venueSelection && startMs < item.endMs && item.startMs < endMs,
    )

    if (reservationOverlap || matchOverlap) {
      setHostError('This venue already has a match in that time window.')
      return
    }

    try {
      createHostMatch({ venueId: venueSelection, startMs })
    } catch (error) {
      setHostError(error instanceof Error ? error.message : 'Could not create hosted match.')
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
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <p className="text-3xl font-black">Malaab</p>
      <p className="text-sm text-white/70">{role === 'pitch_host' ? 'Your pitch. Your squad.' : 'Book your spot. Own the pitch.'}</p>
      <img
        src={role === 'pitch_host' ? '/images/home-host-hero.png' : '/images/home-hero.png'}
        alt={role === 'pitch_host' ? 'Pitch host coach' : 'Football hero'}
        className="mt-3 h-40 w-full rounded-2xl object-cover"
      />
      <div className="mt-3 flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2">
        <p className="text-xs text-white/80">
          Current mode: <span className="font-bold">{role === 'pitch_host' ? 'Pitch Host' : 'Player'}</span>
        </p>
        <Link to="/welcome" className="rounded-lg border border-white/20 px-2 py-1 text-xs font-bold">
          Change
        </Link>
      </div>
      {role === 'pitch_host' ? (
        <>
          <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            <p className="font-bold">Book field slot (1h 30m)</p>
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
              <div className="flex items-center gap-2">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-bg-navy p-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => openNativePicker(dateInputRef)}
                  className="h-10 w-10 rounded-xl border border-white/25 bg-white/5 text-lg"
                  aria-label="Open date picker"
                  title="Open date picker"
                >
                  📅
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={timeInputRef}
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  step={1800}
                  className="w-full rounded-xl border border-white/20 bg-bg-navy p-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => openNativePicker(timeInputRef)}
                  className="h-10 w-10 rounded-xl border border-white/25 bg-white/5 text-lg"
                  aria-label="Open time picker"
                  title="Open time picker"
                >
                  🕒
                </button>
              </div>
              <button
                type="button"
                onClick={createHostReservation}
                className="w-full rounded-xl bg-accent-green p-2 text-sm font-bold text-black"
              >
                Book Venue for 1h30
              </button>
              {hostError ? <p className="text-xs text-red-300">{hostError}</p> : null}
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-4">
            <p className="font-bold">Hosted sessions</p>
            <div className="mt-2 space-y-2">
              {hostReservations.length === 0 ? (
                <p className="text-sm text-white/70">No hosted sessions yet.</p>
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
      <div className="mt-5 space-y-3">
        {venues.map((venue) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            upcomingMatches={matches.filter((m) => m.venueId === venue.id).length}
          />
        ))}
      </div>
    </div>
  )
}
