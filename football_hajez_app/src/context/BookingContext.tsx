/* eslint-disable react-refresh/only-export-components -- co-located hook + provider */
import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Booking, BookingStatus, Match, MatchWaitlistEntry, MiniPosition, TeamSide } from '../types/domain'
import { isSupabaseBackend } from '../config/env'
import { getSupabaseClient } from '../lib/supabase'
import {
  fetchMyBookings,
  fetchScheduledMatches,
  rpcCancelConfirmedBooking,
  rpcCancelMatch,
  rpcConfirmBookingDemo,
  rpcCreateHostMatch,
  rpcCreatePendingBooking,
  rpcExpireAwaitingHostBookings,
  rpcExpirePendingBooking,
  rpcGetMyWaitlistEntries,
  rpcHostApproveBooking,
  rpcHostRejectBooking,
  rpcJoinMatchWaitlist,
  rpcLeaveMatchWaitlist,
  rpcSubmitBookingPaymentProof,
  uploadPaymentProofToStorage,
} from '../services/malaabSupabase'
import { translate, type Locale } from '../i18n/strings'
import { toast } from '../utils/toast'
import {
  computeLocalWaitlistForMatch,
  getBookings,
  getLocalWaitlist,
  getMatches,
  getTimers,
  getWaitlistDeviceId,
  setBookings,
  setLocalWaitlist,
  setMatches,
  setTimers,
} from '../utils/localStorage'

function storedLocale(): Locale {
  try {
    const raw = localStorage.getItem('malaab_locale')
    if (raw === 'ar') return 'ar'
  } catch {
    /* ignore */
  }
  return 'en'
}

import { HOST_MATCH_DURATION_MS, hostSlotConflictsWithWindows, matchesToVenueWindows } from '../utils/hostScheduling'
import { ROLE_QUOTAS } from '../utils/roleQuotas'
import { toPhoneE164 } from '../utils/phoneE164'
import { beirutDateTimeParts } from '../utils/beirutTime'
import { useAuth } from './AuthContext'

function isActiveBookingStatus(s: BookingStatus): boolean {
  return s === 'pending' || s === 'awaiting_host_approval' || s === 'confirmed'
}

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
  matchesLoading: boolean
  /** Reload matches/bookings from backend or localStorage. */
  refreshBookings: () => Promise<void>
  getMatchById: (id?: string) => Match | undefined
  getBookingById: (id?: string) => Booking | undefined
  createHostMatch: (input: {
    venueId: string
    startMs: number
    price?: number
    startsAtIso?: string
    startDate?: string
    startTime?: string
  }) => Promise<string>
  createPendingBooking: (input: BookingInput) => Promise<string>
  confirmBookingDemo: (bookingId: string) => Promise<void>
  expireBooking: (bookingId: string) => Promise<void>
  cancelConfirmedBooking: (bookingId: string) => Promise<void>
  cancelHostMatch: (matchId: string, reason?: string | null) => Promise<void>
  submitPaymentProofFromFile: (bookingId: string, file: File, policyVersion: string) => Promise<void>
  hostApprovePayment: (bookingId: string) => Promise<void>
  hostRejectPayment: (bookingId: string, reason?: string | null) => Promise<void>
  fetchMyWaitlistForMatch: (matchId: string) => Promise<MatchWaitlistEntry[]>
  joinMatchWaitlist: (input: {
    matchId: string
    team: TeamSide
    position: MiniPosition
  }) => Promise<{ queuePosition: number }>
  leaveMatchWaitlist: (input: { matchId: string; team: TeamSide; position: MiniPosition }) => Promise<void>
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined)

function useLocalBookingState() {
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
      bookings: bookingsState.filter((b) => isActiveBookingStatus(b.status)),
      matchesLoading: false,
      refreshBookings: async () => {
        setMatchesState(getMatches())
        setBookingsState(getBookings())
      },
      getMatchById: (id) => matchesState.find((m) => m.id === id),
      getBookingById: (id) => bookingsState.find((b) => b.id === id),
      createHostMatch: async ({ venueId, startMs, price = 300000 }) => {
        const endMs = startMs + HOST_MATCH_DURATION_MS
        const windows = matchesToVenueWindows(matchesState, HOST_MATCH_DURATION_MS)
        if (hostSlotConflictsWithWindows(venueId, startMs, endMs, windows)) {
          throw new Error('This venue already has a match in that time window.')
        }

        const iso = new Date(startMs).toISOString()
        const { date, time } = beirutDateTimeParts(iso)

        const newMatch: Match = {
          id: `host-${Date.now()}`,
          venueId,
          date,
          time,
          type: '5-a-side',
          price,
          startsAtUtc: iso,
          endsAtUtc: new Date(startMs + HOST_MATCH_DURATION_MS).toISOString(),
          sessionStatus: 'open',
          spots: {
            team1: { total: 5, booked: [] },
            team2: { total: 5, booked: [] },
          },
        }
        const nextMatches = [newMatch, ...matchesState]
        writeAll(nextMatches, bookingsState)
        return newMatch.id
      },
      createPendingBooking: async (input) => {
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
      confirmBookingDemo: async (bookingId) => {
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
      expireBooking: async (bookingId) => {
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
      cancelConfirmedBooking: async (bookingId) => {
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
      submitPaymentProofFromFile: async (bookingId, file, policyVersion) => {
        const booking = bookingsState.find((b) => b.id === bookingId)
        if (!booking || booking.status !== 'pending') throw new Error('Invalid booking for proof upload.')
        const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        const nowIso = new Date().toISOString()
        const path = `local/${bookingId}/${file.name.replace(/[^a-z0-9._-]/gi, '_')}`
        const nextBookings = bookingsState.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: 'awaiting_host_approval' as const,
                paymentProofStoragePath: path,
                paymentProofUploadedAt: nowIso,
                policyVersion,
                policyConsentAt: nowIso,
                hostReviewDeadline: deadline,
              }
            : b,
        )
        const nextMatches = matchesState.map((match) => {
          if (match.id !== booking.matchId) return match
          return {
            ...match,
            spots: Object.fromEntries(
              Object.entries(match.spots).map(([key, spot]) => [
                key,
                {
                  ...spot,
                  booked: spot.booked.map((p) =>
                    p.bookingId === bookingId ? { ...p, status: 'awaiting_host_approval' as const } : p,
                  ),
                },
              ]),
            ),
          }
        })
        const timers = getTimers()
        delete timers[bookingId]
        setTimers(timers)
        writeAll(nextMatches, nextBookings, undefined, undefined)
      },
      hostApprovePayment: async (bookingId) => {
        const booking = bookingsState.find((b) => b.id === bookingId)
        if (!booking || booking.status !== 'awaiting_host_approval') return
        const nowIso = new Date().toISOString()
        const nextBookings = bookingsState.map((b) =>
          b.id === bookingId
            ? { ...b, status: 'confirmed' as const, hostDecisionAt: nowIso }
            : b,
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
      hostRejectPayment: async (bookingId, reason) => {
        const booking = bookingsState.find((b) => b.id === bookingId)
        if (!booking || booking.status !== 'awaiting_host_approval') return
        const timers = getTimers()
        delete timers[bookingId]
        setTimers(timers)
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
        writeAll(nextMatches, nextBookings, undefined, undefined)
        void reason
      },
      cancelHostMatch: async (matchId) => {
        const related = bookingsState.filter((b) => b.matchId === matchId)
        const timers = getTimers()
        for (const b of related) delete timers[b.id]
        setTimers(timers)
        const nextMatches = matchesState.filter((m) => m.id !== matchId)
        const nextBookings = bookingsState.filter((b) => b.matchId !== matchId)
        setMatches(nextMatches)
        setBookings(nextBookings)
        setMatchesState(nextMatches)
        setBookingsState(nextBookings)
        const wl = getLocalWaitlist().filter((e) => e.matchId !== matchId)
        setLocalWaitlist(wl)
      },
      fetchMyWaitlistForMatch: async (matchId) => {
        const deviceId = getWaitlistDeviceId()
        return computeLocalWaitlistForMatch(getLocalWaitlist(), matchId, deviceId)
      },
      joinMatchWaitlist: async ({ matchId, team, position }) => {
        const currentMatch = matchesState.find((m) => m.id === matchId)
        if (!currentMatch) throw new Error('Match not found')
        const booked = currentMatch.spots[team].booked.filter((p) => p.position === position).length
        if (booked < ROLE_QUOTAS[position]) throw new Error('Role is not full yet — you can book this spot.')
        const entries = getLocalWaitlist()
        const deviceId = getWaitlistDeviceId()
        const exists = entries.some(
          (e) => e.matchId === matchId && e.deviceId === deviceId && e.team === team && e.position === position,
        )
        if (exists) {
          const rows = computeLocalWaitlistForMatch(entries, matchId, deviceId)
          const row = rows.find((r) => r.team === team && r.position === position)
          return { queuePosition: row?.queuePosition ?? 1 }
        }
        const next = [
          ...entries,
          {
            id: crypto.randomUUID(),
            matchId,
            team,
            position,
            joinedAt: new Date().toISOString(),
            deviceId,
          },
        ]
        setLocalWaitlist(next)
        const rows = computeLocalWaitlistForMatch(next, matchId, deviceId)
        const row = rows.find((r) => r.team === team && r.position === position)
        return { queuePosition: row?.queuePosition ?? 1 }
      },
      leaveMatchWaitlist: async ({ matchId, team, position }) => {
        const deviceId = getWaitlistDeviceId()
        const next = getLocalWaitlist().filter(
          (e) => !(e.matchId === matchId && e.team === team && e.position === position && e.deviceId === deviceId),
        )
        setLocalWaitlist(next)
      },
    }),
    [bookingsState, matchesState],
  )

  return value
}

function useSupabaseBookingState(): BookingContextValue {
  const { user } = useAuth()
  const [matchesState, setMatchesState] = useState<Match[]>([])
  const [bookingsState, setBookingsState] = useState<Booking[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)
  const loadErrorToastAt = useRef(0)

  const load = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setMatchesLoading(false)
      return
    }
    setMatchesLoading(true)
    try {
      try {
        await rpcExpireAwaitingHostBookings(supabase)
      } catch {
        /* migration not applied yet */
      }
      const nextMatches = await fetchScheduledMatches(supabase)
      setMatchesState(nextMatches)
      if (user) {
        const mine = await fetchMyBookings(supabase)
        setBookingsState(mine)
      } else {
        setBookingsState([])
      }
    } catch {
      const now = Date.now()
      if (now - loadErrorToastAt.current > 25_000) {
        loadErrorToastAt.current = now
        toast.error(translate(storedLocale(), 'data.loadFail'))
      }
    } finally {
      setMatchesLoading(false)
    }
  }, [user])

  useEffect(() => {
    startTransition(() => {
      void load()
    })
  }, [load])

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    let t: ReturnType<typeof setTimeout> | undefined
    const debounced = () => {
      if (t) clearTimeout(t)
      t = setTimeout(() => void load(), 400)
    }
    const channel = supabase
      .channel('malaab-booking-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, debounced)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, debounced)
      .subscribe()
    return () => {
      if (t) clearTimeout(t)
      void supabase.removeChannel(channel)
    }
  }, [load])

  return useMemo<BookingContextValue>(
    () => ({
      matches: matchesState,
      bookings: bookingsState.filter((b) => isActiveBookingStatus(b.status)),
      matchesLoading,
      refreshBookings: load,
      getMatchById: (id) => matchesState.find((m) => m.id === id),
      getBookingById: (id) => bookingsState.find((b) => b.id === id),
      createHostMatch: async ({ venueId, startMs, price = 300000, startsAtIso, startDate, startTime }) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        if (!user) throw new Error('Sign in to host a match.')
        const id = await rpcCreateHostMatch(supabase, {
          venueId,
          startsAtIso: startsAtIso ?? new Date(startMs).toISOString(),
          startDate,
          startTime,
          priceLbp: price,
        })
        await load()
        return id
      },
      createPendingBooking: async (input) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        if (!user) throw new Error('Sign in to book a spot.')
        const { bookingId } = await rpcCreatePendingBooking(supabase, {
          matchId: input.matchId,
          team: input.team,
          position: input.position,
          playerName: input.playerName,
          phoneE164: toPhoneE164(input.phone),
          amountLbp: input.amount,
        })
        await load()
        return bookingId
      },
      confirmBookingDemo: async (bookingId) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        await rpcConfirmBookingDemo(supabase, bookingId)
        await load()
      },
      expireBooking: async (bookingId) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        await rpcExpirePendingBooking(supabase, bookingId)
        await load()
      },
      cancelConfirmedBooking: async (bookingId) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        await rpcCancelConfirmedBooking(supabase, bookingId)
        await load()
      },
      cancelHostMatch: async (matchId, reason) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        if (!user) throw new Error('Sign in to manage hosted matches.')
        await rpcCancelMatch(supabase, matchId, reason ?? null)
        await load()
      },
      submitPaymentProofFromFile: async (bookingId, file, policyVersion) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const path = await uploadPaymentProofToStorage(supabase, bookingId, file)
        await rpcSubmitBookingPaymentProof(supabase, bookingId, path, policyVersion)
        await load()
      },
      hostApprovePayment: async (bookingId) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        await rpcHostApproveBooking(supabase, bookingId)
        await load()
      },
      hostRejectPayment: async (bookingId, reason) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        await rpcHostRejectBooking(supabase, bookingId, reason ?? null)
        await load()
      },
      fetchMyWaitlistForMatch: async (matchId) => {
        const supabase = getSupabaseClient()
        if (!supabase) return []
        if (!user) return []
        try {
          return await rpcGetMyWaitlistEntries(supabase, matchId)
        } catch {
          return []
        }
      },
      joinMatchWaitlist: async (input) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        if (!user) throw new Error('Sign in to join the waitlist.')
        const { queuePosition } = await rpcJoinMatchWaitlist(supabase, input)
        return { queuePosition }
      },
      leaveMatchWaitlist: async (input) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        if (!user) throw new Error('Sign in to leave the waitlist.')
        await rpcLeaveMatchWaitlist(supabase, input)
      },
    }),
    [bookingsState, load, matchesLoading, matchesState, user],
  )
}

function LocalBookingBridge({ children }: { children: ReactNode }) {
  const value = useLocalBookingState()
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

function RemoteBookingBridge({ children }: { children: ReactNode }) {
  const value = useSupabaseBookingState()
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function BookingProvider({ children }: { children: ReactNode }) {
  if (isSupabaseBackend()) return <RemoteBookingBridge>{children}</RemoteBookingBridge>
  return <LocalBookingBridge>{children}</LocalBookingBridge>
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (!context) throw new Error('useBooking must be used inside BookingProvider')
  return context
}
