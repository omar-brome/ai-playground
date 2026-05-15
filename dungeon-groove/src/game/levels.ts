import type { EnemyKind, LevelDef, TileKind, Vec2 } from './types'

function parseAscii(rows: string[], title?: string): LevelDef {
  const height = rows.length
  const width = rows[0]?.length ?? 0
  const tiles: TileKind[][] = []
  let playerStart: Vec2 = { x: 1, y: 1 }
  const enemies: Array<{ kind: EnemyKind; x: number; y: number }> = []

  for (let y = 0; y < height; y++) {
    const line = rows[y]
    if (line.length !== width) {
      throw new Error(`Level row ${y} length ${line.length} !== width ${width}`)
    }
    const row: TileKind[] = []
    for (let x = 0; x < width; x++) {
      const ch = line[x]
      if (ch === '#') {
        row.push('wall')
      } else if (ch === '.' || ch === ' ') {
        row.push('floor')
      } else if (ch === '@') {
        row.push('floor')
        playerStart = { x, y }
      } else if (ch === 's' || ch === 'S') {
        row.push('floor')
        enemies.push({ kind: 'slime', x, y })
      } else if (ch === 'k' || ch === 'K') {
        row.push('floor')
        enemies.push({ kind: 'skeleton', x, y })
      } else {
        row.push('floor')
      }
    }
    tiles.push(row)
  }

  const def: LevelDef = { width, height, tiles, playerStart, enemies }
  if (title !== undefined) def.title = title
  return def
}

const VAULT_I = [
  '###########',
  '#.........#',
  '#.##...##.#',
  '#....s....#',
  '#...##....#',
  '#..k....s.#',
  '#.........#',
  '#....@....#',
  '###########',
]

const VAULT_II = [
  '###############',
  '#.............#',
  '#.###.....###.#',
  '#...s.....s...#',
  '###.........###',
  '#....k...k....#',
  '#.....@.......#',
  '###############',
]

const VAULT_III = [
  '#################',
  '#s..............#',
  '#.######.######.#',
  '#.......@.......#',
  '#..k......k.....#',
  '#...............#',
  '#################',
]

const VAULT_IV = [
  '#############',
  '#k..........#',
  '#.#.#.#.#.#.#',
  '#...s...s...#',
  '#.#.#.#.#.#.#',
  '#....@......#',
  '#############',
]

/** Ordered campaign floors (ASCII: @ player, s slime, k skeleton, # wall, . floor). */
export const DUNGEON_LEVELS: LevelDef[] = [
  parseAscii(VAULT_I, 'I · Echo Hall'),
  parseAscii(VAULT_II, 'II · Twin Slime Gallery'),
  parseAscii(VAULT_III, 'III · Split Corridors'),
  parseAscii(VAULT_IV, 'IV · Rattle Grid'),
]

/** @deprecated Use DUNGEON_LEVELS[0] */
export const LEVEL_01 = DUNGEON_LEVELS[0]
