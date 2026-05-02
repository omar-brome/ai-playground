import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import MobileNav from './MobileNav'
import useAuthStore from '../../store/authStore'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Chat', to: '/chat' },
  { label: 'Search', to: '/search' },
  { label: 'Saved', to: '/saved' },
]

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <header className="w-full border-b border-border bg-bg-primary/90 backdrop-blur-xl sticky top-0 z-sticky">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-3 font-semibold text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm shadow-lg shadow-primary/20">
              B
            </div>
            <span className="text-lg">Bond AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-xl px-3 py-2 text-sm font-semibold text-white bg-bg-secondary'
                    : 'rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-bg-secondary hover:text-white transition'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden md:inline text-sm text-text-secondary">Hello, {user?.name || 'Recruiter'}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden md:inline rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary-hover"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden md:inline text-sm text-text-secondary hover:text-white transition">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="hidden md:inline rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
                >
                  Get started
                </Link>
              </>
            )}

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border text-text-secondary transition hover:border-primary hover:text-white md:hidden"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <span className="text-2xl">☰</span>
            </button>
          </div>
        </div>
      </header>

      <MobileNav isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}

export default Navbar