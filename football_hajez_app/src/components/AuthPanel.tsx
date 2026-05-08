import { useState } from 'react'
import { isSupabaseBackend } from '../config/env'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { toast } from '../utils/toast'

type Channel = 'email' | 'phone'

export function AuthPanel() {
  const { t } = useLocale()
  const {
    user,
    loading,
    redirectAuthError,
    clearRedirectAuthError,
    signInEmailOtp,
    verifyEmailOtp,
    signInPhoneOtp,
    verifyPhoneOtp,
    signOut,
    signInDevHostPasswordBypass,
  } = useAuth()
  const [channel, setChannel] = useState<Channel>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!isSupabaseBackend()) return null

  if (loading) {
    return (
      <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/80">
        {t('auth.checking')}
      </div>
    )
  }

  if (user) {
    return (
      <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm">
        <p className="font-bold text-accent-green">{t('auth.signedIn')}</p>
        <p className="mt-1 text-xs text-white/70">{user.email ?? user.phone ?? user.id}</p>
        <button
          type="button"
          className="mt-3 w-full rounded-xl border border-white/25 px-3 py-2 text-xs font-bold"
          onClick={() => {
            setBusy(true)
            void signOut()
              .catch(() => {})
              .finally(() => setBusy(false))
          }}
          disabled={busy}
        >
          {t('auth.signOut')}
        </button>
      </div>
    )
  }

  const handleSend = async () => {
    setError('')
    setBusy(true)
    try {
      if (channel === 'email') {
        if (!email.trim()) throw new Error('Enter your email.')
        await signInEmailOtp(email.trim())
      } else {
        if (!phone.trim()) throw new Error('Enter your phone in E.164 (e.g. +96171123456).')
        await signInPhoneOtp(phone.trim())
      }
      setSent(true)
      toast.success(channel === 'email' ? t('auth.toastEmailSent') : t('auth.toastCodeSent'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('auth.toastSendFail')
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async () => {
    setError('')
    setBusy(true)
    try {
      if (!otp.trim()) throw new Error('Enter the code.')
      if (channel === 'email') await verifyEmailOtp(email.trim(), otp.trim())
      else await verifyPhoneOtp(phone.trim(), otp.trim())
      setSent(false)
      setOtp('')
      toast.success(t('auth.toastSignedIn'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('auth.toastVerifyFail')
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4 text-sm">
      <p className="font-bold">{t('auth.account')}</p>
      <p className="mt-1 text-xs text-white/70">{t('auth.accountHint')}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded-lg border px-2 py-1 text-xs font-bold ${channel === 'email' ? 'border-accent-green bg-accent-green/15' : 'border-white/20'}`}
          onClick={() => {
            setChannel('email')
            setSent(false)
            setError('')
          }}
        >
          {t('auth.email')}
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg border px-2 py-1 text-xs font-bold ${channel === 'phone' ? 'border-accent-green bg-accent-green/15' : 'border-white/20'}`}
          onClick={() => {
            setChannel('phone')
            setSent(false)
            setError('')
          }}
        >
          {t('auth.phone')}
        </button>
      </div>
      {channel === 'email' ? (
        <label className="mt-3 block text-xs text-white/70">
          {t('auth.email')}
          <input
            className="mt-1 w-full rounded-lg border border-white/20 bg-bg-navy p-2 text-sm"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
      ) : (
        <label className="mt-3 block text-xs text-white/70">
          {t('auth.phoneLabel')}
          <input
            className="mt-1 w-full rounded-lg border border-white/20 bg-bg-navy p-2 text-sm"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+96171123456"
            autoComplete="tel"
          />
        </label>
      )}
      {!sent ? (
        <button
          type="button"
          className="mt-3 w-full rounded-xl bg-accent-green p-2 text-xs font-bold text-black"
          disabled={busy}
          onClick={() => void handleSend()}
        >
          {t('auth.send')}
        </button>
      ) : (
        <>
          {channel === 'email' ? (
            <p className="mt-3 text-xs leading-relaxed text-white/70">{t('auth.emailMagicLinkHint')}</p>
          ) : null}
          <label className="mt-3 block text-xs text-white/70">
            {channel === 'email' ? t('auth.codeIfOtpTemplate') : t('auth.code')}
            <input
              className="mt-1 w-full rounded-lg border border-white/20 bg-bg-navy p-2 text-sm"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-accent-green p-2 text-xs font-bold text-black"
            disabled={busy}
            onClick={() => void handleVerify()}
          >
            {t('auth.verify')}
          </button>
          <button
            type="button"
            className="mt-2 w-full rounded-xl border border-white/20 p-2 text-xs font-bold"
            disabled={busy}
            onClick={() => {
              setSent(false)
              setOtp('')
            }}
          >
            {t('auth.useDifferent')} ({channel === 'email' ? t('auth.email') : t('auth.phoneLabel')})
          </button>
        </>
      )}
      {signInDevHostPasswordBypass ? (
        <div className="mt-4 rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 text-xs text-amber-100/90">
          <p className="text-[11px] leading-relaxed text-amber-100/80">{t('auth.devBypassHint')}</p>
          <button
            type="button"
            className="mt-2 w-full rounded-lg border border-amber-400/40 bg-amber-500/20 px-2 py-2 text-xs font-bold text-amber-50"
            disabled={busy}
            onClick={() => {
              setError('')
              setBusy(true)
              void signInDevHostPasswordBypass()
                .then(() => toast.success(t('auth.toastSignedIn')))
                .catch((err) => {
                  const msg = err instanceof Error ? err.message : t('auth.toastVerifyFail')
                  setError(msg)
                  toast.error(msg)
                })
                .finally(() => setBusy(false))
            }}
          >
            {t('auth.devBypass')}
          </button>
        </div>
      ) : null}
      {redirectAuthError ? (
        <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-xs text-red-200">
          <p>
            <span className="font-bold">{t('auth.redirectFailed')}: </span>
            {redirectAuthError}
          </p>
          <button
            type="button"
            className="mt-2 text-[11px] font-bold underline"
            onClick={() => clearRedirectAuthError()}
          >
            {t('auth.dismiss')}
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  )
}
