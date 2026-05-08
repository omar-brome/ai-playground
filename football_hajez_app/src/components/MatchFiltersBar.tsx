import type { DayFilterChip, MatchListFilters } from '../utils/matchFilters'
import { useLocale } from '../context/LocaleContext'

type Props = {
  filters: MatchListFilters
  onChange: (patch: Partial<MatchListFilters>) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function MatchFiltersBar({ filters, onChange }: Props) {
  const { t } = useLocale()

  const chip = (day: DayFilterChip, label: string) => {
    const active = filters.day === day
    return (
      <button
        key={day}
        type="button"
        onClick={() => onChange({ day })}
        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
          active ? 'bg-accent-green text-black' : 'border border-white/20 bg-white/5 text-white/80'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="mb-2 text-xs font-bold text-white/70">{t('home.filters.title')}</p>
      <div className="flex flex-wrap gap-2">
        {chip('all', t('home.filters.dayAll'))}
        {chip('today', t('home.filters.dayToday'))}
        {chip('tomorrow', t('home.filters.dayTomorrow'))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-[10px] text-white/60">
          {t('home.filters.priceMin')}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="—"
            value={filters.priceMin === '' ? '' : filters.priceMin}
            onChange={(e) => {
              const v = e.target.value
              onChange({ priceMin: v === '' ? '' : Number(v) || 0 })
            }}
            className="mt-0.5 w-full rounded-lg border border-white/20 bg-bg-navy px-2 py-1.5 text-xs"
          />
        </label>
        <label className="text-[10px] text-white/60">
          {t('home.filters.priceMax')}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="—"
            value={filters.priceMax === '' ? '' : filters.priceMax}
            onChange={(e) => {
              const v = e.target.value
              onChange({ priceMax: v === '' ? '' : Number(v) || 0 })
            }}
            className="mt-0.5 w-full rounded-lg border border-white/20 bg-bg-navy px-2 py-1.5 text-xs"
          />
        </label>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-[10px] text-white/60">
          {t('home.filters.hourFrom')}
          <select
            value={filters.hourStart === '' ? '' : String(filters.hourStart)}
            onChange={(e) => {
              const v = e.target.value
              onChange({ hourStart: v === '' ? '' : Number(v) })
            }}
            className="mt-0.5 w-full rounded-lg border border-white/20 bg-bg-navy px-2 py-1.5 text-xs"
          >
            <option value="">{t('home.filters.any')}</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-white/60">
          {t('home.filters.hourTo')}
          <select
            value={filters.hourEnd === '' ? '' : String(filters.hourEnd)}
            onChange={(e) => {
              const v = e.target.value
              onChange({ hourEnd: v === '' ? '' : Number(v) })
            }}
            className="mt-0.5 w-full rounded-lg border border-white/20 bg-bg-navy px-2 py-1.5 text-xs"
          >
            <option value="">{t('home.filters.any')}</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:30
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
