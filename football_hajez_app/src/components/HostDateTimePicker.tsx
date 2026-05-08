import { useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO } from 'date-fns'

import 'react-day-picker/style.css'

type Props = {
  date: string
  time: string
  onChange: (next: { date: string; time: string }) => void
  className?: string
  /** Label above time chips (i18n). */
  timeLabel?: string
}

function beirutYmd(d: Date): string {
  return formatInTimeZone(d, 'Asia/Beirut', 'yyyy-MM-dd')
}

function buildHalfHourSlots(): string[] {
  const out: string[] = []
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return out
}

const SLOTS = buildHalfHourSlots()

export function HostDateTimePicker({ date, time, onChange, className, timeLabel = 'Start time (Beirut, :00 / :30)' }: Props) {
  const selected = useMemo(() => {
    if (!date) return undefined
    try {
      return parseISO(`${date}T12:00:00`)
    } catch {
      return undefined
    }
  }, [date])

  const todayBeirut = beirutYmd(new Date())

  return (
    <div className={className ?? ''}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="mx-auto w-full max-w-[320px] shrink-0 rounded-xl border border-white/15 bg-bg-navy p-2 md:mx-0 [&_.rdp-root]:mx-auto [&_.rdp-root]:text-sm [&_.rdp-day_button]:text-white [&_.rdp-weekday]:text-white/60 [&_.rdp-caption_label]:text-white [&_.rdp-nav]:text-white">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (!d) {
                onChange({ date: '', time })
                return
              }
              onChange({ date: beirutYmd(d), time })
            }}
            disabled={(d) => beirutYmd(d) < todayBeirut}
            weekStartsOn={1}
          />
        </div>
        <div className="w-full min-w-[min(100%,11.5rem)] flex-1 md:min-w-[12.5rem]">
          <p className="mb-2 text-xs font-bold text-white/70">{timeLabel}</p>
          <div className="max-h-52 overflow-y-auto rounded-xl border border-white/15 bg-bg-navy/80 p-2">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {SLOTS.map((slot) => {
                const active = time === slot
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onChange({ date, time: slot })}
                    className={`rounded-lg border px-1.5 py-1.5 text-center text-xs font-bold tabular-nums whitespace-nowrap ${
                      active ? 'border-accent-green bg-accent-green/25 text-accent-green' : 'border-white/20 text-white/85'
                    }`}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
