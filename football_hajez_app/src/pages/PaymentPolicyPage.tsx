import { useNavigate } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import {
  CANCEL_TIER_FULL_REFUND_HOURS,
  CANCEL_TIER_PARTIAL_HOURS,
  HOST_REVIEW_HOURS,
} from '../constants/paymentPolicy'

export default function PaymentPolicyPage() {
  const { t } = useLocale()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <button
        type="button"
        className="mb-3 rounded-lg border border-white/20 px-3 py-1 text-xs font-bold text-white/85"
        onClick={() => navigate(-1)}
      >
        ← {t('policy.back')}
      </button>
      <h1 className="text-2xl font-black">{t('policy.title')}</h1>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-bold text-accent-green">{t('policy.whishTitle')}</h2>
        <p className="mt-2 text-sm text-white/80">{t('policy.whishBody')}</p>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-bold text-accent-green">{t('policy.cancelTitle')}</h2>
        <p className="mt-2 text-sm text-white/80">
          {CANCEL_TIER_FULL_REFUND_HOURS}h+ — {t('policy.cancel48')}
        </p>
        <p className="mt-2 text-sm text-white/80">
          {CANCEL_TIER_PARTIAL_HOURS}h–{CANCEL_TIER_FULL_REFUND_HOURS}h — {t('policy.cancel12')}
        </p>
        <p className="mt-2 text-sm text-white/80">
          &lt;{CANCEL_TIER_PARTIAL_HOURS}h — {t('policy.cancelUnder')}
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-bold text-accent-green">{t('policy.hostTitle')}</h2>
        <p className="mt-2 text-sm text-white/80">{t('policy.hostBody')}</p>
      </section>
      <p className="mt-1 text-xs text-white/50">Host review: {HOST_REVIEW_HOURS}h (same as server).</p>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-bold text-accent-green">{t('policy.rejectTitle')}</h2>
        <p className="mt-2 text-sm text-white/80">{t('policy.rejectBody')}</p>
      </section>

      <button
        type="button"
        className="mt-6 text-sm font-bold text-accent-green underline"
        onClick={() => navigate(-1)}
      >
        {t('policy.back')}
      </button>
    </div>
  )
}
