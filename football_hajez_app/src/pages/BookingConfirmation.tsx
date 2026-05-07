import { Link } from 'react-router-dom'
import type { Booking } from '../types/domain'
import { venues } from '../data/mockData'
import { useBooking } from '../context/BookingContext'
import { formatDateTime, formatLbp } from '../utils/format'

export default function BookingConfirmation({ booking }: { booking: Booking }) {
  const { getMatchById } = useBooking()
  const match = getMatchById(booking.matchId)
  const venue = venues.find((v) => v.id === booking.venueId)

  return (
    <div className="rounded-2xl border border-green-400/30 bg-green-500/10 p-4">
      <p className="text-2xl">✅</p>
      <p className="mt-2 text-xl font-black">You're in! See you on the pitch.</p>
      {match ? (
        <div className="mt-2 text-sm text-white/80">
          <p>
            {venue?.name} • {formatDateTime(match.date, match.time)} •{' '}
            {booking.team === 'team1' ? 'Team 1' : 'Opposite Team'} • {booking.position} •{' '}
            {formatLbp(booking.amount)}
          </p>
          <p className="mt-1">Full Name: {booking.playerName}</p>
          <p>Phone Number: {booking.phone}</p>
        </div>
      ) : null}
      <Link to="/bookings" className="mt-4 inline-block rounded-xl bg-accent-green px-4 py-2 font-bold text-black">
        View My Bookings
      </Link>
    </div>
  )
}
