import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  create(): void {
    this.createRunnerTexture()
    this.createSimpleTexture('shard', 24, 24, 0x57f8d4, 'diamond')
    this.createSimpleTexture('checkpoint', 28, 72, 0x7c5cff, 'flag')
    this.createSimpleTexture('exit', 42, 90, 0x7afcff, 'door')
    this.createSimpleTexture('enemy', 34, 30, 0xff477e, 'rect')
    this.createSimpleTexture('bullet', 12, 12, 0xffd166, 'circle')
    this.scene.start('MenuScene')
  }

  private createRunnerTexture(): void {
    const g = this.add.graphics()
    g.fillStyle(0x0a1028, 1)
    g.fillRoundedRect(0, 6, 34, 38, 8)
    g.fillStyle(0x57f8d4, 1)
    g.fillRoundedRect(10, 0, 15, 18, 5)
    g.fillStyle(0x8d7cff, 1)
    g.fillRect(7, 20, 20, 5)
    g.lineStyle(2, 0x57f8d4, 1)
    g.strokeRoundedRect(1, 1, 32, 42, 8)
    g.generateTexture('runner', 34, 44)
    g.destroy()
  }

  private createSimpleTexture(
    key: string,
    width: number,
    height: number,
    color: number,
    shape: 'diamond' | 'flag' | 'door' | 'rect' | 'circle',
  ): void {
    const g = this.add.graphics()
    g.fillStyle(color, 1)
    g.lineStyle(2, 0xffffff, 0.7)
    if (shape === 'diamond') {
      g.beginPath()
      g.moveTo(width / 2, 0)
      g.lineTo(width, height / 2)
      g.lineTo(width / 2, height)
      g.lineTo(0, height / 2)
      g.closePath()
      g.fillPath()
      g.strokePath()
    } else if (shape === 'flag') {
      g.fillRect(width / 2 - 2, 0, 4, height)
      g.fillTriangle(width / 2, 0, width, 14, width / 2, 28)
    } else if (shape === 'door') {
      g.fillRoundedRect(0, 0, width, height, 14)
      g.strokeRoundedRect(1, 1, width - 2, height - 2, 14)
    } else if (shape === 'circle') {
      g.fillCircle(width / 2, height / 2, width / 2)
    } else {
      g.fillRoundedRect(0, 0, width, height, 8)
      g.strokeRoundedRect(1, 1, width - 2, height - 2, 8)
    }
    g.generateTexture(key, width, height)
    g.destroy()
  }
}
