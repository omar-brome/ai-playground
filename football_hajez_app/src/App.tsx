import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { useRole } from './context/RoleContext'
import Home from './pages/Home'
import MatchPage from './pages/MatchPage'
import MyBookings from './pages/MyBookings'
import NotFound from './pages/NotFound'
import PaymentPage from './pages/PaymentPage'
import VenuePage from './pages/VenuePage'
import Welcome from './pages/Welcome'

function GuardedRoutes() {
  const { role } = useRole()
  const location = useLocation()
  if (!role && location.pathname !== '/welcome') return <Navigate to="/welcome" replace />

  return (
    <>
      {location.pathname !== '/welcome' ? (
        <div className="sticky top-0 z-30 border-b border-white/10 bg-bg-navy/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <p className="text-xs text-white/80">
              Current role: <span className="font-bold">{role === 'pitch_host' ? 'Pitch Host' : 'Player'}</span>
            </p>
          </div>
        </div>
      ) : null}
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/" element={<Home />} />
        <Route path="/venue/:venueId" element={<VenuePage />} />
        <Route path="/match/:matchId" element={<MatchPage />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {location.pathname !== '/welcome' ? <BottomNav /> : null}
    </>
  )
}

export default function App() {
  return <GuardedRoutes />
}
