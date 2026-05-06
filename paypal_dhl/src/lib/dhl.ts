import type { TimelineEvent, TimelineKind } from '../data/mockTracking'

/** Best-effort mapping from DHL Tracking API v2 payloads */
export function mapShipmentToTimeline(shipment: unknown): {
  currentDescription: string | null
  currentLocation: string | null
  estimatedDelivery: string | null
  events: TimelineEvent[]
} {
  const empty = {
    currentDescription: null as string | null,
    currentLocation: null as string | null,
    estimatedDelivery: null as string | null,
    events: [] as TimelineEvent[],
  }
  if (!shipment || typeof shipment !== 'object') return empty

  const s = shipment as Record<string, unknown>
  const status = s.status as Record<string, unknown> | undefined
  const currentDescription =
    typeof status?.description === 'string' ? status.description : null

  const addr = (
    ((status?.location as Record<string, unknown> | undefined)?.address ??
      status?.address) as Record<string, unknown> | undefined
  )
  const currentLocation =
    typeof addr?.addressLocality === 'string'
      ? addr.addressLocality
      : typeof addr?.countryCode === 'string'
        ? addr.countryCode
        : null

  const est =
    (s.estimatedTimeOfDelivery as Record<string, unknown> | undefined)
      ?.estimatedDeliveryDate ??
    s.estimatedDeliveryDate
  const estimatedDelivery =
    typeof est === 'string' ? est : est instanceof Date ? est.toISOString() : null

  const rawEvents = Array.isArray(s.events) ? s.events : []
  const events: TimelineEvent[] = []

  for (const ev of rawEvents) {
    const mapped = mapSingleEvent(ev)
    if (mapped) events.push(mapped)
  }

  events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  return {
    currentDescription,
    currentLocation,
    estimatedDelivery,
    events,
  }
}

function mapSingleEvent(ev: unknown): TimelineEvent | null {
  if (!ev || typeof ev !== 'object') return null
  const e = ev as Record<string, unknown>
  const ts =
    (typeof e.timestamp === 'string' && e.timestamp) ||
    (typeof e.eventTimestamp === 'string' && e.eventTimestamp) ||
    null
  const desc =
    typeof e.description === 'string'
      ? e.description
      : typeof e.status === 'string'
        ? e.status
        : ''
  if (!ts || !desc) return null

  const locRaw = e.location as Record<string, unknown> | undefined
  const addr =
    (locRaw?.address as Record<string, unknown> | undefined) ??
    (locRaw as Record<string, unknown> | undefined)
  let location = '—'
  if (addr) {
    const locality =
      typeof addr.addressLocality === 'string' ? addr.addressLocality : ''
    const cc = typeof addr.countryCode === 'string' ? addr.countryCode : ''
    location =
      [locality, cc].filter(Boolean).join(', ') || locality || cc || '—'
  }

  const statusCode =
    typeof e.statusCode === 'string' ? e.statusCode.toUpperCase() : ''

  const status: TimelineKind =
    statusCode.includes('DELIVERED') ||
    /delivered/i.test(desc) ||
    desc.toLowerCase().includes('delivered')
      ? 'delivered'
      : /out for delivery|courier|delivery attempted/i.test(desc)
        ? 'out-for-delivery'
        : 'transit'

  return { timestamp: ts, location, description: desc, status }
}
