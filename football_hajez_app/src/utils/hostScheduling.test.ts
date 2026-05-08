import { describe, expect, it } from 'vitest'
import type { Match } from '../types/domain'
import {
  HOST_MATCH_DURATION_MS,
  hostReservationConflicts,
  hostSlotConflictsWithWindows,
  intervalsOverlap,
  isHalfHourWallTime,
  matchToVenueWindow,
  matchesToVenueWindows,
} from './hostScheduling'

describe('isHalfHourWallTime', () => {
  it('accepts :00 and :30', () => {
    expect(isHalfHourWallTime('18:00')).toBe(true)
    expect(isHalfHourWallTime('18:30')).toBe(true)
  })
  it('rejects other minute marks', () => {
    expect(isHalfHourWallTime('18:15')).toBe(false)
    expect(isHalfHourWallTime('18:45')).toBe(false)
  })
})

describe('intervalsOverlap', () => {
  it('detects partial overlap', () => {
    expect(intervalsOverlap(0, 100, 50, 150)).toBe(true)
  })
  it('returns false for adjacent non-overlapping', () => {
    expect(intervalsOverlap(0, 100, 100, 200)).toBe(false)
  })
})

describe('hostSlotConflictsWithWindows', () => {
  const mUtc = (id: string, venueId: string, startsAtUtc: string): Match => ({
    id,
    venueId,
    date: '2026-06-01',
    time: '18:00',
    type: '5-a-side',
    price: 1,
    startsAtUtc,
    spots: {
      team1: { total: 5, booked: [] },
      team2: { total: 5, booked: [] },
    },
  })

  it('detects overlap with existing match window', () => {
    const existing = mUtc('e', '4b', '2026-06-01T15:00:00.000Z')
    const w = matchesToVenueWindows([existing], HOST_MATCH_DURATION_MS)
    const start = new Date('2026-06-01T15:30:00.000Z').getTime()
    const end = start + HOST_MATCH_DURATION_MS
    expect(hostSlotConflictsWithWindows('4b', start, end, w)).toBe(true)
  })

  it('no conflict on different venue', () => {
    const existing = mUtc('e', '4b', '2026-06-01T15:00:00.000Z')
    const w = matchesToVenueWindows([existing], HOST_MATCH_DURATION_MS)
    const start = new Date('2026-06-01T15:30:00.000Z').getTime()
    const end = start + HOST_MATCH_DURATION_MS
    expect(hostSlotConflictsWithWindows('ace', start, end, w)).toBe(false)
  })
})

describe('hostReservationConflicts', () => {
  it('detects overlapping host reservation', () => {
    const startMs = 1_000_000
    const endMs = startMs + HOST_MATCH_DURATION_MS
    const reservations = [
      { venueId: '4b', startAt: new Date(startMs + 30 * 60 * 1000).toISOString(), endAt: new Date(endMs + 30 * 60 * 1000).toISOString() },
    ]
    expect(hostReservationConflicts('4b', startMs, endMs, reservations)).toBe(true)
  })
})

describe('matchToVenueWindow', () => {
  it('uses startsAtUtc when present', () => {
    const iso = '2026-06-01T15:00:00.000Z'
    const match: Match = {
      id: 'x',
      venueId: '4b',
      date: '2026-06-01',
      time: '00:00',
      type: '5-a-side',
      price: 1,
      startsAtUtc: iso,
      spots: { team1: { total: 5, booked: [] }, team2: { total: 5, booked: [] } },
    }
    const w = matchToVenueWindow(match, HOST_MATCH_DURATION_MS)
    expect(w.startMs).toBe(new Date(iso).getTime())
    expect(w.endMs - w.startMs).toBe(HOST_MATCH_DURATION_MS)
  })
})
