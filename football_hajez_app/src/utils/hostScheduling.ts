import type { HostReservation, Match } from '../types/domain'

/** Default hosted / listed match block length (matches Home + local host create). */
export const HOST_MATCH_DURATION_MS = 90 * 60 * 1000

/** Beirut wall-clock start must land on :00 or :30 (same rule as Home host panel). */
export function isHalfHourWallTime(timeHHMM: string): boolean {
  const parts = timeHHMM.trim().split(':')
  if (parts.length < 2) return false
  const minutePart = Number(parts[1] ?? 0)
  if (Number.isNaN(minutePart)) return false
  return minutePart === 0 || minutePart === 30
}

/** Half-open style overlap: `[startA,endA)` vs `[startB,endB)` using strict `<` (mirrors Home). */
export function intervalsOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA
}

export type VenueTimeWindow = {
  venueId: string
  startMs: number
  endMs: number
}

export function matchStartMs(match: Match): number {
  if (match.startsAtUtc) return new Date(match.startsAtUtc).getTime()
  const [y, mo, d] = match.date.split('-').map(Number)
  const [h, mi] = match.time.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi).getTime()
}

export function matchToVenueWindow(match: Match, durationMs = HOST_MATCH_DURATION_MS): VenueTimeWindow {
  const startMs = matchStartMs(match)
  return { venueId: match.venueId, startMs, endMs: startMs + durationMs }
}

export function matchesToVenueWindows(matches: Match[], durationMs = HOST_MATCH_DURATION_MS): VenueTimeWindow[] {
  return matches.map((m) => matchToVenueWindow(m, durationMs))
}

export function hostSlotConflictsWithWindows(
  venueId: string,
  startMs: number,
  endMs: number,
  windows: VenueTimeWindow[],
): boolean {
  return windows.some(
    (w) => w.venueId === venueId && intervalsOverlap(startMs, endMs, w.startMs, w.endMs),
  )
}

export function hostReservationConflicts(
  venueId: string,
  startMs: number,
  endMs: number,
  reservations: Pick<HostReservation, 'venueId' | 'startAt' | 'endAt'>[],
): boolean {
  return reservations.some((item) => {
    if (item.venueId !== venueId) return false
    const existingStart = new Date(item.startAt).getTime()
    const existingEnd = new Date(item.endAt).getTime()
    return intervalsOverlap(startMs, endMs, existingStart, existingEnd)
  })
}
