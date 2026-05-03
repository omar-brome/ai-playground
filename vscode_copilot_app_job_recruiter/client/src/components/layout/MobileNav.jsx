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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-gradient-to-b from-white via-neutral-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-6 shadow-glow-primary animate-slide-in">
        <button
          className="mb-8 flex items-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:scale-105 transition-all duration-200"
          onClick={onClose}
        >
          <span className="text-xl">×</span>
          Close
        </button>

        <nav className="space-y-4 text-lg text-neutral-900 dark:text-neutral-100">
          {links.map((link) => (
            <a key={link.to} href={link.to} className="block rounded-2xl px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 hover:scale-105" onClick={onClose}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="mt-12 space-y-4">
          <Link to="/login" onClick={onClose} className="block rounded-2xl border-2 border-primary-600 px-4 py-3 text-center text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:scale-105 transition-all duration-200">
            Login
          </Link>
          <Link to="/register" onClick={onClose} className="block rounded-2xl bg-primary-600 hover:bg-primary-700 px-4 py-3 text-center text-sm font-semibold text-white transition-all duration-200 shadow-soft hover:shadow-glow-primary border-2 border-primary-600 hover:scale-105">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}

export default MobileNav