// When `VITE_USE_SUPABASE=true`, matches/bookings are authoritative on the server; these keys are
// only used for the local demo and for non-authoritative prefs (role, host reservations, timers).
import { initialMatches } from '../data/mockData'
import type {
  AppRole,
  Booking,
  HostReservation,
  Match,
  MatchWaitlistEntry,
  MiniPosition,
  TeamSide,
} from '../types/domain'

export const LS_KEYS = {
  matches: 'malaab_matches',
  bookings: 'malaab_bookings',
  timers: 'malaab_timers',
  role: 'malaab_app_role',
  hostReservations: 'malaab_host_reservations',
  waitlist: 'malaab_waitlist',
  waitlistDevice: 'malaab_waitlist_device',
} as const

export type LocalWaitlistEntry = {
  id: string
  matchId: string
  team: TeamSide
  position: MiniPosition
  joinedAt: string
  deviceId: string
}

type TimerMap = Record<string, number>

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getMatches(): Match[] {
  const existing = readJson<Match[] | null>(LS_KEYS.matches, null)
  if (existing) {
    const isMiniFootballShape = existing.every((match) => match.spots.team1 && match.spots.team2)
    if (isMiniFootballShape) return existing
  }
  const seeded = structuredClone(initialMatches)
  writeJson(LS_KEYS.matches, seeded)
  return seeded
}

export function setMatches(matches: Match[]) {
  writeJson(LS_KEYS.matches, matches)
}

export function getBookings() {
  return readJson<Booking[]>(LS_KEYS.bookings, [])
}

export function setBookings(bookings: Booking[]) {
  writeJson(LS_KEYS.bookings, bookings)
}

export function getTimers() {
  return readJson<TimerMap>(LS_KEYS.timers, {})
}

export function setTimers(timers: TimerMap) {
  writeJson(LS_KEYS.timers, timers)
}

export function getRole() {
  return readJson<AppRole | null>(LS_KEYS.role, null)
}

export function setRole(role: AppRole) {
  writeJson(LS_KEYS.role, role)
}

export function getHostReservations() {
  return readJson<HostReservation[]>(LS_KEYS.hostReservations, [])
}

export function setHostReservations(items: HostReservation[]) {
  writeJson(LS_KEYS.hostReservations, items)
}

export function getWaitlistDeviceId(): string {
  let id = readJson<string | null>(LS_KEYS.waitlistDevice, null)
  if (!id) {
    id = crypto.randomUUID()
    writeJson(LS_KEYS.waitlistDevice, id)
  }
  return id
}

export function getLocalWaitlist(): LocalWaitlistEntry[] {
  return readJson<LocalWaitlistEntry[]>(LS_KEYS.waitlist, [])
}

export function setLocalWaitlist(entries: LocalWaitlistEntry[]) {
  writeJson(LS_KEYS.waitlist, entries)
}

/** Queue positions for the current device on one match. */
export function computeLocalWaitlistForMatch(
  entries: LocalWaitlistEntry[],
  matchId: string,
  deviceId: string,
): MatchWaitlistEntry[] {
  const mine = entries.filter((e) => e.matchId === matchId && e.deviceId === deviceId)
  return mine.map((m) => {
    const sameSpot = entries
      .filter((e) => e.matchId === matchId && e.team === m.team && e.position === m.position)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))
    const queuePosition = sameSpot.findIndex((e) => e.id === m.id) + 1
    return { team: m.team, position: m.position, queuePosition }
  })
}
