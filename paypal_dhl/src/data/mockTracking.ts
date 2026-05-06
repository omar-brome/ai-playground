export type TimelineKind = 'transit' | 'out-for-delivery' | 'delivered'

export type TimelineEvent = {
  timestamp: string
  location: string
  description: string
  status: TimelineKind
}

export const mockTrackingEvents: TimelineEvent[] = [
  {
    timestamp: '2026-05-06T09:00:00Z',
    location: 'Beirut, LB',
    description: 'Shipment picked up',
    status: 'transit',
  },
  {
    timestamp: '2026-05-06T14:00:00Z',
    location: 'Beirut Hub, LB',
    description: 'Processed at facility',
    status: 'transit',
  },
  {
    timestamp: '2026-05-07T03:00:00Z',
    location: 'Frankfurt, DE',
    description: 'Arrived at DHL hub',
    status: 'transit',
  },
  {
    timestamp: '2026-05-07T11:00:00Z',
    location: 'Frankfurt, DE',
    description: 'Departed facility',
    status: 'transit',
  },
  {
    timestamp: '2026-05-08T08:00:00Z',
    location: 'Your City',
    description: 'Out for delivery',
    status: 'out-for-delivery',
  },
  {
    timestamp: '2026-05-08T14:30:00Z',
    location: 'Your City',
    description: 'Delivered',
    status: 'delivered',
  },
]
