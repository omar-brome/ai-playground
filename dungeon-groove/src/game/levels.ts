import type { EnemyKind, Entity, LevelDef, TileKind, Vec2 } from './types'

/** Single-room dungeon; row-major strings → tiles[y][x]. */
const ASCII = [
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

function parseAscii(rows: string[]): LevelDef {
  const height = rows.length
  const width = rows[0]?.length ?? 0
  const tiles: TileKind[][] = []
  let playerStart: Vec2 = { x: 1, y: 1 }
  const enemies: Array<{ kind: EnemyKind; x: number; y: number }> = []

  for (let y = 0; y < height; y++) {
    const line = rows[y]
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

  return { width, height, tiles, playerStart, enemies }
}

export const LEVEL_01: LevelDef = parseAscii(ASCII)
