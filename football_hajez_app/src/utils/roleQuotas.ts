import type { MiniPosition } from '../types/domain'

export const ROLE_QUOTAS: Record<MiniPosition, number> = {
  goalkeeper: 1,
  midfielder: 2,
  attacker: 2,
}
