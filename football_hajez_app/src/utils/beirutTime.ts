import { fromZonedTime } from 'date-fns-tz'

/** Wall clock in Asia/Beirut for display (DB stores timestamptz UTC). */
export function beirutDateTimeParts(isoUtc: string): { date: string; time: string } {
  const d = new Date(isoUtc)
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Beirut',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Beirut',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return { date, time }
}

/** Interpret `dateStr` + `timeStr` as Asia/Beirut wall clock and return the instant in UTC (ISO). */
export function beirutWallToUtcIso(dateStr: string, timeStr: string): string {
  const t = timeStr.trim()
  const clock = t.length === 5 ? `${t}:00` : t
  const wall = `${dateStr}T${clock}`
  return fromZonedTime(wall, 'Asia/Beirut').toISOString()
}
