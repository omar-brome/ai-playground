import type { TimelineEvent } from '../data/mockTracking'

type TrackingTimelineProps = {
  events: TimelineEvent[]
  fallback?: boolean
}

export function TrackingTimeline({ events, fallback }: TrackingTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-[11px] top-2 w-px bg-gradient-to-b from-gold/50 via-gold/25 to-transparent md:left-[15px]" />

      <ul className="relative flex flex-col gap-8">
        {events.map((event, i) => (
          <li key={`${event.timestamp}-${i}`} className="relative flex gap-5 pl-10 md:gap-6 md:pl-12">
            <div className="absolute left-0 top-1 flex md:left-0.5">
              <StatusIcon status={event.status} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-xl border border-gold/15 bg-charcoal-deep/50 px-4 py-3 md:px-5">
              <time
                dateTime={event.timestamp}
                className="font-sans text-[11px] uppercase tracking-widest text-gold/70"
              >
                {formatWhen(event.timestamp)}
              </time>
              <p className="font-display text-lg text-cream">{event.description}</p>
              <p className="font-sans text-sm text-cream-muted">{event.location}</p>
            </div>
          </li>
        ))}
      </ul>

      {fallback ? (
        <p className="mt-6 font-sans text-xs text-gold/70">
          Showing demo timeline — sandbox API did not return events (CORS, key, or empty
          shipment).
        </p>
      ) : null}
    </div>
  )
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function StatusIcon({ status }: { status: TimelineEvent['status'] }) {
  const ring =
    status === 'delivered'
      ? 'border-gold bg-gold/30 shadow-[0_0_20px_-4px_rgba(201,169,110,0.65)]'
      : status === 'out-for-delivery'
        ? 'border-gold/80 bg-gold/15'
        : 'border-gold/40 bg-charcoal-deep'

  const inner =
    status === 'delivered' ? (
      <span className="h-2 w-2 rounded-full bg-gold" />
    ) : status === 'out-for-delivery' ? (
      <span className="h-2 w-2 rounded-full bg-gold/80" />
    ) : (
      <span className="h-2 w-2 rounded-full bg-gold/45" />
    )

  return (
    <div
      className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border md:h-7 md:w-7 ${ring}`}
      aria-hidden
    >
      {inner}
    </div>
  )
}
