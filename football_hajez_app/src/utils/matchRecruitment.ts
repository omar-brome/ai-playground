import type { Match, MiniPosition } from '../types/domain'
import { ROLE_QUOTAS } from './roleQuotas'

export type RoleNeed = {
  role: MiniPosition
  /** Sum of open slots for this role across both teams. */
  needed: number
}

const ROLE_ORDER: MiniPosition[] = ['attacker', 'midfielder', 'goalkeeper']

/** Open slots per role, aggregated across team1 + team2 (same caps per team). */
export function aggregateRoleNeeds(match: Match): RoleNeed[] {
  const roles: MiniPosition[] = ['goalkeeper', 'midfielder', 'attacker']
  const out: RoleNeed[] = []
  for (const role of roles) {
    let needed = 0
    for (const team of ['team1', 'team2'] as const) {
      const booked = match.spots[team].booked.filter((p) => p.position === role).length
      needed += Math.max(0, ROLE_QUOTAS[role] - booked)
    }
    if (needed > 0) out.push({ role, needed })
  }
  out.sort((a, b) => {
    const ia = ROLE_ORDER.indexOf(a.role)
    const ib = ROLE_ORDER.indexOf(b.role)
    if (ia !== ib) return ia - ib
    return b.needed - a.needed
  })
  return out
}
