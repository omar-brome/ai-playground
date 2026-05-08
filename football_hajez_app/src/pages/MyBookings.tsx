import { Link } from 'react-router-dom'
import { useLayoutEffect, useState } from 'react'
import { StatusBadge } from '../components/StatusBadge'
import { useBooking } from '../context/BookingContext'
import { useLocale } from '../context/LocaleContext'
import { venues } from '../data/mockData'
import { formatDateTime } from '../utils/format'
import type { Booking } from '../types/domain'
import { cancellationTierFromKickoffMs } from '../constants/paymentPolicy'
import { toast } from '../utils/toast'
import { track } from '../analytics/track'

function matchKickoffMs(m: { startsAtUtc?: string; date: string; time: string }): number {
  if (m.startsAtUtc) return new Date(m.startsAtUtc).getTime()
  const [y, mo, d] = m.date.split('-').map(Number)
  const [h, mi] = m.time.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi).getTime()
}

function fakeQr(reference: string) {
  const seed = [...reference].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  return Array.from({ length: 49 }, (_, i) => ((i * 17 + seed) % 5 === 0 ? 'bg-white' : 'bg-white/10'))
}

export default function MyBookings() {
  const { t } = useLocale()
  const { bookings, getMatchById, cancelConfirmedBooking } = useBooking()
  const [nowMs, setNowMs] = useState(0)
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock seed + minute ticker
    setNowMs(Date.now())
    const id = window.setInterval(() => setNowMs(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="text-2xl font-black">{t('bookings.title')}</h1>
      {bookings.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-5 text-center">
          <p className="text-base font-bold">{t('bookings.emptyTitle')}</p>
          <p className="mt-1 text-sm text-white/70">{t('bookings.emptyHint')}</p>
          <Link
            to="/"
            className="mt-3 inline-block rounded-xl bg-accent-green px-3 py-2 text-sm font-bold text-black"
          >
            {t('bookings.browse')}
          </Link>
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        {bookings.map((booking) => {
          const match = getMatchById(booking.matchId)
          const venue = venues.find((v) => v.id === booking.venueId)
          if (!match) return null
          return (
            <div key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{venue?.name}</p>
                  <p className="text-sm text-white/75">{formatDateTime(match.date, match.time)}</p>
                </div>
                <StatusBadge
                  status={booking.status}
                  label={booking.status === 'awaiting_host_approval' ? t('bookings.statusAwaiting') : undefined}
                />
              </div>
              <p className="mt-2 text-sm">Position: {booking.position}</p>
              <p className="mt-1 text-xs text-white/70">
                Team: {booking.team === 'team1' ? 'Team 1' : 'Opposite Team'}
              </p>
              {booking.status === 'pending' ? (
                <div className="mt-3">
                  <p className="text-xs text-yellow-300">
                    {t('bookings.remaining')}:{' '}
                    {nowMs === 0
                      ? '—'
                      : Math.max(
                          0,
                          Math.floor((new Date(booking.expiresAt).getTime() - nowMs) / 60000),
                        )}{' '}
                    {t('bookings.min')}
                  </p>
                  <Link
                    to={`/payment/${booking.id}`}
                    className="mt-2 inline-block rounded-xl bg-accent-green px-3 py-2 text-sm font-bold text-black"
                  >
                    {t('bookings.completePay')}
                  </Link>
                </div>
              ) : null}
              {booking.status === 'awaiting_host_approval' ? (
                <div className="mt-3">
                  <p className="text-xs text-white/70">{t('bookings.awaitingNote')}</p>
                  <Link
                    to={`/payment/${booking.id}`}
                    className="mt-2 inline-block rounded-xl border border-white/25 px-3 py-2 text-sm font-bold"
                  >
                    {t('payment.title')}
                  </Link>
                </div>
              ) : null}
              {booking.status === 'confirmed' ? (
                <div className="mt-3">
                  <p className="mb-2 text-xs text-white/65">Reference #{booking.id}</p>
                  <div className="grid w-24 grid-cols-7 gap-0.5 rounded bg-white/5 p-1">
                    {fakeQr(booking.id).map((cls, idx) => (
                      <span key={`${booking.id}-${idx}`} className={`h-2.5 w-2.5 ${cls}`} />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300"
                    onClick={() => setCancelTarget(booking)}
                  >
                    {t('bookings.cancelBtn')}
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      {cancelTarget ? (
        <div className="fixed inset-0 z-30 bg-black/70 px-4">
          <div className="mx-auto mt-28 max-w-md rounded-2xl border border-white/15 bg-bg-navy p-5">
            <p className="text-lg font-black text-red-300">{t('bookings.cancelTitle')}</p>
            <p className="mt-3 text-sm text-white/80">{t('bookings.cancelWarn1')}</p>
            <p className="mt-2 text-sm text-white/80">{t('bookings.cancelWarn2')}</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/25 px-3 py-2 text-sm font-bold"
                onClick={() => setCancelTarget(null)}
              >
                {t('bookings.keep')}
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white"
                onClick={() => {
                  void (async () => {
                    try {
                      const m = getMatchById(cancelTarget.matchId)
                      await cancelConfirmedBooking(cancelTarget.id)
                      track('booking_cancel', { bookingId: cancelTarget.id })
                      let msg = t('bookings.toastCancelled')
                      if (m) {
                        const tier = cancellationTierFromKickoffMs(matchKickoffMs(m))
                        if (tier === '48h_plus') msg = t('bookings.cancelTier48')
                        else if (tier === '12h_to_48h') msg = t('bookings.cancelTier12')
                        else msg = t('bookings.cancelTierUnder')
                      }
                      toast.success(msg)
                      setCancelTarget(null)
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : t('bookings.cancelFail'))
                    }
                  })()
                }}
              >
                {t('bookings.confirmCancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
