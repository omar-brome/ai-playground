import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import MobileNav from './MobileNav'
import { ThemeToggle } from '../ui'
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
      <header className="w-full border-b border-neutral-200/50 dark:border-neutral-700/50 bg-gradient-to-r from-white/95 via-neutral-50/95 to-white/95 dark:from-neutral-900/95 dark:via-neutral-800/95 dark:to-neutral-900/95 backdrop-blur-xl sticky top-0 z-50 shadow-soft">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-3 font-semibold text-neutral-900 dark:text-neutral-100 hover:opacity-80 transition-opacity animate-fade-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm shadow-lg shadow-primary-600/20 transition-all">
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
                    ? 'rounded-xl px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 bg-primary-100 dark:bg-primary-900/30 shadow-soft hover:shadow-medium transition-all duration-200'
                    : 'rounded-xl px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-200 hover:scale-105'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <span className="hidden md:inline text-sm text-neutral-600 dark:text-neutral-400 animate-fade-in">Hello, {user?.name || 'Recruiter'}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden md:inline rounded-xl bg-error-600 hover:bg-error-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-soft hover:shadow-medium border-2 border-error-600 hover:scale-105"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden md:inline text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 hover:scale-105">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="hidden md:inline rounded-xl bg-primary-600 hover:bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 shadow-soft hover:shadow-glow-primary border-2 border-primary-600 hover:scale-105"
                >
                  Get started
                </Link>
              </>
            )}

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 transition-all duration-200 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:scale-105 md:hidden"
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