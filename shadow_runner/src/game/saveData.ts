import type { Ability, CampaignLevelId, CustomLevelSlot, SaveData } from './types'

const STORAGE_KEY = 'shadow_runner_save_v1'

export const abilityLabels: Record<Ability, string> = {
  dash: 'Shadow Dash',
  doubleJump: 'Echo Jump',
  phase: 'Phase Step',
}

export function createDefaultSave(): SaveData {
  return {
    version: 1,
    muted: false,
    completedLevels: {},
    bestTimes: {},
    collectedShards: {},
    abilities: {
      dash: false,
      doubleJump: false,
      phase: false,
    },
    customLevels: [],
  }
}

function normalizeSave(raw: Partial<SaveData>): SaveData {
  const defaults = createDefaultSave()
  return {
    ...defaults,
    ...raw,
    version: 1,
    completedLevels: { ...defaults.completedLevels, ...(raw.completedLevels ?? {}) },
    bestTimes: { ...defaults.bestTimes, ...(raw.bestTimes ?? {}) },
    collectedShards: { ...defaults.collectedShards, ...(raw.collectedShards ?? {}) },
    abilities: { ...defaults.abilities, ...(raw.abilities ?? {}) },
    customLevels: Array.isArray(raw.customLevels) ? raw.customLevels : [],
  }
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultSave()
    return normalizeSave(JSON.parse(raw) as Partial<SaveData>)
  } catch {
    return createDefaultSave()
  }
}

export function writeSave(save: SaveData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
}

export function updateSave(mutator: (save: SaveData) => void): SaveData {
  const save = loadSave()
  mutator(save)
  writeSave(save)
  return save
}

export function markLevelComplete(levelId: CampaignLevelId | 'boss', timeMs: number): SaveData {
  return updateSave((save) => {
    save.completedLevels[levelId] = true
    const previous = save.bestTimes[levelId]
    if (!previous || timeMs < previous) save.bestTimes[levelId] = timeMs
  })
}

export function unlockAbility(ability: Ability): SaveData {
  return updateSave((save) => {
    save.abilities[ability] = true
  })
}

export function collectShard(shardKey: string): SaveData {
  return updateSave((save) => {
    save.collectedShards[shardKey] = true
  })
}

export function setMuted(muted: boolean): SaveData {
  return updateSave((save) => {
    save.muted = muted
  })
}

export function upsertCustomLevel(slot: CustomLevelSlot): SaveData {
  return updateSave((save) => {
    const withoutOld = save.customLevels.filter((item) => item.id !== slot.id)
    save.customLevels = [slot, ...withoutOld].slice(0, 12)
  })
}

export function deleteCustomLevel(slotId: string): SaveData {
  return updateSave((save) => {
    save.customLevels = save.customLevels.filter((item) => item.id !== slotId)
  })
}

export function resetProgress(): SaveData {
  const save = createDefaultSave()
  writeSave(save)
  return save
}
