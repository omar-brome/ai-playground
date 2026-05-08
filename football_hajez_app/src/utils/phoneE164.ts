/** Best-effort Lebanon E.164 for Supabase `phone_e164`. */
export function toPhoneE164(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('+')) return trimmed.replace(/\s/g, '')
  const digits = trimmed.replace(/\D/g, '')
  if (digits.startsWith('961')) return `+${digits}`
  if (digits.startsWith('0') && digits.length >= 8) return `+961${digits.slice(1)}`
  if (digits.length >= 7) return `+961${digits}`
  return trimmed.startsWith('+') ? trimmed : `+${digits}`
}
