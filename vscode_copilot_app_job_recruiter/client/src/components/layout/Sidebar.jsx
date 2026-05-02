import { NavLink } from 'react-router-dom'

const links = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Chat', to: '/chat' },
  { label: 'Search', to: '/search' },
  { label: 'Saved Profiles', to: '/saved' },
  { label: 'Settings', to: '/settings' },
]

function Sidebar() {
  return (
    <aside className="hidden xl:flex w-72 flex-col gap-4 rounded-3xl border border-border bg-bg-secondary p-6">
      <div className="text-sm uppercase tracking-[0.25em] text-text-muted">Workspace</div>
      <div className="space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm transition ${
                isActive ? 'bg-bg-primary text-white' : 'text-text-secondary hover:bg-bg-primary/60 hover:text-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto rounded-3xl border border-border bg-bg-primary p-4 text-text-secondary">
        <p className="text-sm font-semibold text-text-primary">Recruitment AI</p>
        <p className="mt-2 text-sm leading-6">Send secure candidate searches and get AI suggestions instantly.</p>
      </div>
    </aside>
  )
}

export default Sidebar