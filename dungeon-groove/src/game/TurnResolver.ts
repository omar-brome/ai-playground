import type { Entity } from './types'
import { GridWorld } from './GridWorld'

export interface TurnResult {
  ok: boolean
  playerDamaged: boolean
  playerHp: number
  killedEnemyIds: string[]
}

function stepToward(actor: Entity, target: Entity): { dx: number; dy: number } {
  const dx = target.x - actor.x
  const dy = target.y - actor.y
  if (dx === 0 && dy === 0) return { dx: 0, dy: 0 }
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { dx: dx === 0 ? 0 : dx > 0 ? 1 : -1, dy: 0 }
  }
  return { dx: 0, dy: dy > 0 ? 1 : -1 }
}

function tryMoveEnemy(world: GridWorld, enemy: Entity, dx: number, dy: number): void {
  const nx = enemy.x + dx
  const ny = enemy.y + dy
  const player = world.getPlayer()
  if (!player) return

  if (!world.inBounds(nx, ny) || world.isWall(nx, ny)) return

  if (nx === player.x && ny === player.y) {
    player.hp -= 1
    return
  }

  const occ = world.entityAt(nx, ny)
  if (occ && occ.kind !== 'player') return

  world.moveEntity(enemy.id, nx, ny)
}

/** Simulation beat index (increments each successful player turn); skeletons act only on even beats. */
export function resolvePlayerTurn(world: GridWorld, pdx: number, pdy: number, beatIndex: number): TurnResult {
  const killedEnemyIds: string[] = []
  let playerDamaged = false
  const player = world.getPlayer()
  if (!player || player.hp <= 0) {
    return { ok: false, playerDamaged: false, playerHp: player?.hp ?? 0, killedEnemyIds }
  }

  const nx = player.x + pdx
  const ny = player.y + pdy

  if (!world.inBounds(nx, ny) || world.isWall(nx, ny)) {
    return { ok: false, playerDamaged: false, playerHp: player.hp, killedEnemyIds }
  }

  const target = world.entityAt(nx, ny)
  if (target && target.kind !== 'player') {
    target.hp -= 1
    if (target.hp <= 0) {
      killedEnemyIds.push(target.id)
      world.removeEntity(target.id)
    }
    world.moveEntity(player.id, nx, ny)
  } else if (!target) {
    world.moveEntity(player.id, nx, ny)
  } else {
    return { ok: false, playerDamaged: false, playerHp: player.hp, killedEnemyIds }
  }

  const enemies = [...world.listEnemies()].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.x - b.x
  })

  for (const enemy of enemies) {
    const fresh = world.entityAt(enemy.x, enemy.y)
    if (!fresh || fresh.kind === 'player') continue

    if (fresh.kind === 'skeleton' && beatIndex % 2 !== 0) continue

    const pl = world.getPlayer()
    if (!pl || pl.hp <= 0) break

    const { dx, dy } = stepToward(fresh, pl)
    const hpBefore = pl.hp
    tryMoveEnemy(world, fresh, dx, dy)
    if (pl.hp < hpBefore) playerDamaged = true
  }

  const pAfter = world.getPlayer()
  return {
    ok: true,
    playerDamaged,
    playerHp: pAfter?.hp ?? 0,
    killedEnemyIds,
  }
}
