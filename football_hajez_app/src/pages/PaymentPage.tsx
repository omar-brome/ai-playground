import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { CountdownTimer } from '../components/CountdownTimer'
import { useBooking } from '../context/BookingContext'
import { useLocale } from '../context/LocaleContext'
import { isSupabaseBackend } from '../config/env'
import { PAYMENT_POLICY_VERSION } from '../constants/paymentPolicy'
import { venues } from '../data/mockData'
import BookingConfirmation from './BookingConfirmation'
import { formatDateTime, formatLbp } from '../utils/format'
import { toast } from '../utils/toast'
import { track } from '../analytics/track'

export default function PaymentPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { t } = useLocale()
  const {
    getBookingById,
    getMatchById,
    confirmBookingDemo,
    expireBooking,
    submitPaymentProofFromFile,
    refreshBookings,
  } = useBooking()
  const booking = getBookingById(bookingId)
  const [paid, setPaid] = useState(false)
  const [policyConsent, setPolicyConsent] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  const match = useMemo(() => getMatchById(booking?.matchId), [booking?.matchId, getMatchById])
  const venue = venues.find((v) => v.id === booking?.venueId)
  const bookingIdStable = booking?.id
  const bookingStatusStable = booking?.status

  const handleExpired = useCallback(() => {
    if (!booking || booking.status !== 'pending') return
    void (async () => {
      try {
        await expireBooking(booking.id)
        navigate(`/match/${booking.matchId}`, { replace: true })
      } catch {
        toast.error(t('payment.expireFail'))
      }
    })()
  }, [booking, expireBooking, navigate, t])

  const handleHostDeadlineExpired = useCallback(() => {
    void refreshBookings().then(() => {
      const b = getBookingById(bookingId)
      if (b?.status === 'expired') {
        toast.error(t('payment.expireFail'))
        navigate(`/match/${b.matchId}`, { replace: true })
      }
    })
  }, [bookingId, getBookingById, navigate, refreshBookings, t])

  useEffect(() => {
    if (!bookingIdStable || bookingStatusStable !== 'awaiting_host_approval') return
    const id = window.setInterval(() => {
      void refreshBookings()
    }, 20000)
    return () => window.clearInterval(id)
  }, [bookingIdStable, bookingStatusStable, refreshBookings])

  if (!booking || !match) return <Navigate to="/" replace />
  if (booking.status === 'expired') return <Navigate to={`/match/${booking.matchId}`} replace />

  const showWhishFlow = booking.status === 'pending' || booking.status === 'awaiting_host_approval'
  const awaiting = booking.status === 'awaiting_host_approval'

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="text-2xl font-black">{t('payment.title')}</h1>
      {paid || booking.status === 'confirmed' ? (
        <BookingConfirmation booking={booking} />
      ) : (
        <>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            <p className="font-bold">{venue?.name}</p>
            <p className="text-white/70">{formatDateTime(match.date, match.time)}</p>
            <p className="mt-1">Team: {booking.team === 'team1' ? 'Team 1' : 'Opposite Team'}</p>
            <p className="mt-1">Position: {booking.position}</p>
            <p className="mt-1">Full Name: {booking.playerName}</p>
            <p>Phone Number: {booking.phone}</p>
            <p className="mt-1 text-accent-green">{formatLbp(booking.amount)}</p>
          </div>

          {showWhishFlow ? (
            <>
              <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-3">
                <Link to="/payment-policy" className="text-sm font-bold text-accent-green underline">
                  {t('payment.policyLink')}
                </Link>
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-white/85">
                  <input
                    type="checkbox"
                    checked={policyConsent}
                    onChange={(e) => setPolicyConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <span>{t('payment.consentLabel')}</span>
                </label>
              </div>

              <div className="mt-4 rounded-2xl border border-whish-pink/40 bg-whish-pink/10 p-4">
                <p className="text-lg font-black text-whish-pink">Whish</p>
                <ol className="mt-2 list-decimal space-y-1 ps-4 text-sm text-white/90">
                  <li>Open your Whish Money app</li>
                  <li>Send {formatLbp(booking.amount)} to 03 123 456</li>
                  <li>Use reference code: {booking.id}</li>
                  <li>Upload your proof below</li>
                </ol>
              </div>

              {!awaiting ? (
                <>
                  <div className="mt-4 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-yellow-300">Time remaining (payment hold)</p>
                    <CountdownTimer expiresAt={booking.expiresAt} onExpired={handleExpired} />
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-white/80">{t('payment.uploadHint')}</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="mt-2 w-full text-sm"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!policyConsent || !file || busy}
                    className="mt-5 w-full rounded-xl bg-accent-green p-3 font-black text-black disabled:opacity-40"
                    onClick={() => {
                      if (!file) return
                      setBusy(true)
                      void (async () => {
                        try {
                          await submitPaymentProofFromFile(booking.id, file, PAYMENT_POLICY_VERSION)
                          track('payment_success', { bookingId: booking.id, step: 'proof_submitted' })
                          toast.success(t('payment.awaitingTitle'))
                          setFile(null)
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : t('payment.proofFail'))
                        } finally {
                          setBusy(false)
                        }
                      })()
                    }}
                  >
                    {t('payment.submitProof')}
                  </button>
                  {!isSupabaseBackend() ? (
                    <button
                      type="button"
                      disabled={busy}
                      className="mt-2 w-full rounded-xl border border-white/25 p-2 text-xs font-bold text-white/80"
                      onClick={() => {
                        setBusy(true)
                        void (async () => {
                          try {
                            await confirmBookingDemo(booking.id)
                            setPaid(true)
                            track('payment_success', { bookingId: booking.id, step: 'local_demo_confirmed' })
                            toast.success(t('payment.toastPaid'))
                          } catch {
                            toast.error(t('payment.confirmFail'))
                          } finally {
                            setBusy(false)
                          }
                        })()
                      }}
                    >
                      {t('payment.localSkip')}
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="mt-4 space-y-3 rounded-2xl border border-accent-green/30 bg-accent-green/10 p-4">
                  <p className="font-bold text-accent-green">{t('payment.awaitingTitle')}</p>
                  <p className="text-sm text-white/80">{t('payment.awaitingHint')}</p>
                  {booking.hostReviewDeadline ? (
                    <div className="rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-3">
                      <p className="text-xs uppercase tracking-wide text-yellow-300">{t('payment.hostDeadline')}</p>
                      <CountdownTimer expiresAt={booking.hostReviewDeadline} onExpired={handleHostDeadlineExpired} />
                    </div>
                  ) : null}
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
