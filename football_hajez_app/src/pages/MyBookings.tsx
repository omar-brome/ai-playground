import { Link } from 'react-router-dom'
import { useState } from 'react'
import { StatusBadge } from '../components/StatusBadge'
import { useBooking } from '../context/BookingContext'
import { venues } from '../data/mockData'
import { formatDateTime } from '../utils/format'
import type { Booking } from '../types/domain'

function fakeQr(reference: string) {
  const seed = [...reference].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return Array.from({ length: 49 }, (_, i) => ((i * 17 + seed) % 5 === 0 ? 'bg-white' : 'bg-white/10'))
}

export default function MyBookings() {
  const { bookings, getMatchById, cancelConfirmedBooking } = useBooking()
  const now = Date.now()
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="text-2xl font-black">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-5 text-center">
          <p className="text-base font-bold">No bookings found</p>
          <p className="mt-1 text-sm text-white/70">Join a match and your bookings will appear here.</p>
          <Link
            to="/"
            className="mt-3 inline-block rounded-xl bg-accent-green px-3 py-2 text-sm font-bold text-black"
          >
            Browse Matches
          </Link>
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {bookings.map((booking) => {
          const match = getMatchById(booking.matchId)
          const venue = venues.find((v) => v.id === booking.venueId)
          if (!match) return null
          return (
            <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{venue?.name}</p>
                  <p className="text-sm text-white/75">{formatDateTime(match.date, match.time)}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <p className="mt-2 text-sm">Position: {booking.position}</p>
              <p className="mt-1 text-xs text-white/70">
                Team: {booking.team === 'team1' ? 'Team 1' : 'Opposite Team'}
              </p>
              {booking.status === 'pending' ? (
                <div className="mt-3">
                  <p className="text-xs text-yellow-300">
                    Remaining:{' '}
                    {Math.max(
                      0,
                      Math.floor((new Date(booking.expiresAt).getTime() - now) / 60000),
                    )}{' '}
                    min
                  </p>
                  <Link
                    to={`/payment/${booking.id}`}
                    className="mt-2 inline-block rounded-xl bg-accent-green px-3 py-2 text-sm font-bold text-black"
                  >
                    Complete Payment
                  </Link>
                </div>
              ) : null}
              {booking.status === 'confirmed' ? (
                <div className="mt-3">
                  <p className="mb-2 text-xs text-white/65">Reference #{booking.id}</p>
                  <div className="grid w-24 grid-cols-7 gap-0.5 rounded bg-white/5 p-1">
                    {fakeQr(booking.id).map((cls, idx) => (
                      <span key={`${booking.id}-${idx}`} className={`h-2.5 w-2.5 ${cls}`} />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300"
                    onClick={() => setCancelTarget(booking)}
                  >
                    Cancel Confirmed Booking
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      {cancelTarget ? (
        <div className="fixed inset-0 z-30 bg-black/70 px-4">
          <div className="mx-auto mt-28 max-w-md rounded-2xl border border-white/15 bg-bg-navy p-5">
            <p className="text-lg font-black text-red-300">Cancel confirmed spot?</p>
            <p className="mt-3 text-sm text-white/80">
              Your money will not be returned as a penalty for canceling.
            </p>
            <p className="mt-2 text-sm text-white/80">
              The host will keep the money as compensation for the cancellation.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/25 px-3 py-2 text-sm font-bold"
                onClick={() => setCancelTarget(null)}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white"
                onClick={() => {
                  cancelConfirmedBooking(cancelTarget.id)
                  setCancelTarget(null)
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
