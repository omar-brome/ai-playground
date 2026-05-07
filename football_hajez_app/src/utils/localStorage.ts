import { initialMatches } from '../data/mockData'
import type { AppRole, Booking, HostReservation, Match } from '../types/domain'

export const LS_KEYS = {
  matches: 'malaab_matches',
  bookings: 'malaab_bookings',
  timers: 'malaab_timers',
  role: 'malaab_app_role',
  hostReservations: 'malaab_host_reservations',
} as const

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
  localStorage.setItem(LS_KEYS.role, role)
}

export function getHostReservations() {
  return readJson<HostReservation[]>(LS_KEYS.hostReservations, [])
}

export function setHostReservations(items: HostReservation[]) {
  writeJson(LS_KEYS.hostReservations, items)
}
