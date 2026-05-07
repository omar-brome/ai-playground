import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md p-8">
      <p className="text-2xl font-black">Page not found</p>
      <Link to="/" className="mt-4 inline-block rounded-xl bg-accent-green px-4 py-2 font-bold text-black">
        Go Home
      </Link>
    </div>
  )
}
