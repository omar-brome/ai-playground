import { describe, expect, it } from 'vitest'
import type { Booking, Match } from '../types/domain'
import { checkBookingConflict } from './conflictCheck'

const baseMatch = (id: string, date: string, time: string): Match => ({
  id,
  venueId: '4b',
  date,
  time,
  type: '5-a-side',
  price: 300000,
  spots: {
    team1: { total: 5, booked: [] },
    team2: { total: 5, booked: [] },
  },
})

const booking = (overrides: Partial<Booking>): Booking => ({
  id: 'b1',
  matchId: 'm-a',
  venueId: '4b',
  team: 'team1',
  position: 'attacker',
  playerName: 'A',
  phone: '+96170000001',
  status: 'confirmed',
  amount: 300000,
  bookedAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(),
  ...overrides,
})

describe('checkBookingConflict', () => {
  it('rejects same phone already on the same match', () => {
    const target = baseMatch('m-a', '2026-06-01', '18:00')
    const bookings: Booking[] = [booking({ matchId: 'm-a', phone: '+96170000001', status: 'confirmed' })]
    const matches = [target]
    const r = checkBookingConflict('+96170000001', target, bookings, matches)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('already booked this match')
  })

  it('rejects when another active booking is within 2 hours', () => {
    const target = baseMatch('m-b', '2026-06-01', '19:00')
    const other = baseMatch('m-a', '2026-06-01', '18:00')
    const bookings: Booking[] = [booking({ matchId: 'm-a', phone: '+96170000001', status: 'pending' })]
    const matches = [target, other]
    const r = checkBookingConflict('+96170000001', target, bookings, matches)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('already have a match')
  })

  it('ignores expired bookings for overlap', () => {
    const target = baseMatch('m-b', '2026-06-01', '19:00')
    const other = baseMatch('m-a', '2026-06-01', '18:00')
    const bookings: Booking[] = [booking({ matchId: 'm-a', phone: '+96170000001', status: 'expired' })]
    const matches = [target, other]
    const r = checkBookingConflict('+96170000001', target, bookings, matches)
    expect(r.ok).toBe(true)
  })

  it('allows when no conflicting booking', () => {
    const target = baseMatch('m-b', '2026-06-01', '18:00')
    const r = checkBookingConflict('+96170000001', target, [], [target])
    expect(r.ok).toBe(true)
  })
})
