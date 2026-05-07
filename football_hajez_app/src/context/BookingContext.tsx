import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Booking, BookingStatus, Match, MiniPosition, TeamSide } from '../types/domain'
import {
  getBookings,
  getMatches,
  getTimers,
  setBookings,
  setMatches,
  setTimers,
} from '../utils/localStorage'
import { ROLE_QUOTAS } from '../utils/roleQuotas'

type BookingInput = {
  matchId: string
  venueId: string
  team: TeamSide
  position: MiniPosition
  playerName: string
  phone: string
  amount: number
}

type BookingContextValue = {
  matches: Match[]
  bookings: Booking[]
  getMatchById: (id?: string) => Match | undefined
  getBookingById: (id?: string) => Booking | undefined
  createHostMatch: (input: { venueId: string; startMs: number; price?: number }) => string
  createPendingBooking: (input: BookingInput) => string
  confirmBookingDemo: (bookingId: string) => void
  expireBooking: (bookingId: string) => void
  cancelConfirmedBooking: (bookingId: string) => void
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [matchesState, setMatchesState] = useState<Match[]>(() => getMatches())
  const [bookingsState, setBookingsState] = useState<Booking[]>(() => getBookings())

  const writeAll = (nextMatches: Match[], nextBookings: Booking[], status?: BookingStatus, bookingId?: string) => {
    setMatches(nextMatches)
    setBookings(nextBookings)
    setMatchesState(nextMatches)
    setBookingsState(nextBookings)
    if (!bookingId) return
    const timers = getTimers()
    if (status === 'pending') {
      const b = nextBookings.find((item) => item.id === bookingId)
      if (b) timers[bookingId] = new Date(b.expiresAt).getTime()
    } else {
      delete timers[bookingId]
    }
    setTimers(timers)
  }

  const value = useMemo<BookingContextValue>(
    () => ({
      matches: matchesState,
      bookings: bookingsState,
      getMatchById: (id) => matchesState.find((m) => m.id === id),
      getBookingById: (id) => bookingsState.find((b) => b.id === id),
      createHostMatch: ({ venueId, startMs, price = 300000 }) => {
        const endMs = startMs + 90 * 60 * 1000
        const overlap = matchesState.some((m) => {
          if (m.venueId !== venueId) return false
          const [y, mo, d] = m.date.split('-').map(Number)
          const [h, mi] = m.time.split(':').map(Number)
          const matchStart = new Date(y, mo - 1, d, h, mi).getTime()
          const matchEnd = matchStart + 90 * 60 * 1000
          return startMs < matchEnd && matchStart < endMs
        })
        if (overlap) throw new Error('This venue already has a match in that time window.')

        const value = new Date(startMs)
        const date = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
          value.getDate(),
        ).padStart(2, '0')}`
        const time = `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`

        const newMatch: Match = {
          id: `host-${Date.now()}`,
          venueId,
          date,
          time,
          type: '5-a-side',
          price,
          spots: {
            team1: { total: 5, booked: [] },
            team2: { total: 5, booked: [] },
          },
        }
        const nextMatches = [newMatch, ...matchesState]
        writeAll(nextMatches, bookingsState)
        return newMatch.id
      },
      createPendingBooking: (input) => {
        const currentMatch = matchesState.find((m) => m.id === input.matchId)
        if (!currentMatch) throw new Error('Match not found')
        const teamSpot = currentMatch.spots[input.team]
        const teamIsFull = teamSpot.booked.length >= teamSpot.total
        if (teamIsFull) throw new Error('Selected team is already full.')

        const roleBookedCount = teamSpot.booked.filter((player) => player.position === input.position).length
        if (roleBookedCount >= ROLE_QUOTAS[input.position]) {
          throw new Error(`No ${input.position} slots left on this team.`)
        }

        const now = new Date()
        const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString()
        const id = `BK-${Date.now()}`
        const booking: Booking = {
          id,
          ...input,
          status: 'pending',
          bookedAt: now.toISOString(),
          expiresAt,
        }
        const nextBookings = [booking, ...bookingsState]
        const nextMatches = matchesState.map((match) => {
          if (match.id !== input.matchId) return match
          const spot = match.spots[input.team]
          return {
            ...match,
            spots: {
              ...match.spots,
              [input.team]: {
                ...spot,
                booked: [
                  ...spot.booked,
                  {
                    bookingId: id,
                    playerName: input.playerName,
                    phone: input.phone,
                    status: 'pending' as const,
                    position: input.position,
                  },
                ],
              },
            },
          }
        })
        writeAll(nextMatches, nextBookings, 'pending', id)
        return id
      },
      confirmBookingDemo: (bookingId) => {
        const nextBookings = bookingsState.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'confirmed' as const } : booking,
        )
        const nextMatches = matchesState.map((match) => ({
          ...match,
          spots: Object.fromEntries(
            Object.entries(match.spots).map(([key, spot]) => [
              key,
              {
                ...spot,
                booked: spot.booked.map((p) =>
                  p.bookingId === bookingId ? { ...p, status: 'confirmed' as const } : p,
                ),
              },
            ]),
          ),
        }))
        writeAll(nextMatches, nextBookings, 'confirmed', bookingId)
      },
      expireBooking: (bookingId) => {
        const booking = bookingsState.find((b) => b.id === bookingId)
        if (!booking || booking.status === 'expired') return
        const nextBookings = bookingsState.map((item) =>
          item.id === bookingId ? { ...item, status: 'expired' as const } : item,
        )
        const nextMatches = matchesState.map((match) => {
          if (match.id !== booking.matchId) return match
          const teamKey: TeamSide =
            booking.team ?? (booking.position === 'team1' || booking.position === 'team2' ? booking.position : 'team1')
          const spot = match.spots[teamKey]
          return {
            ...match,
            spots: {
              ...match.spots,
              [teamKey]: {
                ...spot,
                booked: spot.booked.filter((player) => player.bookingId !== bookingId),
              },
            },
          }
        })
        writeAll(nextMatches, nextBookings, 'expired', bookingId)
      },
      cancelConfirmedBooking: (bookingId) => {
        const booking = bookingsState.find((b) => b.id === bookingId)
        if (!booking || booking.status !== 'confirmed') return

        const nextBookings = bookingsState.filter((b) => b.id !== bookingId)
        const nextMatches = matchesState.map((match) => {
          if (match.id !== booking.matchId) return match
          const teamKey: TeamSide =
            booking.team ?? (booking.position === 'team1' || booking.position === 'team2' ? booking.position : 'team1')
          const spot = match.spots[teamKey]
          return {
            ...match,
            spots: {
              ...match.spots,
              [teamKey]: {
                ...spot,
                booked: spot.booked.filter((player) => player.bookingId !== bookingId),
              },
            },
          }
        })
        writeAll(nextMatches, nextBookings, 'expired', bookingId)
      },
    }),
    [bookingsState, matchesState],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (!context) throw new Error('useBooking must be used inside BookingProvider')
  return context
}
