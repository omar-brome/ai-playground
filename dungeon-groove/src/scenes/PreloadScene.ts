import Phaser from 'phaser'
import { registerDungeonGfx } from '../game/gfxTextures'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload(): void {
    // Procedural textures only (see gfxTextures).
  }

  create(): void {
    registerDungeonGfx(this)
    this.scene.start('GameScene')
  }
}
