export interface Vec2 {
  x: number
  y: number
}

export type TileKind = 'floor' | 'wall'

export type EnemyKind = 'slime' | 'skeleton'

export interface Entity {
  id: string
  kind: 'player' | EnemyKind
  x: number
  y: number
  hp: number
}

export interface LevelDef {
  width: number
  height: number
  tiles: TileKind[][]
  playerStart: Vec2
  enemies: Array<{ kind: EnemyKind; x: number; y: number }>
  /** Short label for HUD / overlays. */
  title?: string
}
