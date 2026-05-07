import type { Booking, Match } from '../types/domain'
import { getMatchDateValue } from './format'

type ConflictResult =
  | { ok: true }
  | { ok: false; reason: string }

export function checkBookingConflict(
  phone: string,
  targetMatch: Match,
  bookings: Booking[],
  matches: Match[],
) {
  const activeBookings = bookings.filter((b) => b.phone === phone && b.status !== 'expired')
  const alreadyOnSameMatch = activeBookings.some((b) => b.matchId === targetMatch.id)
  if (alreadyOnSameMatch) {
    return { ok: false, reason: 'This phone number already booked this match.' } satisfies ConflictResult
  }

  const targetTime = getMatchDateValue(targetMatch.date, targetMatch.time)
  for (const booking of activeBookings) {
    const bookedMatch = matches.find((m) => m.id === booking.matchId)
    if (!bookedMatch) continue
    const bookingTime = getMatchDateValue(bookedMatch.date, bookedMatch.time)
    if (Math.abs(targetTime - bookingTime) <= 2 * 60 * 60 * 1000) {
      return {
        ok: false,
        reason: `⚠️ You already have a match booked at ${bookedMatch.time} on ${bookedMatch.date}. You cannot book two matches at the same time.`,
      } satisfies ConflictResult
    }
  }
  return { ok: true } satisfies ConflictResult
}
