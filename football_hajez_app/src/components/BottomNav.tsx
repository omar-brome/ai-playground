import { NavLink } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext'
import { useRole } from '../context/RoleContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm ${isActive ? 'bg-accent-green text-black' : 'text-white/75'}`

export function BottomNav() {
  const { role } = useRole()
  const { t } = useLocale()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-bg-navy/95 px-2 py-3 backdrop-blur sm:px-4">
      <div className="mx-auto flex max-w-md flex-wrap justify-center gap-1 sm:gap-2">
        <NavLink to="/" className={linkClass} end>
          {t('nav.home')}
        </NavLink>
        {role === 'pitch_host' ? (
          <NavLink to="/hosted" className={linkClass}>
            {t('nav.hosted')}
          </NavLink>
        ) : null}
        <NavLink to="/bookings" className={linkClass}>
          {t('nav.bookings')}
        </NavLink>
        <NavLink to="/welcome" className={linkClass}>
          {t('nav.switch')}
        </NavLink>
      </div>
    </nav>
  )
}
