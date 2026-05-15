import Phaser from 'phaser'

const TILE = 32

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload(): void {
    // No external assets; procedural placeholders only.
  }

  create(): void {
    this.makeTileTexture('tile-wall', 0x3d2f52)
    this.makeTileTexture('tile-floor', 0x1c1426)
    this.makeChipTexture('spr-player', 0x5cffea, 0x0d3d36)
    this.makeChipTexture('spr-slime', 0x7dff4a, 0x1f4d14)
    this.makeChipTexture('spr-skeleton', 0xd0ccd8, 0x4a4655)

    this.scene.start('GameScene')
  }

  private makeTileTexture(key: string, color: number): void {
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(color, 1)
    g.fillRect(0, 0, TILE, TILE)
    g.lineStyle(1, 0x000000, 0.15)
    g.strokeRect(0.5, 0.5, TILE - 1, TILE - 1)
    g.generateTexture(key, TILE, TILE)
    g.destroy()
  }

  private makeChipTexture(key: string, fill: number, outline: number): void {
    const pad = 6
    const g = this.make.graphics({ x: 0, y: 0 })
    g.fillStyle(fill, 1)
    g.fillRoundedRect(pad, pad, TILE - pad * 2, TILE - pad * 2, 6)
    g.lineStyle(2, outline, 1)
    g.strokeRoundedRect(pad + 1, pad + 1, TILE - pad * 2 - 2, TILE - pad * 2 - 2, 5)
    g.generateTexture(key, TILE, TILE)
    g.destroy()
  }
}
