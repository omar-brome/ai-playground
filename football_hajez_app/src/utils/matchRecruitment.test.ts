import { describe, expect, it } from 'vitest'
import type { BookedPlayer, Match } from '../types/domain'
import { aggregateRoleNeeds } from './matchRecruitment'
import { ROLE_QUOTAS } from './roleQuotas'

function player(partial: Partial<BookedPlayer> & Pick<BookedPlayer, 'bookingId' | 'playerName' | 'phone'>): BookedPlayer {
  return {
    status: 'confirmed',
    position: 'attacker',
    ...partial,
  }
}

const emptySpots = () => ({
  team1: { total: 5, booked: [] as BookedPlayer[] },
  team2: { total: 5, booked: [] as BookedPlayer[] },
})

describe('aggregateRoleNeeds', () => {
  it('returns empty when all role slots are filled on both teams', () => {
    const spots = emptySpots()
    for (let i = 0; i < ROLE_QUOTAS.goalkeeper; i++) {
      spots.team1.booked.push(player({ bookingId: `gk1-${i}`, playerName: 'G', phone: `+9611${i}`, position: 'goalkeeper' }))
      spots.team2.booked.push(player({ bookingId: `gk2-${i}`, playerName: 'G', phone: `+9612${i}`, position: 'goalkeeper' }))
    }
    for (let i = 0; i < ROLE_QUOTAS.midfielder; i++) {
      spots.team1.booked.push(player({ bookingId: `m1-${i}`, playerName: 'M', phone: `+9613${i}`, position: 'midfielder' }))
      spots.team2.booked.push(player({ bookingId: `m2-${i}`, playerName: 'M', phone: `+9614${i}`, position: 'midfielder' }))
    }
    for (let i = 0; i < ROLE_QUOTAS.attacker; i++) {
      spots.team1.booked.push(player({ bookingId: `a1-${i}`, playerName: 'A', phone: `+9615${i}`, position: 'attacker' }))
      spots.team2.booked.push(player({ bookingId: `a2-${i}`, playerName: 'A', phone: `+9616${i}`, position: 'attacker' }))
    }
    const match: Match = {
      id: 'm',
      venueId: '4b',
      date: '2026-06-01',
      time: '18:00',
      type: '5-a-side',
      price: 300000,
      spots,
    }
    expect(aggregateRoleNeeds(match)).toEqual([])
  })

  it('aggregates missing attackers across teams', () => {
    const spots = emptySpots()
    spots.team1.booked.push(
      player({ bookingId: 'a1', playerName: 'A', phone: '+9611', position: 'attacker' }),
      player({ bookingId: 'a2', playerName: 'B', phone: '+9612', position: 'attacker' }),
    )
    spots.team2.booked.push(player({ bookingId: 'a3', playerName: 'C', phone: '+9613', position: 'attacker' }))
    const match: Match = {
      id: 'm',
      venueId: '4b',
      date: '2026-06-01',
      time: '18:00',
      type: '5-a-side',
      price: 300000,
      spots,
    }
    const needs = aggregateRoleNeeds(match)
    const att = needs.find((n) => n.role === 'attacker')
    expect(att?.needed).toBe(1)
  })
})
