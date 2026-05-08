import type { CancellationTier } from '../types/domain'

/** Bump when policy copy or rules change (stored on booking + shown on policy page). */
export const PAYMENT_POLICY_VERSION = 'v2026-05-09'

/** Host must approve within this many hours after proof upload (mirrors SQL in migration). */
export const HOST_REVIEW_HOURS = 48

/** Cancellation tier thresholds (hours before kickoff); mirrors SQL in cancel_confirmed_booking. */
export const CANCEL_TIER_FULL_REFUND_HOURS = 48
export const CANCEL_TIER_PARTIAL_HOURS = 12

/** Same tier logic as `cancel_confirmed_booking` (client copy for toasts before cancel). */
export function cancellationTierFromKickoffMs(kickoffMs: number): CancellationTier {
  const hours = (kickoffMs - Date.now()) / 3600000
  if (hours >= CANCEL_TIER_FULL_REFUND_HOURS) return '48h_plus'
  if (hours >= CANCEL_TIER_PARTIAL_HOURS) return '12h_to_48h'
  return 'under_12h'
}
