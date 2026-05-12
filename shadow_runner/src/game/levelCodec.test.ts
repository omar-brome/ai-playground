import { describe, expect, it } from 'vitest'
import { exportLevel, importLevel, validateLevelDefinition } from './levelCodec'
import { campaignLevels } from './levels'

describe('level codec', () => {
  it('round trips exported campaign level data', () => {
    const exported = exportLevel(campaignLevels[0])
    const imported = importLevel(exported)
    expect(imported.title).toBe(campaignLevels[0].title)
    expect(imported.platforms.length).toBeGreaterThan(0)
  })

  it('rejects invalid custom level data', () => {
    const issues = validateLevelDefinition({
      ...campaignLevels[0],
      width: 100,
      platforms: [],
    })
    expect(issues.length).toBeGreaterThanOrEqual(2)
  })
})
