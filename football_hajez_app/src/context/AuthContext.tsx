/* eslint-disable react-refresh/only-export-components -- co-located hook + provider */
import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { isDevHostPasswordBypassEnabled, isSupabaseBackend } from '../config/env'
import { getSupabaseClient } from '../lib/supabase'

function emailMagicLinkRedirectTo(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const path = window.location.pathname || '/'
  return `${window.location.origin}${path}`
}

/** Supabase leaves OAuth / magic-link errors in the URL when exchange fails (e.g. redirect URL not allowed). */
function readAuthRedirectErrorMessage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const u = new URL(window.location.href)
    const fromSearch = u.searchParams.get('error_description') ?? u.searchParams.get('error')
    if (fromSearch) return decodeURIComponent(fromSearch.replace(/\+/g, ' '))
    const hash = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash
    const hp = new URLSearchParams(hash)
    const fromHash = hp.get('error_description') ?? hp.get('error')
    if (fromHash) return decodeURIComponent(fromHash.replace(/\+/g, ' '))
  } catch {
    /* ignore */
  }
  return null
}

function stripAuthErrorQueryFromUrl(): void {
  if (typeof window === 'undefined') return
  try {
    const u = new URL(window.location.href)
    let changed = false
    for (const k of ['error', 'error_code', 'error_description']) {
      if (u.searchParams.has(k)) {
        u.searchParams.delete(k)
        changed = true
      }
    }
    if (!changed) return
    const next = `${u.pathname}${u.search}${u.hash}`
    window.history.replaceState(window.history.state, '', next)
  } catch {
    /* ignore */
  }
}

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  redirectAuthError: string | null
  clearRedirectAuthError: () => void
  signInEmailOtp: (email: string) => Promise<void>
  verifyEmailOtp: (email: string, token: string) => Promise<void>
  signInPhoneOtp: (phone: string) => Promise<void>
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>
  signOut: () => Promise<void>
  /** Dev + VITE_DEV_HOST_PASSWORD only: email/password sign-in (no magic link). */
  signInDevHostPasswordBypass: (() => Promise<void>) | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(() => isSupabaseBackend())
  const [redirectAuthError, setRedirectAuthError] = useState<string | null>(null)

  const clearRedirectAuthError = useCallback(() => {
    setRedirectAuthError(null)
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      startTransition(() => setLoading(false))
      return
    }

    let cancelled = false

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      const urlErr = readAuthRedirectErrorMessage()
      if (urlErr) {
        stripAuthErrorQueryFromUrl()
        startTransition(() => setRedirectAuthError(urlErr))
      }
      startTransition(() => {
        setSession(data.session ?? null)
        setLoading(false)
      })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, next: Session | null) => {
      startTransition(() => setSession(next))
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) startTransition(() => setRedirectAuthError(null))
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      redirectAuthError,
      clearRedirectAuthError,
      signInEmailOtp: async (email) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const emailRedirectTo = emailMagicLinkRedirectTo()
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            ...(emailRedirectTo ? { emailRedirectTo } : {}),
          },
        })
        if (error) throw error
      },
      verifyEmailOtp: async (email, token) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email',
        })
        if (error) throw error
      },
      signInPhoneOtp: async (phone) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const { error } = await supabase.auth.signInWithOtp({
          phone,
          options: { shouldCreateUser: true },
        })
        if (error) throw error
      },
      verifyPhoneOtp: async (phone, token) => {
        const supabase = getSupabaseClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token,
          type: 'sms',
        })
        if (error) throw error
      },
      signOut: async () => {
        const supabase = getSupabaseClient()
        if (!supabase) return
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
      signInDevHostPasswordBypass:
        isSupabaseBackend() && isDevHostPasswordBypassEnabled()
          ? async () => {
              const supabase = getSupabaseClient()
              if (!supabase) throw new Error('Supabase is not configured.')
              const email = (
                import.meta.env.VITE_DEV_HOST_EMAIL?.trim() || 'omar.brome@gmail.com'
              ).trim()
              const password = import.meta.env.VITE_DEV_HOST_PASSWORD?.trim()
              if (!password) throw new Error('VITE_DEV_HOST_PASSWORD is not set.')
              const { error } = await supabase.auth.signInWithPassword({ email, password })
              if (error) throw error
            }
          : null,
    }),
    [loading, session, redirectAuthError, clearRedirectAuthError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
