import type { Entity, LevelDef, TileKind } from './types'

let entityId = 0
function nextId(prefix: string): string {
  entityId += 1
  return `${prefix}_${entityId}`
}

export class GridWorld {
  readonly width: number
  readonly height: number
  private tiles: TileKind[][]
  private entities = new Map<string, Entity>()
  private gridOccupant = new Map<string, string>()

  constructor(level: LevelDef) {
    this.width = level.width
    this.height = level.height
    this.tiles = level.tiles.map((row) => [...row])

    const player: Entity = {
      id: nextId('player'),
      kind: 'player',
      x: level.playerStart.x,
      y: level.playerStart.y,
      hp: 3,
    }
    this.addEntity(player)

    for (const e of level.enemies) {
      const enemy: Entity = {
        id: nextId(e.kind),
        kind: e.kind,
        x: e.x,
        y: e.y,
        hp: 1,
      }
      this.addEntity(enemy)
    }
  }

  static key(x: number, y: number): string {
    return `${x},${y}`
  }

  tileAt(x: number, y: number): TileKind | undefined {
    return this.tiles[y]?.[x]
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height
  }

  isWall(x: number, y: number): boolean {
    return this.tileAt(x, y) === 'wall'
  }

  getPlayer(): Entity | undefined {
    for (const e of this.entities.values()) {
      if (e.kind === 'player') return e
    }
    return undefined
  }

  listEnemies(): Entity[] {
    return [...this.entities.values()].filter((e) => e.kind !== 'player')
  }

  entityAt(x: number, y: number): Entity | undefined {
    const id = this.gridOccupant.get(GridWorld.key(x, y))
    return id ? this.entities.get(id) : undefined
  }

  private addEntity(e: Entity): void {
    this.entities.set(e.id, e)
    this.gridOccupant.set(GridWorld.key(e.x, e.y), e.id)
  }

  removeEntity(id: string): void {
    const e = this.entities.get(id)
    if (!e) return
    this.gridOccupant.delete(GridWorld.key(e.x, e.y))
    this.entities.delete(id)
  }

  moveEntity(id: string, nx: number, ny: number): void {
    const e = this.entities.get(id)
    if (!e) return
    this.gridOccupant.delete(GridWorld.key(e.x, e.y))
    e.x = nx
    e.y = ny
    this.gridOccupant.set(GridWorld.key(nx, ny), id)
  }

  /** Clone minimal state for rendering / debug. */
  snapshotEntities(): Entity[] {
    return [...this.entities.values()].map((e) => ({ ...e }))
  }

  allEnemiesDead(): boolean {
    return this.listEnemies().length === 0
  }
}
