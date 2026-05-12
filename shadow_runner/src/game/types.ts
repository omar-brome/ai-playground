export type Ability = 'dash' | 'doubleJump' | 'phase'

export type LevelEntityKind = 'tile' | 'hazard' | 'shard' | 'checkpoint' | 'exit'

export type EnemyKind = 'drone' | 'turret' | 'chaser'

export type CampaignLevelId = 'rooftops' | 'factory' | 'tower'

export type LevelId = CampaignLevelId | 'boss' | `custom:${string}`

export type RectSpec = {
  x: number
  y: number
  width: number
  height: number
}

export type PlatformSpec = RectSpec & {
  tint?: number
}

export type MovingPlatformSpec = PlatformSpec & {
  axis: 'x' | 'y'
  distance: number
  durationMs: number
}

export type HazardSpec = RectSpec & {
  movement?: {
    axis: 'x' | 'y'
    distance: number
    durationMs: number
  }
}

export type ShardSpec = {
  id: string
  x: number
  y: number
}

export type CheckpointSpec = {
  id: string
  x: number
  y: number
}

export type ExitSpec = {
  x: number
  y: number
  width: number
  height: number
}

export type EnemySpec = {
  id: string
  kind: EnemyKind
  x: number
  y: number
  patrolDistance?: number
  speed?: number
}

export type SignSpec = {
  x: number
  y: number
  text: string
}

export type AbilityPickupSpec = {
  ability: Ability
  x: number
  y: number
}

export type LevelDefinition = {
  id: LevelId
  title: string
  subtitle: string
  theme: 'rooftop' | 'factory' | 'tower' | 'boss' | 'custom'
  width: number
  height: number
  spawn: { x: number; y: number }
  requiredAbilities?: Ability[]
  unlocksOnComplete?: Ability[]
  platforms: PlatformSpec[]
  movingPlatforms?: MovingPlatformSpec[]
  hazards: HazardSpec[]
  shards: ShardSpec[]
  enemies?: EnemySpec[]
  signs?: SignSpec[]
  checkpoints: CheckpointSpec[]
  abilityPickups?: AbilityPickupSpec[]
  exit: ExitSpec
}

export type CustomLevelSlot = {
  id: string
  title: string
  updatedAt: string
  level: LevelDefinition
}

export type LevelResult = {
  levelId: LevelId
  title: string
  won: boolean
  timeMs: number
  shards: number
  totalShards: number
  deathReason?: string
  unlocked?: Ability[]
}

export type SaveData = {
  version: 1
  muted: boolean
  completedLevels: Partial<Record<CampaignLevelId | 'boss', boolean>>
  bestTimes: Partial<Record<CampaignLevelId | 'boss', number>>
  collectedShards: Record<string, boolean>
  abilities: Record<Ability, boolean>
  customLevels: CustomLevelSlot[]
}
