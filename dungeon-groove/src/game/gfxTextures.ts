import Phaser from 'phaser'

const TILE = 32
const SPR = 40

/**
 * Procedural dungeon art (no external assets).
 * Tiles stay 32×32; characters 40×40 then scaled down in the scene for a sharper read.
 */
export function registerDungeonGfx(scene: Phaser.Scene): void {
  makeTileFloor(scene)
  makeTileWall(scene)
  makePlayerGroover(scene)
  makeSlimeEnemy(scene)
  makeSkeletonEnemy(scene)
}

function makeTileFloor(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 })
  const base = 0x1e1830
  const alt = 0x221c34
  const crack = 0x12101c
  g.fillStyle(base, 1)
  g.fillRect(0, 0, TILE, TILE)
  for (let x = 0; x < TILE; x += 4) {
    for (let y = 0; y < TILE; y += 4) {
      if (((x + y) / 4) % 2 === 0) {
        g.fillStyle(alt, 0.45)
        g.fillRect(x, y, 4, 4)
      }
    }
  }
  g.lineStyle(1, crack, 0.55)
  g.beginPath()
  g.moveTo(4, TILE - 3)
  g.lineTo(10, TILE - 8)
  g.lineTo(14, TILE - 4)
  g.strokePath()
  g.lineStyle(1, 0x3d3555, 0.35)
  g.strokeRect(0.5, 0.5, TILE - 1, TILE - 1)
  g.fillStyle(0xffffff, 0.06)
  g.fillRect(1, 1, TILE - 2, 2)
  g.generateTexture('tile-floor', TILE, TILE)
  g.destroy()
}

function makeTileWall(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 })
  const stone = 0x4a4458
  const dark = 0x2c2836
  const hi = 0x7a7388
  const moss = 0x355238
  g.fillStyle(dark, 1)
  g.fillRect(0, 0, TILE, TILE)
  const bricks = [
    { x: 0, y: 0, w: 10, h: 14 },
    { x: 11, y: 0, w: 21, h: 14 },
    { x: 0, y: 15, w: 15, h: 17 },
    { x: 16, y: 15, w: 16, h: 17 },
  ]
  for (const b of bricks) {
    g.fillStyle(stone, 1)
    g.fillRect(b.x, b.y, b.w, b.h)
    g.lineStyle(1, dark, 0.9)
    g.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1)
    g.lineStyle(1, hi, 0.35)
    g.beginPath()
    g.moveTo(b.x + 1, b.y + 2)
    g.lineTo(b.x + b.w - 2, b.y + 2)
    g.strokePath()
  }
  g.fillStyle(moss, 0.55)
  g.fillCircle(6, 22, 3)
  g.fillCircle(24, 8, 2.5)
  g.lineStyle(2, 0x1a1522, 0.85)
  g.strokeRect(1, 1, TILE - 2, TILE - 2)
  g.generateTexture('tile-wall', TILE, TILE)
  g.destroy()
}

/** “Groove Knight” — hooded rhythm wanderer with lute crest (unique silhouette). */
function makePlayerGroover(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 })
  const cx = SPR / 2
  const cloak = 0x3d2b6e
  const hood = 0x5c3d9e
  const trim = 0xffd56b
  const faceShadow = 0x1a0f2e
  const eye = 0x5cffea
  const lute = 0xf0b429

  // Cloak / body (diamond-ish)
  g.fillStyle(cloak, 1)
  g.beginPath()
  g.moveTo(cx, 6)
  g.lineTo(SPR - 5, SPR - 6)
  g.lineTo(cx, SPR - 2)
  g.lineTo(5, SPR - 6)
  g.closePath()
  g.fillPath()
  g.lineStyle(2, trim, 0.65)
  g.strokePath()

  // Hood dome
  g.fillStyle(hood, 1)
  g.fillEllipse(cx, 14, 22, 18)
  g.fillStyle(faceShadow, 1)
  g.fillEllipse(cx, 16, 14, 8)

  // Eyes
  g.fillStyle(eye, 1)
  g.fillCircle(cx - 4, 15, 2.2)
  g.fillCircle(cx + 4, 15, 2.2)
  g.fillStyle(0xffffff, 0.5)
  g.fillCircle(cx - 4.5, 14.5, 0.9)
  g.fillCircle(cx + 3.5, 14.5, 0.9)

  // Crown jewel
  g.fillStyle(trim, 1)
  g.fillTriangle(cx - 3, 7, cx + 3, 7, cx, 3)

  // Lute crest on chest
  g.lineStyle(2, lute, 1)
  g.strokeEllipse(cx, 26, 8, 10)
  g.lineStyle(2, lute, 1)
  g.beginPath()
  g.moveTo(cx + 6, 22)
  g.lineTo(cx + 10, 18)
  g.strokePath()
  g.lineStyle(1, 0xffffff, 0.35)
  g.strokeCircle(cx, 26, 3)

  // Hostile-safe outline: soft glow ring (ally read)
  g.lineStyle(1, 0x9b7aff, 0.4)
  g.strokeCircle(cx, 20, 16)

  g.generateTexture('spr-player', SPR, SPR)
  g.destroy()
}

/** Toxic blob — obvious monster: veins + angry red eyes. */
function makeSlimeEnemy(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 })
  const cx = SPR / 2
  const bodyO = 0x4a8c2a
  const bodyI = 0x7edd3a
  const vein = 0x6b2d8c
  const eye = 0xff2244
  const pupil = 0x1a0508

  g.fillStyle(bodyO, 1)
  g.fillEllipse(cx, 22, 28, 18)
  g.fillStyle(bodyI, 1)
  g.fillEllipse(cx, 22, 20, 12)

  g.lineStyle(2, vein, 0.85)
  g.beginPath()
  g.moveTo(10, 18)
  g.lineTo(16, 11)
  g.lineTo(22, 16)
  g.strokePath()
  g.beginPath()
  g.moveTo(28, 20)
  g.lineTo(32, 27)
  g.lineTo(26, 26)
  g.strokePath()

  // Spikes
  g.fillStyle(0x3d1a4d, 1)
  g.fillTriangle(6, 16, 8, 8, 10, 16)
  g.fillTriangle(30, 16, 32, 8, 34, 16)

  // Eyes — hostile marker
  g.fillStyle(eye, 1)
  g.fillCircle(cx - 6, 18, 4.5)
  g.fillCircle(cx + 6, 18, 4.5)
  g.fillStyle(pupil, 1)
  g.fillEllipse(cx - 6, 18, 2.5, 4)
  g.fillEllipse(cx + 6, 18, 2.5, 4)
  g.fillStyle(0xffffff, 0.7)
  g.fillCircle(cx - 7, 16.5, 1.1)
  g.fillCircle(cx + 5, 16.5, 1.1)

  // Teeth
  g.fillStyle(0xf5f0e6, 0.9)
  for (let i = 0; i < 5; i++) {
    g.fillRect(14 + i * 3, 26, 2, 3)
  }

  // Danger outline
  g.lineStyle(2, 0xff3355, 0.75)
  g.strokeEllipse(cx, 22, 30, 20)

  g.generateTexture('spr-slime', SPR, SPR)
  g.destroy()
}

/** Rattling revenant — skull + red socket glow + ribs (reads “undead enemy”). */
function makeSkeletonEnemy(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 })
  const cx = SPR / 2
  const bone = 0xd8d0e0
  const boneSh = 0x8a8494
  const rag = 0x4a3540
  const glow = 0xff2a4a
  const glowCore = 0xff7799

  // Rags
  g.fillStyle(rag, 1)
  g.fillTriangle(8, 30, cx, 38, 32, 30)
  g.fillStyle(0x2a1f28, 0.6)
  g.fillEllipse(cx, 32, 18, 8)

  // Ribs
  g.lineStyle(2, boneSh, 0.9)
  for (let i = 0; i < 3; i++) {
    g.strokeEllipse(cx, 28 + i * 2.5, 10 - i * 2, 4)
  }

  // Skull
  g.fillStyle(bone, 1)
  g.fillCircle(cx, 16, 12)
  g.fillStyle(boneSh, 0.35)
  g.fillCircle(cx - 4, 14, 5)
  g.fillCircle(cx + 5, 13, 4)

  // Jaw
  g.lineStyle(2, boneSh, 1)
  g.beginPath()
  g.moveTo(cx - 8, 22)
  g.lineTo(cx + 8, 22)
  g.lineTo(cx + 6, 26)
  g.lineTo(cx - 6, 26)
  g.closePath()
  g.strokePath()

  // Eye sockets + hostile glow
  g.fillStyle(0x1a0a10, 1)
  g.fillEllipse(cx - 5, 15, 6, 7)
  g.fillEllipse(cx + 5, 15, 6, 7)
  g.fillStyle(glowCore, 0.95)
  g.fillEllipse(cx - 5, 15, 3.5, 4.5)
  g.fillEllipse(cx + 5, 15, 3.5, 4.5)
  g.fillStyle(glow, 1)
  g.fillCircle(cx - 5, 15, 2)
  g.fillCircle(cx + 5, 15, 2)

  // Cracks
  g.lineStyle(1, 0x5c5668, 0.8)
  g.beginPath()
  g.moveTo(cx + 2, 10)
  g.lineTo(cx + 8, 14)
  g.strokePath()

  // Enemy ring
  g.lineStyle(2, glow, 0.55)
  g.strokeCircle(cx, 16, 14)

  g.generateTexture('spr-skeleton', SPR, SPR)
  g.destroy()
}
