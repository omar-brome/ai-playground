import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input } from '../components/ui'
import useAuthStore from '../store/authStore'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Please enter your full name'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

function Register() {
  const navigate = useNavigate()
  const registerUser = useAuthStore((state) => state.register)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  const onSubmit = async (data) => {
    const result = await registerUser(data)
    if (result.success) {
      navigate('/chat')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-bg-card p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-text-primary">Create your account</h1>
          <p className="mt-3 text-text-secondary">Start using Bond AI to discover top talent faster.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Full name" type="text" placeholder="Jane Doe" {...register('name')} error={errors.name?.message} />
          <Input label="Email address" type="email" placeholder="name@example.com" {...register('email')} error={errors.email?.message} />
          <Input label="Password" type="password" placeholder="Create a password" {...register('password')} error={errors.password?.message} />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat your password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          <label className="flex items-start gap-3 text-sm text-text-secondary">
            <input type="checkbox" {...register('terms')} className="mt-1 h-4 w-4 rounded border-border bg-bg-primary text-primary focus:ring-primary" />
            <span>
              I agree to the <span className="text-primary">terms and conditions</span>.
            </span>
          </label>
          {errors.terms && <p className="text-sm text-error">{errors.terms.message}</p>}

          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        {error && <p className="mt-4 text-center text-sm text-error">{error}</p>}

        <div className="my-6 flex items-center gap-4 text-text-secondary">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-[0.3em]">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button className="flex w-full items-center justify-center gap-3 rounded-3xl border border-border px-4 py-3 text-sm text-text-secondary transition hover:border-primary hover:text-white hover:bg-bg-secondary">
          <span>Register with Google</span>
          <span className="rounded-full bg-bg-primary px-2 py-1 text-xs text-text-muted">coming soon</span>
        </button>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
