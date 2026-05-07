import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-bold ${isActive ? 'bg-accent-green text-black' : 'text-white/75'}`

export function BottomNav() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-20 border-t border-white/10 bg-bg-navy/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md justify-center gap-2">
        <NavLink to="/" className={linkClass} end>
          Home
        </NavLink>
        <NavLink to="/bookings" className={linkClass}>
          My Bookings
        </NavLink>
        <NavLink to="/welcome" className={linkClass}>
          Switch Role
        </NavLink>
      </div>
    </nav>
  )
}
