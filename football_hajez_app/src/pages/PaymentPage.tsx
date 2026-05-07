import { useCallback, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CountdownTimer } from '../components/CountdownTimer'
import { useBooking } from '../context/BookingContext'
import { venues } from '../data/mockData'
import BookingConfirmation from './BookingConfirmation'
import { formatDateTime, formatLbp } from '../utils/format'

export default function PaymentPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { getBookingById, getMatchById, confirmBookingDemo, expireBooking } = useBooking()
  const booking = getBookingById(bookingId)
  const [paid, setPaid] = useState(false)

  const match = useMemo(() => getMatchById(booking?.matchId), [booking?.matchId, getMatchById])
  const venue = venues.find((v) => v.id === booking?.venueId)

  const handleExpired = useCallback(() => {
    if (!booking || booking.status !== 'pending') return
    expireBooking(booking.id)
    navigate(`/match/${booking.matchId}`, { replace: true })
  }, [booking, expireBooking, navigate])

  if (!booking || !match) return <Navigate to="/" replace />
  if (booking.status === 'expired') return <Navigate to={`/match/${booking.matchId}`} replace />

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="text-2xl font-black">Whish Payment</h1>
      {paid || booking.status === 'confirmed' ? (
        <BookingConfirmation booking={booking} />
      ) : (
        <>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            <p className="font-bold">{venue?.name}</p>
            <p className="text-white/70">{formatDateTime(match.date, match.time)}</p>
            <p className="mt-1">Team: {booking.team === 'team1' ? 'Team 1' : 'Opposite Team'}</p>
            <p className="mt-1">Position: {booking.position}</p>
            <p className="mt-1">Full Name: {booking.playerName}</p>
            <p>Phone Number: {booking.phone}</p>
            <p className="mt-1 text-accent-green">{formatLbp(booking.amount)}</p>
          </div>
          <div className="mt-4 rounded-2xl border border-whish-pink/40 bg-whish-pink/10 p-4">
            <p className="text-lg font-black text-whish-pink">Whish</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-white/90">
              <li>Open your Whish Money app</li>
              <li>Send {formatLbp(booking.amount)} to 03 123 456</li>
              <li>Use reference code: {booking.id}</li>
              <li>Come back here once sent</li>
            </ol>
          </div>
          <div className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-yellow-300">Time remaining</p>
            <CountdownTimer expiresAt={booking.expiresAt} onExpired={handleExpired} />
          </div>
          <button
            type="button"
            className="mt-5 w-full rounded-xl bg-accent-green p-3 font-black text-black"
            onClick={() => {
              confirmBookingDemo(booking.id)
              setPaid(true)
            }}
          >
            ✅ Mark as Paid (Demo)
          </button>
        </>
      )}
    </div>
  )
}
