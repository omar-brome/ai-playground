import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { TrackingTimeline } from '../components/TrackingTimeline'
import { mockTrackingEvents } from '../data/mockTracking'
import { mapShipmentToTimeline } from '../lib/dhl'
import type { TimelineEvent } from '../data/mockTracking'

const MOCK_EDD = mockTrackingEvents[0]?.timestamp
  ? formatDate(mockTrackingEvents[0].timestamp)
  : ''

export default function Tracking() {
  const { trackingNumber: rawTn } = useParams()
  const trackingNumber = rawTn ?? ''
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [currentLine, setCurrentLine] = useState<string | null>(null)
  const [estimated, setEstimated] = useState<string | null>(null)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!trackingNumber) {
        setEvents([...mockTrackingEvents])
        setUsingMock(true)
        setEstimated(lastDeliveredEta(mockTrackingEvents))
        setCurrentLine('Demo shipment')
        return
      }

      const key = import.meta.env.VITE_DHL_API_KEY

      try {
        const { data } = await axios.get('/api/dhl/track/shipments', {
          params: { trackingNumber },
          headers: key ? { 'DHL-API-Key': key } : {},
        })

        const shipment = extractFirstShipment(data)
        if (!shipment || cancelled) {
          throw new Error('empty shipment')
        }

        const parsed = mapShipmentToTimeline(shipment)
        if (!parsed.events.length) throw new Error('no events')

        if (!cancelled) {
          setEvents(parsed.events)
          setUsingMock(false)
          const head =
            [parsed.currentDescription, parsed.currentLocation].filter(Boolean).join(' · ') ||
            parsed.events[0]?.description ||
            ''
          setCurrentLine(head || null)
          setEstimated(
            parsed.estimatedDelivery ? formatIsoSafe(parsed.estimatedDelivery) : null,
          )
        }
      } catch {
        if (cancelled) return
        setEvents([...mockTrackingEvents])
        setUsingMock(true)
        setCurrentLine(`${mockTrackingEvents[0]?.description ?? 'Shipment'} · demo`)
        setEstimated(lastDeliveredEta(mockTrackingEvents) ?? MOCK_EDD ?? null)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [trackingNumber])

  return (
    <div className="page-transition px-4 py-10 sm:px-6 lg:mx-auto lg:max-w-3xl lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-cream sm:text-4xl">
            Track shipment
          </h1>
          <p className="mt-2 font-mono text-sm text-gold/90">{trackingNumber || '—'}</p>
        </div>
        <DHLTiltBadge />
      </div>

      {currentLine ? (
        <p className="mt-6 rounded-xl border border-gold/20 bg-charcoal-deep/45 px-4 py-3 font-sans text-sm text-cream-muted">
          Current status: <span className="text-cream">{currentLine}</span>
        </p>
      ) : null}

      <section className="mt-8 rounded-2xl border border-gold/15 bg-charcoal-deep/35 p-6 md:p-8">
        <h2 className="font-display text-lg text-gold">Estimated delivery</h2>
        <p className="mt-2 font-sans text-cream">
          {estimated ??
            lastDeliveredEta(events) ??
            'Depends on courier updates — sandbox may not provide a live date.'}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-8 font-display text-xl text-cream">Timeline</h2>
        <TrackingTimeline events={events} fallback={usingMock} />
      </section>
    </div>
  )
}

function DHLTiltBadge() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#FFCC00]/50 bg-[#FFCC00]/12 px-4 py-2">
      <span className="text-lg font-black tracking-tight text-[#FFCC00]">DHL</span>
      <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-cream">
        Express
      </span>
    </div>
  )
}

function extractFirstShipment(data: unknown): unknown {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const arr = d.shipments
  if (!Array.isArray(arr) || !arr[0]) return null
  return arr[0]
}

function formatIsoSafe(s: string): string {
  try {
    return new Date(s).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return s
  }
}

function formatDate(ts: string): string {
  return formatIsoSafe(ts)
}

function lastDeliveredEta(list: TimelineEvent[]): string | null {
  const delivered = list.find((e) => e.status === 'delivered')
  if (delivered) return formatDate(delivered.timestamp)
  const last = list[0]
  return last ? formatDate(last.timestamp) : null
}
