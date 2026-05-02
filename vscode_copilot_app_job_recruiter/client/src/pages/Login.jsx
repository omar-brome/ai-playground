import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input } from '../components/ui'
import useAuthStore from '../store/authStore'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    const result = await login(data)
    if (result.success) {
      navigate('/chat')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-bg-card p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-text-primary">Welcome back</h1>
          <p className="mt-3 text-text-secondary">Sign in to continue recruiting with AI.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email address"
            type="email"
            placeholder="name@example.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            {...register('password')}
            error={errors.password?.message}
          />
          <div className="flex items-center justify-between text-sm text-text-secondary">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-border bg-bg-primary text-primary focus:ring-primary" />
              Remember me
            </label>
            <button type="button" className="text-primary hover:text-primary-hover">
              Forgot password?
            </button>
          </div>
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {error && <p className="mt-4 text-center text-sm text-error">{error}</p>}

        <div className="my-6 flex items-center gap-4 text-text-secondary">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-[0.3em]">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button className="flex w-full items-center justify-center gap-3 rounded-3xl border border-border px-4 py-3 text-sm text-text-secondary transition hover:border-primary hover:text-white hover:bg-bg-secondary">
          <span>Sign in with Google</span>
          <span className="rounded-full bg-bg-primary px-2 py-1 text-xs text-text-muted">coming soon</span>
        </button>

        <p className="mt-6 text-center text-sm text-text-secondary">
          New here?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
