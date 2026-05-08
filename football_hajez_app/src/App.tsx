import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { useRole } from './context/RoleContext'
import { useLocale } from './context/LocaleContext'
import Home from './pages/Home'
import MatchPage from './pages/MatchPage'
import MyBookings from './pages/MyBookings'
import MyHostedMatches from './pages/MyHostedMatches'
import NotFound from './pages/NotFound'
import PaymentPage from './pages/PaymentPage'
import PaymentPolicyPage from './pages/PaymentPolicyPage'
import VenuePage from './pages/VenuePage'
import Welcome from './pages/Welcome'

function GuardedRoutes() {
  const { role } = useRole()
  const { locale, setLocale, t } = useLocale()
  const location = useLocation()
  if (!role && location.pathname !== '/welcome') return <Navigate to="/welcome" replace />

  return (
    <>
      {location.pathname !== '/welcome' ? (
        <div className="sticky top-0 z-30 border-b border-white/10 bg-bg-navy/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between gap-2">
            <p className="text-xs text-white/80">
              {t('header.role')}:{' '}
              <span className="font-bold">{role === 'pitch_host' ? t('header.roleHost') : t('header.rolePlayer')}</span>
            </p>
            <button
              type="button"
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/90"
            >
              {locale === 'en' ? t('locale.switchToAr') : t('locale.switchToEn')}
            </button>
          </div>
        </div>
      ) : null}
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/" element={<Home />} />
        <Route path="/venue/:venueId" element={<VenuePage />} />
        <Route path="/match/:matchId" element={<MatchPage />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        <Route path="/payment-policy" element={<PaymentPolicyPage />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/hosted" element={<MyHostedMatches />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {location.pathname !== '/welcome' ? <BottomNav /> : null}
    </>
  )
}

export default function App() {
  return <GuardedRoutes />
}
