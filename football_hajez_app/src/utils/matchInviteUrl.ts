import type { MiniPosition, TeamSide } from '../types/domain'

const TEAM_SIDES: TeamSide[] = ['team1', 'team2']
const POSITIONS: MiniPosition[] = ['goalkeeper', 'midfielder', 'attacker']

function isTeamSide(v: string | null): v is TeamSide {
  return v != null && (TEAM_SIDES as string[]).includes(v)
}

function isMiniPosition(v: string | null): v is MiniPosition {
  return v != null && (POSITIONS as string[]).includes(v)
}

export type InviteParams = {
  team: TeamSide | null
  role: MiniPosition | null
}

/** Read `team` and `role` query params from a URLSearchParams (e.g. `?team=team1&role=attacker`). */
export function parseInviteSearchParams(searchParams: URLSearchParams): InviteParams {
  const teamRaw = searchParams.get('team')
  const roleRaw = searchParams.get('role')
  return {
    team: isTeamSide(teamRaw) ? teamRaw : null,
    role: isMiniPosition(roleRaw) ? roleRaw : null,
  }
}

export function buildMatchShareUrl(
  origin: string,
  matchId: string,
  selection: { team: TeamSide | null; role: MiniPosition | null },
): string {
  const base = `${origin.replace(/\/$/, '')}/match/${matchId}`
  const q = new URLSearchParams()
  if (selection.team) q.set('team', selection.team)
  if (selection.role) q.set('role', selection.role)
  const qs = q.toString()
  return qs ? `${base}?${qs}` : base
}
