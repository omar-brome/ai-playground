import type { CampaignLevelId, LevelDefinition, LevelId } from './types'

export const campaignLevels: LevelDefinition[] = [
  {
    id: 'rooftops',
    title: 'Rooftop Wake',
    subtitle: 'Learn the flow of the neon rooftops.',
    theme: 'rooftop',
    width: 2600,
    height: 760,
    spawn: { x: 110, y: 560 },
    unlocksOnComplete: ['dash'],
    platforms: [
      { x: 0, y: 700, width: 520, height: 60 },
      { x: 590, y: 650, width: 280, height: 36 },
      { x: 960, y: 590, width: 280, height: 36 },
      { x: 1320, y: 650, width: 360, height: 36 },
      { x: 1780, y: 610, width: 280, height: 36 },
      { x: 2200, y: 700, width: 460, height: 60 },
      { x: 420, y: 520, width: 170, height: 28 },
      { x: 1540, y: 480, width: 170, height: 28 },
    ],
    movingPlatforms: [{ x: 1710, y: 520, width: 130, height: 24, axis: 'x', distance: 230, durationMs: 2200 }],
    hazards: [
      { x: 540, y: 720, width: 80, height: 40 },
      { x: 890, y: 720, width: 90, height: 40 },
      { x: 1690, y: 720, width: 100, height: 40 },
      { x: 2050, y: 720, width: 130, height: 40 },
    ],
    shards: [
      { id: 'r1', x: 450, y: 470 },
      { id: 'r2', x: 760, y: 590 },
      { id: 'r3', x: 1100, y: 535 },
      { id: 'r4', x: 1585, y: 430 },
      { id: 'r5', x: 2310, y: 645 },
    ],
    enemies: [
      { id: 'drone-a', kind: 'drone', x: 1040, y: 548, patrolDistance: 140, speed: 70 },
      { id: 'turret-a', kind: 'turret', x: 1440, y: 610 },
    ],
    signs: [
      { x: 130, y: 640, text: 'Move: A/D or arrows. Jump: Space.' },
      { x: 620, y: 595, text: 'Hold jump for height. Land clean.' },
      { x: 1360, y: 595, text: 'Shards unlock your route through the city.' },
    ],
    checkpoints: [{ id: 'roof-mid', x: 1320, y: 590 }],
    exit: { x: 2460, y: 610, width: 70, height: 90 },
  },
  {
    id: 'factory',
    title: 'Glass Factory',
    subtitle: 'Use Shadow Dash to cross the machine floor.',
    theme: 'factory',
    width: 3000,
    height: 820,
    spawn: { x: 100, y: 600 },
    requiredAbilities: ['dash'],
    unlocksOnComplete: ['doubleJump'],
    platforms: [
      { x: 0, y: 760, width: 430, height: 60 },
      { x: 560, y: 710, width: 250, height: 34 },
      { x: 920, y: 650, width: 220, height: 34 },
      { x: 1280, y: 590, width: 260, height: 34 },
      { x: 1660, y: 690, width: 250, height: 34 },
      { x: 2050, y: 610, width: 240, height: 34 },
      { x: 2460, y: 760, width: 590, height: 60 },
      { x: 1810, y: 470, width: 150, height: 26 },
      { x: 2320, y: 500, width: 140, height: 26 },
    ],
    movingPlatforms: [
      { x: 430, y: 625, width: 120, height: 24, axis: 'y', distance: 120, durationMs: 2100 },
      { x: 2290, y: 650, width: 130, height: 24, axis: 'x', distance: 210, durationMs: 1900 },
    ],
    hazards: [
      { x: 430, y: 780, width: 140, height: 40 },
      { x: 820, y: 780, width: 120, height: 40 },
      { x: 1150, y: 780, width: 130, height: 40 },
      { x: 1540, y: 780, width: 120, height: 40 },
      { x: 1920, y: 780, width: 140, height: 40 },
      { x: 1260, y: 485, width: 28, height: 110, movement: { axis: 'x', distance: 240, durationMs: 2600 } },
    ],
    shards: [
      { id: 'f1', x: 625, y: 655 },
      { id: 'f2', x: 1010, y: 595 },
      { id: 'f3', x: 1360, y: 535 },
      { id: 'f4', x: 1860, y: 420 },
      { id: 'f5', x: 2365, y: 455 },
      { id: 'f6', x: 2690, y: 705 },
    ],
    enemies: [
      { id: 'turret-b', kind: 'turret', x: 970, y: 610 },
      { id: 'drone-b', kind: 'drone', x: 1730, y: 646, patrolDistance: 160, speed: 85 },
      { id: 'chaser-b', kind: 'chaser', x: 2570, y: 704, speed: 95 },
    ],
    signs: [
      { x: 120, y: 700, text: 'Shift: Shadow Dash. It refreshes on the ground.' },
      { x: 1280, y: 530, text: 'Moving lasers are deadly unless you phase later.' },
    ],
    checkpoints: [
      { id: 'factory-a', x: 1280, y: 530 },
      { id: 'factory-b', x: 2180, y: 550 },
    ],
    exit: { x: 2860, y: 670, width: 70, height: 90 },
  },
  {
    id: 'tower',
    title: 'Signal Tower',
    subtitle: 'Chain double jumps and steal the phase core.',
    theme: 'tower',
    width: 2500,
    height: 1100,
    spawn: { x: 120, y: 930 },
    requiredAbilities: ['dash', 'doubleJump'],
    unlocksOnComplete: ['phase'],
    platforms: [
      { x: 0, y: 1030, width: 360, height: 60 },
      { x: 500, y: 950, width: 230, height: 34 },
      { x: 860, y: 860, width: 220, height: 34 },
      { x: 1180, y: 760, width: 220, height: 34 },
      { x: 1540, y: 650, width: 220, height: 34 },
      { x: 1880, y: 540, width: 220, height: 34 },
      { x: 2180, y: 420, width: 260, height: 34 },
      { x: 1680, y: 310, width: 160, height: 28 },
      { x: 1240, y: 240, width: 160, height: 28 },
      { x: 760, y: 300, width: 180, height: 28 },
      { x: 300, y: 400, width: 180, height: 28 },
    ],
    movingPlatforms: [
      { x: 360, y: 850, width: 120, height: 24, axis: 'y', distance: 160, durationMs: 2300 },
      { x: 1980, y: 300, width: 120, height: 24, axis: 'x', distance: 210, durationMs: 2500 },
    ],
    hazards: [
      { x: 360, y: 1060, width: 120, height: 40 },
      { x: 740, y: 1060, width: 140, height: 40 },
      { x: 1080, y: 1060, width: 160, height: 40 },
      { x: 1440, y: 1060, width: 160, height: 40 },
      { x: 1840, y: 1060, width: 180, height: 40 },
      { x: 2100, y: 620, width: 28, height: 170, movement: { axis: 'y', distance: 190, durationMs: 2100 } },
    ],
    shards: [
      { id: 't1', x: 600, y: 890 },
      { id: 't2', x: 960, y: 800 },
      { id: 't3', x: 1280, y: 700 },
      { id: 't4', x: 1640, y: 590 },
      { id: 't5', x: 2260, y: 360 },
      { id: 't6', x: 810, y: 245 },
      { id: 't7', x: 350, y: 345 },
    ],
    enemies: [
      { id: 'drone-c', kind: 'drone', x: 880, y: 818, patrolDistance: 170, speed: 85 },
      { id: 'turret-c', kind: 'turret', x: 1540, y: 610 },
      { id: 'chaser-c', kind: 'chaser', x: 2260, y: 380, speed: 105 },
    ],
    signs: [
      { x: 120, y: 970, text: 'Double jump lets you recover after a dash.' },
      { x: 2220, y: 360, text: 'Reach the tower core to unlock Phase Step.' },
    ],
    checkpoints: [
      { id: 'tower-a', x: 1180, y: 705 },
      { id: 'tower-b', x: 2180, y: 365 },
    ],
    abilityPickups: [{ ability: 'phase', x: 1290, y: 185 }],
    exit: { x: 260, y: 310, width: 70, height: 90 },
  },
]

export const bossLevel: LevelDefinition = {
  id: 'boss',
  title: 'The Sentinel',
  subtitle: 'Break the city core.',
  theme: 'boss',
  width: 1700,
  height: 760,
  spawn: { x: 140, y: 600 },
  requiredAbilities: ['dash', 'doubleJump', 'phase'],
  platforms: [
    { x: 0, y: 700, width: 1700, height: 60 },
    { x: 280, y: 560, width: 190, height: 28 },
    { x: 1240, y: 560, width: 190, height: 28 },
    { x: 710, y: 430, width: 280, height: 28 },
  ],
  hazards: [
    { x: 520, y: 720, width: 110, height: 40 },
    { x: 1080, y: 720, width: 110, height: 40 },
  ],
  shards: [],
  enemies: [],
  signs: [{ x: 100, y: 640, text: 'Hit the exposed core after each attack wave.' }],
  checkpoints: [{ id: 'boss-start', x: 140, y: 640 }],
  exit: { x: 1580, y: 610, width: 70, height: 90 },
}

export function getCampaignLevel(id: CampaignLevelId): LevelDefinition {
  const level = campaignLevels.find((item) => item.id === id)
  if (!level) throw new Error(`Unknown campaign level: ${id}`)
  return level
}

export function getBuiltInLevel(id: LevelId): LevelDefinition | undefined {
  if (id === 'boss') return bossLevel
  return campaignLevels.find((item) => item.id === id)
}
