import { formatInTimeZone } from 'date-fns-tz'
import type { Match } from '../types/domain'

export type DayFilterChip = 'all' | 'today' | 'tomorrow'

export type MatchListFilters = {
  day: DayFilterChip
  priceMin: number | ''
  priceMax: number | ''
  hourStart: number | ''
  hourEnd: number | ''
}

export const defaultMatchListFilters: MatchListFilters = {
  day: 'all',
  priceMin: '',
  priceMax: '',
  hourStart: '',
  hourEnd: '',
}

function matchBeirutYmd(m: Match): string {
  if (m.startsAtUtc) return formatInTimeZone(new Date(m.startsAtUtc), 'Asia/Beirut', 'yyyy-MM-dd')
  return m.date
}

function matchBeirutHourMinute(m: Match): { h: number; min: number } {
  if (m.startsAtUtc) {
    const t = formatInTimeZone(new Date(m.startsAtUtc), 'Asia/Beirut', 'HH:mm')
    const [hh, mm] = t.split(':').map(Number)
    return { h: hh ?? 0, min: mm ?? 0 }
  }
  const [hh, mm] = m.time.split(':').map(Number)
  return { h: hh ?? 0, min: mm ?? 0 }
}

function matchStartMinutesFromMidnight(m: Match): number {
  const { h, min } = matchBeirutHourMinute(m)
  return h * 60 + min
}

export function matchPassesFilters(m: Match, f: MatchListFilters): boolean {
  const ymd = matchBeirutYmd(m)
  const today = formatInTimeZone(new Date(), 'Asia/Beirut', 'yyyy-MM-dd')
  const tomorrow = formatInTimeZone(new Date(Date.now() + 86400000), 'Asia/Beirut', 'yyyy-MM-dd')

  if (f.day === 'today' && ymd !== today) return false
  if (f.day === 'tomorrow' && ymd !== tomorrow) return false

  if (f.priceMin !== '' && m.price < f.priceMin) return false
  if (f.priceMax !== '' && m.price > f.priceMax) return false

  const mins = matchStartMinutesFromMidnight(m)
  if (f.hourStart !== '' && mins < f.hourStart * 60) return false
  if (f.hourEnd !== '' && mins > f.hourEnd * 60 + 30) return false

  return true
}

export function filterMatches(matches: Match[], f: MatchListFilters): Match[] {
  return matches.filter((m) => matchPassesFilters(m, f))
}
