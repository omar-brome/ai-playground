import { useState } from 'react'
import type { Match, MiniPosition, TeamSide } from '../types/domain'
import { PositionNode } from './PositionNode'
import { ROLE_QUOTAS } from '../utils/roleQuotas'

type Props = {
  match: Match
  selectedTeam: TeamSide | null
  selectedRole: MiniPosition | null
  onSelectTeam: (team: string) => void
  onSelectTeamRole: (team: TeamSide, role: MiniPosition) => void
}

const labels: Record<string, string> = {
  team1: 'Team 1',
  team2: 'Team 2',
}

const layoutMini: Record<string, [number, number]> = {
  team1: [43, 14],
  team2: [57, 14],
}

const formationCoords: Record<TeamSide, Record<MiniPosition, [number, number]>> = {
  team1: {
    goalkeeper: [11, 60],
    midfielder: [29, 49],
    attacker: [29, 71],
  },
  team2: {
    goalkeeper: [89, 60],
    midfielder: [71, 49],
    attacker: [71, 71],
  },
}

function roleShort(role: MiniPosition) {
  if (role === 'goalkeeper') return 'GK'
  if (role === 'midfielder') return 'MID'
  return 'ATT'
}

export function SoccerField({ match, selectedTeam, selectedRole, onSelectTeam, onSelectTeamRole }: Props) {
  const layout = layoutMini
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 2400)
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-[#0f6b34] p-2">
      <svg viewBox="0 0 100 120" className="w-full" role="img" aria-label="Mini football field teams">
        <rect x="2" y="2" width="96" height="116" fill="#0f6b34" stroke="white" strokeWidth="1" />
        <line x1="50" y1="2" x2="50" y2="118" stroke="white" strokeWidth="1" />
        <circle cx="50" cy="60" r="10" fill="none" stroke="white" strokeWidth="1" />
        <rect x="2" y="38" width="14" height="44" fill="none" stroke="white" strokeWidth="1" />
        <rect x="84" y="38" width="14" height="44" fill="none" stroke="white" strokeWidth="1" />
        {(Object.keys(formationCoords) as TeamSide[]).flatMap((team) =>
          (Object.keys(formationCoords[team]) as MiniPosition[]).map((role) => {
            const [x, y] = formationCoords[team][role]
            const rolePlayers = match.spots[team].booked.filter((p) => p.position === role)
            const bookedCount = rolePlayers.length
            const quota = ROLE_QUOTAS[role]
            const left = Math.max(0, quota - bookedCount)
            const isSelected = selectedTeam === team && selectedRole === role
            const isFull = left <= 0
            const firstNames = rolePlayers
              .map((player) => player.playerName.split(' ')[0])
              .slice(0, 2)
              .join(', ')
            return (
              <g
                key={`${team}-${role}`}
                onMouseEnter={() => {
                  if (rolePlayers.length === 0) return
                  const details = rolePlayers.map((p) => `${p.playerName} (${p.phone})`).join(' • ')
                  showToast(details)
                }}
                onClick={() => {
                  if (isFull) {
                    const details = rolePlayers.map((p) => `${p.playerName} (${p.phone})`).join(' • ')
                    showToast(details || 'Role is fully booked.')
                    return
                  }
                  onSelectTeamRole(team, role)
                }}
                style={{ cursor: isFull ? 'not-allowed' : 'pointer' }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={4.3}
                  fill={isFull ? '#6b7280' : team === 'team1' ? '#2563eb' : '#ef4444'}
                  stroke="white"
                  strokeWidth={isSelected ? 1.4 : 0.8}
                />
                <text x={x} y={y + 8.2} textAnchor="middle" fill="white" fontSize="2.5">
                  {roleShort(role)} {bookedCount}/{quota}
                </text>
                {firstNames ? (
                  <text x={x} y={y + 11.8} textAnchor="middle" fill="white" fontSize="2.1">
                    {firstNames}
                  </text>
                ) : null}
              </g>
            )
          }),
        )}
        {Object.entries(match.spots).map(([position, spot]) => {
          const [x, y] = layout[position] ?? [50, 80]
          const isBooked = spot.booked.length >= spot.total
          const state = isBooked ? 'booked' : 'available'
          const tooltip = spot.booked[0]?.playerName
          return (
            <PositionNode
              key={position}
              x={x}
              y={y}
              label={labels[position] ?? position}
              state={state}
              selected={selectedTeam === position}
              onSelect={() => onSelectTeam(position)}
              tooltip={tooltip}
              fillColor={state === 'booked' ? '#6b7280' : position === 'team1' ? '#2563eb' : '#ef4444'}
            />
          )
        })}
      </svg>
      {toastMessage ? (
        <div className="pointer-events-none mt-2 rounded-xl border border-white/15 bg-black/75 p-2 text-xs text-white">
          {toastMessage}
        </div>
      ) : null}
    </div>
  )
}
