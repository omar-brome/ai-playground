import { Link } from 'react-router-dom'

const links = [
  { label: 'Features', to: '#features' },
  { label: 'How it Works', to: '#how-it-works' },
  { label: 'Pricing', to: '#pricing' },
  { label: 'Blog', to: '#blog' },
]

function MobileNav({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-bg-primary p-6 shadow-2xl">
        <button
          className="mb-8 flex items-center gap-2 rounded-full border border-border px-4 py-3 text-sm text-text-secondary hover:bg-bg-secondary"
          onClick={onClose}
        >
          <span className="text-xl">×</span>
          Close
        </button>

        <nav className="space-y-4 text-lg text-text-primary">
          {links.map((link) => (
            <a key={link.to} href={link.to} className="block rounded-2xl px-4 py-3 hover:bg-bg-secondary transition" onClick={onClose}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="mt-12 space-y-4">
          <Link to="/login" onClick={onClose} className="block rounded-2xl border border-primary px-4 py-3 text-center text-sm text-primary hover:bg-primary/10 transition">
            Login
          </Link>
          <Link to="/register" onClick={onClose} className="block rounded-2xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white hover:bg-primary-hover transition">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}

export default MobileNav