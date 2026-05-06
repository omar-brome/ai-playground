import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page-transition flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl leading-none text-gold/35">404</p>
      <h1 className="mt-6 font-display text-2xl text-cream sm:text-3xl">
        Lost in the smoke
      </h1>
      <p className="mt-3 max-w-md font-sans text-sm text-cream-muted">
        This page doesn't exist — perhaps the flame went out somewhere along the route.
      </p>
      <Link
        to="/"
        className="btn-glow mt-10 rounded-full border border-gold/45 bg-gold/15 px-8 py-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-cream transition hover:bg-gold/30"
      >
        Return home
      </Link>
    </div>
  )
}
