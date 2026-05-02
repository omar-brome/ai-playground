import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-bg-card p-12 text-center shadow-xl">
        <h1 className="text-5xl font-bold text-text-primary">404</h1>
        <p className="mt-4 text-lg text-text-secondary">Sorry, we couldn't find that page.</p>
        <div className="mt-8 flex justify-center">
          <Link to="/">
            <Button>Return home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound