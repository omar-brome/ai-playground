import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Booking,
  BookedPlayer,
  CancellationTier,
  Match,
  MatchSessionStatus,
  MatchWaitlistEntry,
  MiniPosition,
  TeamSide,
} from '../types/domain'
import { beirutDateTimeParts } from '../utils/beirutTime'

type DbBookingEmbed = {
  id: string
  match_id: string
  roster_slot_id: string
  player_user_id: string
  player_name: string
  phone_e164: string
  status: string
  amount_lbp: number
  expires_at: string
  created_at: string
  confirmed_at: string | null
}

type DbSlotRow = {
  id: string
  match_id: string
  team_side: TeamSide
  position: MiniPosition
  slot_ordinal: number
  bookings: DbBookingEmbed[] | DbBookingEmbed | null
}

type DbMatchRow = {
  id: string
  venue_id: string
  starts_at: string
  ends_at: string
  type: Match['type']
  price_lbp: number
  status: string
  session_status?: string | null
  match_roster_slots: DbSlotRow[] | null
}

function displaySessionStatus(row: {
  status: string
  ends_at: string
  session_status?: string | null
}): MatchSessionStatus {
  if (row.status === 'cancelled') return 'cancelled'
  if (row.status === 'scheduled' && new Date(row.ends_at).getTime() < Date.now()) return 'finished'
  const s = row.session_status
  if (s === 'open' || s === 'full' || s === 'cancelled' || s === 'finished') return s
  return 'open'
}

function slotBookings(slot: DbSlotRow): DbBookingEmbed[] {
  const raw = slot.bookings
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

function activeBookingForSlot(slot: DbSlotRow): DbBookingEmbed | undefined {
  return slotBookings(slot).find(
    (b) => b.status === 'pending' || b.status === 'awaiting_host_approval' || b.status === 'confirmed',
  )
}

export function mapMatchRow(row: DbMatchRow): Match {
  const { date, time } = beirutDateTimeParts(row.starts_at)
  const slots = row.match_roster_slots ?? []
  const team1Booked: BookedPlayer[] = []
  const team2Booked: BookedPlayer[] = []
  for (const slot of slots) {
    const b = activeBookingForSlot(slot)
    if (!b) continue
    const status: BookedPlayer['status'] =
      b.status === 'pending' || b.status === 'awaiting_host_approval' || b.status === 'confirmed'
        ? (b.status as BookedPlayer['status'])
        : 'pending'
    const player: BookedPlayer = {
      bookingId: b.id,
      playerName: b.player_name,
      phone: b.phone_e164,
      status,
      position: slot.position,
    }
    if (slot.team_side === 'team1') team1Booked.push(player)
    else team2Booked.push(player)
  }
  return {
    id: row.id,
    venueId: row.venue_id,
    date,
    time,
    type: row.type,
    price: row.price_lbp,
    startsAtUtc: row.starts_at,
    endsAtUtc: row.ends_at,
    sessionStatus: displaySessionStatus(row),
    spots: {
      team1: { total: 5, booked: team1Booked },
      team2: { total: 5, booked: team2Booked },
    },
  }
}

type MyBookingRow = {
  id: string
  match_id: string
  player_name: string
  phone_e164: string
  status: Booking['status']
  amount_lbp: number
  expires_at: string
  created_at: string
  payment_proof_storage_path?: string | null
  payment_proof_uploaded_at?: string | null
  policy_version?: string | null
  policy_consent_at?: string | null
  host_review_deadline?: string | null
  rejection_reason?: string | null
  cancellation_tier?: string | null
  match_roster_slots: { team_side: TeamSide; position: MiniPosition } | { team_side: TeamSide; position: MiniPosition }[] | null
  matches:
    | { venue_id: string; starts_at: string; type: Match['type']; price_lbp: number; created_by?: string }
    | { venue_id: string; starts_at: string; type: Match['type']; price_lbp: number; created_by?: string }[]
    | null
}

export type HostPendingPaymentBooking = {
  booking: Booking
  matchStartsAt: string
}

function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export function mapMyBookingRow(row: MyBookingRow): Booking | null {
  const slot = firstOrSelf(row.match_roster_slots)
  const match = firstOrSelf(row.matches)
  if (!slot || !match) return null
  const tier = row.cancellation_tier
  const cancellationTier: CancellationTier | null =
    tier === '48h_plus' || tier === '12h_to_48h' || tier === 'under_12h' ? tier : null

  return {
    id: row.id,
    matchId: row.match_id,
    venueId: match.venue_id,
    team: slot.team_side,
    position: slot.position,
    playerName: row.player_name,
    phone: row.phone_e164,
    status: row.status,
    amount: row.amount_lbp,
    bookedAt: row.created_at,
    expiresAt: row.expires_at,
    paymentProofStoragePath: row.payment_proof_storage_path ?? null,
    paymentProofUploadedAt: row.payment_proof_uploaded_at ?? null,
    policyVersion: row.policy_version ?? null,
    policyConsentAt: row.policy_consent_at ?? null,
    hostReviewDeadline: row.host_review_deadline ?? null,
    rejectionReason: row.rejection_reason ?? null,
    cancellationTier,
  }
}

export async function fetchScheduledMatches(supabase: SupabaseClient): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `
      id,
      venue_id,
      starts_at,
      ends_at,
      type,
      price_lbp,
      status,
      session_status,
      match_roster_slots (
        id,
        match_id,
        team_side,
        position,
        slot_ordinal,
        bookings (
          id,
          match_id,
          roster_slot_id,
          player_user_id,
          player_name,
          phone_e164,
          status,
          amount_lbp,
          expires_at,
          created_at,
          confirmed_at
        )
      )
    `,
    )
    .eq('status', 'scheduled')
    .in('session_status', ['open', 'full'])
    .gte('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as DbMatchRow[]
  return rows.map(mapMatchRow)
}

/** All matches created by the current user (any status/session), for host dashboard. */
export async function fetchMyHostedMatches(supabase: SupabaseClient): Promise<Match[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('matches')
    .select(
      `
      id,
      venue_id,
      starts_at,
      ends_at,
      type,
      price_lbp,
      status,
      session_status,
      match_roster_slots (
        id,
        match_id,
        team_side,
        position,
        slot_ordinal,
        bookings (
          id,
          match_id,
          roster_slot_id,
          player_user_id,
          player_name,
          phone_e164,
          status,
          amount_lbp,
          expires_at,
          created_at,
          confirmed_at
        )
      )
    `,
    )
    .eq('created_by', user.id)
    .order('starts_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as DbMatchRow[]
  return rows.map(mapMatchRow)
}

export async function fetchMyBookings(supabase: SupabaseClient): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      match_id,
      player_name,
      phone_e164,
      status,
      amount_lbp,
      expires_at,
      created_at,
      payment_proof_storage_path,
      payment_proof_uploaded_at,
      policy_version,
      policy_consent_at,
      host_review_deadline,
      rejection_reason,
      cancellation_tier,
      match_roster_slots ( team_side, position ),
      matches ( venue_id, starts_at, type, price_lbp, created_by )
    `,
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as unknown as MyBookingRow[]
  return rows.map(mapMyBookingRow).filter((b): b is Booking => Boolean(b))
}

function wallTimeForRpc(timeStr: string): string {
  const t = timeStr.trim()
  return t.length === 5 ? `${t}:00` : t
}

export async function rpcCreateHostMatch(
  supabase: SupabaseClient,
  input: {
    venueId: string
    startsAtIso?: string | null
    startDate?: string
    startTime?: string
    durationMinutes?: number
    priceLbp?: number
    matchType?: Match['type']
  },
): Promise<string> {
  const useWall = Boolean(input.startDate && input.startTime?.trim())
  const { data, error } = await supabase.rpc(
    'create_host_match',
    useWall
      ? {
          p_venue_id: input.venueId,
          p_starts_at: null,
          p_duration_minutes: input.durationMinutes ?? 90,
          p_price_lbp: input.priceLbp ?? 300000,
          p_match_type: input.matchType ?? '5-a-side',
          p_start_date: input.startDate,
          p_start_time: wallTimeForRpc(input.startTime!),
          p_tz: 'Asia/Beirut',
        }
      : {
          p_venue_id: input.venueId,
          p_starts_at: input.startsAtIso ?? null,
          p_duration_minutes: input.durationMinutes ?? 90,
          p_price_lbp: input.priceLbp ?? 300000,
          p_match_type: input.matchType ?? '5-a-side',
          p_start_date: null,
          p_start_time: null,
          p_tz: 'Asia/Beirut',
        },
  )
  if (error) {
    if (error.message.includes('Venue overlap')) throw new Error('This venue already has a match in that time window.')
    throw error
  }
  return data as string
}

export async function rpcCreatePendingBooking(
  supabase: SupabaseClient,
  input: {
    matchId: string
    team: TeamSide
    position: MiniPosition
    playerName: string
    phoneE164: string
    amountLbp: number
  },
): Promise<{ bookingId: string; expiresAt: string; rosterSlotId?: string }> {
  const args = {
    p_match_id: input.matchId,
    p_team_side: input.team,
    p_position: input.position,
    p_player_name: input.playerName,
    p_phone_e164: input.phoneE164,
    p_amount_lbp: input.amountLbp,
    p_hold_minutes: 15,
  }

  let lastMessage = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase.rpc('create_pending_booking', args)
    if (!error) {
      const row = Array.isArray(data) ? data[0] : data
      if (!row?.booking_id) throw new Error('Unable to create booking.')
      return {
        bookingId: row.booking_id as string,
        expiresAt: row.expires_at as string,
        rosterSlotId: row.roster_slot_id as string | undefined,
      }
    }
    lastMessage = error.message ?? ''
    const msg = lastMessage
    if (
      attempt === 0 &&
      (msg.includes('Seat no longer available') || msg.includes('23505') || msg.includes('unique'))
    ) {
      continue
    }
    if (msg.includes('No slot')) throw new Error('No slots left for this role on the selected team.')
    if (msg.includes('Already have')) throw new Error('You already have an active booking for this match.')
    if (msg.includes('Seat no longer available')) throw new Error('That seat was just taken. Try another slot.')
    throw error
  }
  throw new Error(lastMessage || 'Unable to create booking.')
}

export async function rpcConfirmBookingDemo(supabase: SupabaseClient, bookingId: string) {
  const { error } = await supabase.rpc('confirm_booking_demo', { p_booking_id: bookingId })
  if (error) throw error
}

export async function rpcExpirePendingBooking(supabase: SupabaseClient, bookingId: string) {
  const { error } = await supabase.rpc('expire_pending_booking', { p_booking_id: bookingId })
  if (error) throw error
}

export async function rpcCancelConfirmedBooking(supabase: SupabaseClient, bookingId: string, reason?: string) {
  const { error } = await supabase.rpc('cancel_confirmed_booking', {
    p_booking_id: bookingId,
    p_reason: reason ?? null,
  })
  if (error) throw error
}

export async function rpcCancelMatch(supabase: SupabaseClient, matchId: string, reason?: string | null) {
  const { error } = await supabase.rpc('cancel_match', {
    p_match_id: matchId,
    p_reason: reason ?? null,
  })
  if (error) throw error
}

export async function rpcExpireAwaitingHostBookings(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.rpc('expire_awaiting_host_bookings')
  if (error) throw error
}

export async function rpcSubmitBookingPaymentProof(
  supabase: SupabaseClient,
  bookingId: string,
  proofStoragePath: string,
  policyVersion: string,
) {
  const { error } = await supabase.rpc('submit_booking_payment_proof', {
    p_booking_id: bookingId,
    p_proof_storage_path: proofStoragePath,
    p_policy_version: policyVersion,
  })
  if (error) throw error
}

export async function rpcHostApproveBooking(supabase: SupabaseClient, bookingId: string) {
  const { error } = await supabase.rpc('host_approve_booking', { p_booking_id: bookingId })
  if (error) throw error
}

export async function rpcHostRejectBooking(supabase: SupabaseClient, bookingId: string, reason?: string | null) {
  const { error } = await supabase.rpc('host_reject_booking', {
    p_booking_id: bookingId,
    p_reason: reason ?? null,
  })
  if (error) throw error
}

/** Upload screenshot to `payment-proofs/{bookingId}/...`. Caller then passes returned path to `rpcSubmitBookingPaymentProof`. */
export async function uploadPaymentProofToStorage(
  supabase: SupabaseClient,
  bookingId: string,
  file: File,
): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '') || 'jpg'
  const path = `${bookingId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('payment-proofs').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error
  return path
}

export async function createSignedProofUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(storagePath, expiresInSeconds)
  if (error) throw error
  return data.signedUrl
}

export async function fetchHostAwaitingPaymentBookings(supabase: SupabaseClient): Promise<HostPendingPaymentBooking[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      match_id,
      player_name,
      phone_e164,
      status,
      amount_lbp,
      expires_at,
      created_at,
      payment_proof_storage_path,
      payment_proof_uploaded_at,
      policy_version,
      policy_consent_at,
      host_review_deadline,
      rejection_reason,
      cancellation_tier,
      match_roster_slots ( team_side, position ),
      matches ( venue_id, starts_at, type, price_lbp, created_by )
    `,
    )
    .eq('status', 'awaiting_host_approval')
    .order('payment_proof_uploaded_at', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as MyBookingRow[]
  return rows
    .filter((row) => {
      const m = firstOrSelf(row.matches)
      return Boolean(m && m.created_by === user.id)
    })
    .map((row) => {
      const b = mapMyBookingRow(row)
      const m = firstOrSelf(row.matches)
      if (!b || !m) return null
      return { booking: b, matchStartsAt: m.starts_at }
    })
    .filter((x): x is HostPendingPaymentBooking => Boolean(x))
}

export async function rpcGetMyWaitlistEntries(
  supabase: SupabaseClient,
  matchId: string,
): Promise<MatchWaitlistEntry[]> {
  const { data, error } = await supabase.rpc('get_my_waitlist_entries', { p_match_id: matchId })
  if (error) throw error
  const rows = (Array.isArray(data) ? data : []) as {
    team_side: TeamSide
    position?: MiniPosition
    role?: MiniPosition
    queue_position: number
  }[]
  return rows.map((r) => ({
    team: r.team_side,
    position: (r.position ?? r.role) as MiniPosition,
    queuePosition: r.queue_position,
  }))
}

export async function rpcJoinMatchWaitlist(
  supabase: SupabaseClient,
  input: { matchId: string; team: TeamSide; position: MiniPosition },
): Promise<{ waitlistId: string; queuePosition: number }> {
  const { data, error } = await supabase.rpc('join_match_waitlist', {
    p_match_id: input.matchId,
    p_team_side: input.team,
    p_position: input.position,
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') throw new Error('Waitlist join failed.')
  const rec = row as Record<string, unknown>
  const wid = String(rec.waitlist_id ?? rec.waitlistId ?? '')
  const qpos = Number(rec.queue_position ?? rec.queuePosition ?? 1)
  if (!wid) throw new Error('Waitlist join failed.')
  return { waitlistId: wid, queuePosition: qpos }
}

export async function rpcLeaveMatchWaitlist(
  supabase: SupabaseClient,
  input: { matchId: string; team: TeamSide; position: MiniPosition },
): Promise<void> {
  const { error } = await supabase.rpc('leave_match_waitlist', {
    p_match_id: input.matchId,
    p_team_side: input.team,
    p_position: input.position,
  })
  if (error) throw error
}
