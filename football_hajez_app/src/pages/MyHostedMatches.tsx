import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SessionStatusBadge } from '../components/SessionStatusBadge'
import { SkeletonCard } from '../components/ui/Skeleton'
import { isSupabaseBackend } from '../config/env'
import { venues } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useBooking } from '../context/BookingContext'
import { useLocale } from '../context/LocaleContext'
import { useRole } from '../context/RoleContext'
import { getSupabaseClient } from '../lib/supabase'
import {
  createSignedProofUrl,
  fetchHostAwaitingPaymentBookings,
  fetchMyHostedMatches,
  type HostPendingPaymentBooking,
} from '../services/malaabSupabase'
import { getBookings, getMatches } from '../utils/localStorage'
import type { Booking, Match } from '../types/domain'
import { beirutDateTimeParts } from '../utils/beirutTime'
import { formatDateTime, formatLbp } from '../utils/format'
import { toast } from '../utils/toast'
import { track } from '../analytics/track'

function loadLocalHostAwaiting(): HostPendingPaymentBooking[] {
  const matches = getMatches()
  const bookings = getBookings()
  const hostedIds = new Set(matches.filter((m) => m.id.startsWith('host-')).map((m) => m.id))
  return bookings
    .filter((b) => b.status === 'awaiting_host_approval' && hostedIds.has(b.matchId))
    .map((b) => {
      const m = matches.find((x) => x.id === b.matchId)
      if (!m) return null
      const matchStartsAt =
        m.startsAtUtc ?? new Date(`${m.date}T${m.time.length === 5 ? `${m.time}:00` : m.time}`).toISOString()
      return { booking: b, matchStartsAt }
    })
    .filter((x): x is HostPendingPaymentBooking => Boolean(x))
}

function ProofThumb({ storagePath }: { storagePath: string | null | undefined }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!storagePath || storagePath.startsWith('local/')) {
        if (!cancelled) setUrl(null)
        return
      }
      const supabase = getSupabaseClient()
      if (!supabase) {
        if (!cancelled) setUrl(null)
        return
      }
      try {
        const u = await createSignedProofUrl(supabase, storagePath)
        if (!cancelled) setUrl(u)
      } catch {
        if (!cancelled) setUrl(null)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [storagePath])
  if (url) {
    return <img src={url} alt="" className="mt-2 max-h-36 w-full rounded-lg border border-white/15 object-contain" />
  }
  if (storagePath?.startsWith('local/')) {
    return <p className="mt-1 text-xs text-white/50">Local demo — proof path recorded</p>
  }
  return null
}

export default function MyHostedMatches() {
  const { user } = useAuth()
  const { role } = useRole()
  const { t } = useLocale()
  const { cancelHostMatch, hostApprovePayment, hostRejectPayment } = useBooking()
  const navigate = useNavigate()
  const [list, setList] = useState<Match[]>([])
  const [pendingPay, setPendingPay] = useState<HostPendingPaymentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [editMatch, setEditMatch] = useState<Match | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectBooking, setRejectBooking] = useState<Booking | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const refresh = useCallback(async () => {
    if (!user) {
      setList([])
      setPendingPay([])
      setLoading(false)
      return
    }
    if (!isSupabaseBackend()) {
      setList(getMatches().filter((m) => m.id.startsWith('host-')))
      setPendingPay(loadLocalHostAwaiting())
      setLoading(false)
      return
    }
    const supabase = getSupabaseClient()
    if (!supabase) {
      setList([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const rows = await fetchMyHostedMatches(supabase)
      setList(rows)
      try {
        setPendingPay(await fetchHostAwaitingPaymentBookings(supabase))
      } catch {
        setPendingPay([])
      }
    } catch {
      toast.error(t('data.loadFail'))
    } finally {
      setLoading(false)
    }
  }, [user, t])

  useEffect(() => {
    queueMicrotask(() => {
      void refresh()
    })
  }, [refresh])

  if (role !== 'pitch_host') {
    return (
      <div className="mx-auto max-w-md px-4 py-6 pb-24">
        <h1 className="text-2xl font-black">{t('hosted.title')}</h1>
        <p className="mt-3 text-sm text-white/75">{t('hosted.hostOnly')}</p>
        <Link to="/welcome" className="mt-4 inline-block rounded-xl bg-accent-green px-4 py-2 text-sm font-bold text-black">
          {t('nav.switch')}
        </Link>
      </div>
    )
  }

  if (!user && isSupabaseBackend()) {
    return (
      <div className="mx-auto max-w-md px-4 py-6 pb-24">
        <h1 className="text-2xl font-black">{t('hosted.title')}</h1>
        <p className="mt-3 text-sm text-white/75">{t('hosted.signIn')}</p>
        <Link to="/welcome" className="mt-4 inline-block rounded-xl border border-white/25 px-4 py-2 text-sm font-bold">
          {t('nav.switch')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="text-2xl font-black">{t('hosted.title')}</h1>
      <Link to="/" className="mt-2 inline-block text-xs font-bold text-accent-green">
        {t('hosted.create')}
      </Link>

      {!loading && pendingPay.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4">
          <p className="font-bold text-sky-200">{t('hosted.pendingPay')}</p>
          <div className="mt-3 space-y-4">
            {pendingPay.map(({ booking, matchStartsAt }) => {
              const venue = venues.find((v) => v.id === booking.venueId)
              const { date, time } = beirutDateTimeParts(matchStartsAt)
              return (
                <div key={booking.id} className="rounded-xl border border-white/10 bg-bg-navy/80 p-3">
                  <p className="text-sm font-bold">{venue?.name ?? booking.venueId}</p>
                  <p className="text-xs text-white/70">
                    {formatDateTime(date, time)} · {booking.playerName} · {formatLbp(booking.amount)}
                  </p>
                  <ProofThumb storagePath={booking.paymentProofStoragePath} />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      className="rounded-lg bg-accent-green px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                      onClick={() => {
                        void (async () => {
                          setBusyId(booking.id)
                          try {
                            await hostApprovePayment(booking.id)
                            toast.success(t('hosted.toastApproved'))
                            await refresh()
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : t('hosted.cancelFail'))
                          } finally {
                            setBusyId(null)
                          }
                        })()
                      }}
                    >
                      {t('hosted.approve')}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      className="rounded-lg border border-red-400/50 px-3 py-1.5 text-xs font-bold text-red-300 disabled:opacity-50"
                      onClick={() => setRejectBooking(booking)}
                    >
                      {t('hosted.reject')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : list.length === 0 ? (
        <p className="mt-6 text-sm text-white/70">{t('hosted.empty')}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {list.map((match) => {
            const venue = venues.find((v) => v.id === match.venueId)
            const closed = match.sessionStatus === 'cancelled' || match.sessionStatus === 'finished'
            return (
              <div key={match.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{venue?.name ?? match.venueId}</p>
                    <p className="text-sm text-white/75">{formatDateTime(match.date, match.time)}</p>
                    <p className="mt-1 text-xs text-accent-green">
                      {match.type} • {formatLbp(match.price)}
                    </p>
                  </div>
                  {match.sessionStatus ? <SessionStatusBadge status={match.sessionStatus} /> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/venue/${match.venueId}`}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-white/90"
                  >
                    {t('hosted.viewVenue')}
                  </Link>
                  {!closed ? (
                    <>
                      <button
                        type="button"
                        className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold text-white/90"
                        onClick={() => setEditMatch(match)}
                      >
                        {t('hosted.edit')}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === match.id}
                        className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 disabled:opacity-50"
                        onClick={() => {
                          void (async () => {
                            setBusyId(match.id)
                            try {
                              await cancelHostMatch(match.id, null)
                              track('host_match_cancel', { matchId: match.id })
                              toast.success(t('hosted.toastCancelled'))
                              await refresh()
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : t('hosted.cancelFail'))
                            } finally {
                              setBusyId(null)
                            }
                          })()
                        }}
                      >
                        {t('hosted.cancel')}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rejectBooking ? (
        <div className="fixed inset-0 z-40 bg-black/70 px-4">
          <div className="mx-auto mt-28 max-w-md rounded-2xl border border-white/15 bg-bg-navy p-5">
            <p className="text-lg font-black text-red-300">{t('hosted.reject')}</p>
            <label className="mt-3 block text-xs text-white/70">
              {t('hosted.rejectReason')}
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-bg-navy p-2 text-sm"
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/25 px-3 py-2 text-sm font-bold"
                onClick={() => {
                  setRejectBooking(null)
                  setRejectReason('')
                }}
              >
                {t('hosted.close')}
              </button>
              <button
                type="button"
                disabled={busyId === rejectBooking.id}
                className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                onClick={() => {
                  void (async () => {
                    setBusyId(rejectBooking.id)
                    try {
                      await hostRejectPayment(rejectBooking.id, rejectReason.trim() || null)
                      toast.success(t('hosted.toastRejected'))
                      setRejectBooking(null)
                      setRejectReason('')
                      await refresh()
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : t('hosted.cancelFail'))
                    } finally {
                      setBusyId(null)
                    }
                  })()
                }}
              >
                {t('hosted.reject')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editMatch ? (
        <div className="fixed inset-0 z-40 bg-black/70 px-4">
          <div className="mx-auto mt-24 max-w-md rounded-2xl border border-white/15 bg-bg-navy p-5">
            <p className="text-lg font-black">{t('hosted.editTitle')}</p>
            <p className="mt-3 text-sm text-white/80">{t('hosted.editBody')}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/25 px-3 py-2 text-sm font-bold"
                onClick={() => setEditMatch(null)}
              >
                {t('hosted.close')}
              </button>
              <button
                type="button"
                disabled={busyId === editMatch.id}
                className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                onClick={() => {
                  void (async () => {
                    setBusyId(editMatch.id)
                    try {
                      await cancelHostMatch(editMatch.id, null)
                      track('host_match_cancel', { matchId: editMatch.id })
                      toast.success(t('hosted.toastCancelled'))
                      setEditMatch(null)
                      await refresh()
                      navigate(`/?venueId=${encodeURIComponent(editMatch.venueId)}`)
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : t('hosted.cancelFail'))
                    } finally {
                      setBusyId(null)
                    }
                  })()
                }}
              >
                {t('hosted.editCancelFirst')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
