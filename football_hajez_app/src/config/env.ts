export function isSupabaseBackend(): boolean {
  return (
    import.meta.env.VITE_USE_SUPABASE === 'true' &&
    Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY?.trim())
  )
}

/** Local dev only: sign-in with password (see .env.example). No effect in production builds. */
export function isDevHostPasswordBypassEnabled(): boolean {
  if (!import.meta.env.DEV) return false
  const pw = import.meta.env.VITE_DEV_HOST_PASSWORD?.trim()
  return Boolean(pw && pw.length > 0)
}
