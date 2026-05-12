import type { LevelDefinition } from './types'

const CUSTOM_LEVEL_VERSION = 1

export type ExportedLevel = {
  version: number
  exportedAt: string
  level: LevelDefinition
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function validateLevelDefinition(level: LevelDefinition): string[] {
  const issues: string[] = []
  if (!level.id) issues.push('Missing level id.')
  if (!level.title) issues.push('Missing title.')
  if (!isNumber(level.width) || level.width < 800) issues.push('Width must be at least 800.')
  if (!isNumber(level.height) || level.height < 480) issues.push('Height must be at least 480.')
  if (!isNumber(level.spawn?.x) || !isNumber(level.spawn?.y)) issues.push('Spawn point is invalid.')
  if (!Array.isArray(level.platforms) || level.platforms.length === 0) issues.push('At least one platform is required.')
  if (!level.exit || !isNumber(level.exit.x) || !isNumber(level.exit.y)) issues.push('Exit is invalid.')
  return issues
}

export function exportLevel(level: LevelDefinition): string {
  const payload: ExportedLevel = {
    version: CUSTOM_LEVEL_VERSION,
    exportedAt: new Date().toISOString(),
    level,
  }
  return JSON.stringify(payload, null, 2)
}

export function importLevel(raw: string): LevelDefinition {
  const parsed = JSON.parse(raw) as Partial<ExportedLevel> | LevelDefinition
  const level = 'level' in parsed ? parsed.level : parsed
  const issues = validateLevelDefinition(level as LevelDefinition)
  if (issues.length > 0) {
    throw new Error(issues.join(' '))
  }
  return level as LevelDefinition
}

export function cloneLevel(level: LevelDefinition): LevelDefinition {
  return JSON.parse(JSON.stringify(level)) as LevelDefinition
}
