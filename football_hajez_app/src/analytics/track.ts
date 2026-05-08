const enabled = import.meta.env.VITE_ANALYTICS_ENABLED === 'true'
const endpoint = (import.meta.env.VITE_ANALYTICS_ENDPOINT ?? '').trim()

export type AnalyticsEvent =
  | 'venue_view'
  | 'booking_start'
  | 'payment_success'
  | 'booking_cancel'
  | 'host_match_cancel'

/** Fire-and-forget analytics; no-ops unless `VITE_ANALYTICS_ENABLED=true`. */
export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (!enabled) return
  const payload = { event, properties: properties ?? {}, ts: Date.now() }
  if (!endpoint) return
  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    /* ignore network errors */
  })
}
