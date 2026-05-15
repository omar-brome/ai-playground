import type { EnemyKind, LevelDef, TileKind, Vec2 } from './types'

/** Deterministic PRNG in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Room {
  x: number
  y: number
  w: number
  h: number
}

function overlap(a: Room, b: Room, pad: number): boolean {
  return !(
    a.x + a.w + pad <= b.x ||
    b.x + b.w + pad <= a.x ||
    a.y + a.h + pad <= b.y ||
    b.y + b.h + pad <= a.y
  )
}

function carveRoom(tiles: TileKind[][], r: Room): void {
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
        tiles[y][x] = 'floor'
      }
    }
  }
}

function carveThickLine(tiles: TileKind[][], x0: number, y0: number, x1: number, y1: number, thick: number): void {
  const H = tiles.length
  const W = tiles[0].length
  let x = x0
  let y = y0
  const half = Math.floor(thick / 2)

  const stamp = (cx: number, cy: number) => {
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const nx = cx + dx
        const ny = cy + dy
        if (nx > 0 && nx < W - 1 && ny > 0 && ny < H - 1) tiles[ny][nx] = 'floor'
      }
    }
  }

  while (x !== x1) {
    stamp(x, y)
    x += x < x1 ? 1 : -1
  }
  while (y !== y1) {
    stamp(x, y)
    y += y < y1 ? 1 : -1
  }
  stamp(x1, y1)
}

function center(r: Room): Vec2 {
  return { x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) }
}

/** All floor tiles 4-connected to (sx,sy). */
function reachableFloors(tiles: TileKind[][], sx: number, sy: number): Set<string> {
  const H = tiles.length
  const W = tiles[0].length
  const key = (px: number, py: number) => `${px},${py}`
  const seen = new Set<string>()
  const q: Vec2[] = []
  if (tiles[sy]?.[sx] !== 'floor') return seen
  q.push({ x: sx, y: sy })
  seen.add(key(sx, sy))
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ]
  while (q.length) {
    const c = q.pop()!
    for (const d of dirs) {
      const nx = c.x + d.x
      const ny = c.y + d.y
      const k = key(nx, ny)
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k)) continue
      if (tiles[ny][nx] !== 'floor') continue
      seen.add(k)
      q.push({ x: nx, y: ny })
    }
  }
  return seen
}

function wallOrphans(tiles: TileKind[][], start: Vec2): void {
  const keep = reachableFloors(tiles, start.x, start.y)
  const H = tiles.length
  const W = tiles[0].length
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (tiles[y][x] === 'floor' && !keep.has(`${x},${y}`)) {
        tiles[y][x] = 'wall'
      }
    }
  }
}

function listFloorTiles(_tiles: TileKind[][], reachable: Set<string>): Vec2[] {
  const out: Vec2[] = []
  for (const k of reachable) {
    const [xs, ys] = k.split(',')
    out.push({ x: Number(xs), y: Number(ys) })
  }
  return out
}

function minManhattan(px: number, py: number, positions: Vec2[]): number {
  if (positions.length === 0) return 99
  return Math.min(...positions.map((q) => Math.abs(q.x - px) + Math.abs(q.y - py)))
}

/**
 * Builds a new combat layout: random non-overlapping rooms, thick corridors, orphan trim, then spawns.
 */
export function generateProceduralLevel(seed: number): LevelDef {
  const rnd = mulberry32(seed)

  const width = 15 + 2 * Math.floor(rnd() * 5)
  const height = 11 + 2 * Math.floor(rnd() * 4)

  const tiles: TileKind[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 'wall' as TileKind),
  )

  const targetRooms = 5 + Math.floor(rnd() * 4)
  const rooms: Room[] = []
  let guard = 400
  while (rooms.length < targetRooms && guard-- > 0) {
    const rw = 3 + 2 * Math.floor(rnd() * 4)
    const rh = 3 + 2 * Math.floor(rnd() * 3)
    const rx = 1 + Math.floor(rnd() * Math.max(1, width - rw - 2))
    const ry = 1 + Math.floor(rnd() * Math.max(1, height - rh - 2))
    const cand: Room = { x: rx, y: ry, w: rw, h: rh }
    if (rooms.some((r) => overlap(r, cand, 2))) continue
    carveRoom(tiles, cand)
    rooms.push(cand)
  }

  if (rooms.length < 2) {
    const rw = Math.min(9, width - 4)
    const rh = Math.min(7, height - 4)
    const rx = Math.floor((width - rw) / 2)
    const ry = Math.floor((height - rh) / 2)
    rooms.length = 0
    rooms.push({ x: rx, y: ry, w: rw, h: rh })
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        tiles[y][x] = 'wall'
      }
    }
    carveRoom(tiles, rooms[0])
  }

  for (let i = rooms.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[rooms[i], rooms[j]] = [rooms[j], rooms[i]]
  }

  for (let i = 0; i < rooms.length - 1; i++) {
    const a = center(rooms[i])
    const b = center(rooms[i + 1])
    const thick = rnd() < 0.35 ? 2 : 3
    carveThickLine(tiles, a.x, a.y, b.x, a.y, thick)
    carveThickLine(tiles, b.x, a.y, b.x, b.y, thick)
  }

  for (let x = 0; x < width; x++) {
    tiles[0][x] = 'wall'
    tiles[height - 1][x] = 'wall'
  }
  for (let y = 0; y < height; y++) {
    tiles[y][0] = 'wall'
    tiles[y][width - 1] = 'wall'
  }

  const mainRoom = rooms.reduce((best, r) => (r.w * r.h > best.w * best.h ? r : best), rooms[0])
  let playerStart = center(mainRoom)
  if (tiles[playerStart.y]?.[playerStart.x] !== 'floor') {
    playerStart = center(rooms[0])
  }

  wallOrphans(tiles, playerStart)

  const reach = reachableFloors(tiles, playerStart.x, playerStart.y)
  const floors = listFloorTiles(tiles, reach).filter((p) => p.x !== playerStart.x || p.y !== playerStart.y)

  const enemyCount = Math.min(8, 2 + Math.floor(rnd() * 5) + Math.floor(floors.length / 55))
  const enemies: Array<{ kind: EnemyKind; x: number; y: number }> = []
  const placed: Vec2[] = []

  let tries = 0
  while (enemies.length < enemyCount && tries++ < 500) {
    const pick = floors[Math.floor(rnd() * floors.length)]
    if (!pick) break
    if (Math.abs(pick.x - playerStart.x) + Math.abs(pick.y - playerStart.y) < 4) continue
    if (minManhattan(pick.x, pick.y, placed) < 2) continue
    if (minManhattan(pick.x, pick.y, [{ x: playerStart.x, y: playerStart.y }]) < 4) continue

    const kind: EnemyKind = rnd() < 0.55 ? 'slime' : 'skeleton'
    enemies.push({ kind, x: pick.x, y: pick.y })
    placed.push({ ...pick })
  }

  if (enemies.length === 0 && floors.length > 0) {
    let best = floors[0]
    let bestD = -1
    for (const f of floors) {
      const md = Math.abs(f.x - playerStart.x) + Math.abs(f.y - playerStart.y)
      if (md > bestD) {
        bestD = md
        best = f
      }
    }
    enemies.push({ kind: 'slime', x: best.x, y: best.y })
  }

  const title = `∞ · Seed ${(seed >>> 0) % 100000}`

  return {
    width,
    height,
    tiles,
    playerStart,
    enemies,
    title,
  }
}
