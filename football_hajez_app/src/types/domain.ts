export type AppRole = 'player' | 'pitch_host'

export type BookingStatus = 'pending' | 'confirmed' | 'expired'
export type TeamSide = 'team1' | 'team2'
export type MiniPosition = 'goalkeeper' | 'midfielder' | 'attacker'

export type BookedPlayer = {
  bookingId: string
  playerName: string
  phone: string
  status: Exclude<BookingStatus, 'expired'>
  position?: MiniPosition
}

export type SpotValue = {
  total: number
  booked: BookedPlayer[]
}

export type MatchType = '5-a-side' | '7-a-side'

export type Match = {
  id: string
  venueId: string
  date: string
  time: string
  type: MatchType
  price: number
  spots: Record<string, SpotValue>
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
}

export type HostReservation = {
  id: string
  venueId: string
  startAt: string
  endAt: string
  createdAt: string
}
