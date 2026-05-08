export type AppRole = 'player' | 'pitch_host'

export type BookingStatus =
  | 'pending'
  | 'awaiting_host_approval'
  | 'confirmed'
  | 'expired'
  | 'cancelled'
export type TeamSide = 'team1' | 'team2'
export type MiniPosition = 'goalkeeper' | 'midfielder' | 'attacker'

export type BookedPlayer = {
  bookingId: string
  playerName: string
  phone: string
  status: Exclude<BookingStatus, 'expired' | 'cancelled'>
  position?: MiniPosition
}

/** Cancellation tier set by DB when player cancels a confirmed booking (deadline-based). */
export type CancellationTier = '48h_plus' | '12h_to_48h' | 'under_12h'

export type SpotValue = {
  total: number
  booked: BookedPlayer[]
}

export type MatchType = '5-a-side' | '7-a-side'

/** Host session lifecycle (Supabase); local demo may omit or set `open` only. */
export type MatchSessionStatus = 'open' | 'full' | 'cancelled' | 'finished'

export type Match = {
  id: string
  venueId: string
  date: string
  time: string
  type: MatchType
  price: number
  spots: Record<string, SpotValue>
  /** UTC instant from DB; used for overlap math and “finished by time” without relying on browser local parsing. */
  startsAtUtc?: string
  endsAtUtc?: string
  sessionStatus?: MatchSessionStatus
}

export type Venue = {
  id: string
  name: string
  location: string
  image: string
  mapUrl: string
  surface: 'Indoor' | 'Outdoor'
  parking: 'Available' | 'Street'
  amenities: string[]
  about: string
}

export type Booking = {
  id: string
  matchId: string
  venueId: string
  team: TeamSide
  position: string
  playerName: string
  phone: string
  status: BookingStatus
  amount: number
  bookedAt: string
  expiresAt: string
  paymentProofStoragePath?: string | null
  paymentProofUploadedAt?: string | null
  policyVersion?: string | null
  policyConsentAt?: string | null
  hostReviewDeadline?: string | null
  hostDecisionAt?: string | null
  rejectionReason?: string | null
  cancellationTier?: CancellationTier | null
}

export type HostReservation = {
  id: string
  venueId: string
  startAt: string
  endAt: string
  createdAt: string
}

/** User's waitlist row for a match (team + role + queue # on that spot). */
export type MatchWaitlistEntry = {
  team: TeamSide
  position: MiniPosition
  queuePosition: number
}
