import Phaser from 'phaser'
import { AudioEngine } from '../game/AudioEngine'
import { abilityLabels } from '../game/saveData'
import type { LevelResult } from '../game/types'
import { formatTime } from '../game/format'

type GameOverData = {
  result: LevelResult
}

export class GameOverScene extends Phaser.Scene {
  private result!: LevelResult

  constructor() {
    super('GameOverScene')
  }

  init(data: GameOverData): void {
    this.result = data.result
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#060814')
    this.add.rectangle(0, 0, 960, 640, 0x060814, 1).setOrigin(0)
    this.add.circle(750, 150, 210, 0x57f8d4, 0.08)
    this.add.circle(170, 530, 170, 0x8d7cff, 0.1)

    this.add.text(80, 76, this.result.won ? 'Mission Clear' : 'Run Ended', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '58px',
      color: '#f7fbff',
    })
    this.add.text(84, 154, this.result.title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#57f8d4',
    })

    const lines = [
      `Time: ${formatTime(this.result.timeMs)}`,
      `Shards: ${this.result.shards}/${this.result.totalShards}`,
      this.result.deathReason ? `Cause: ${this.result.deathReason}` : '',
      ...(this.result.unlocked ?? []).map((ability) => `Unlocked: ${abilityLabels[ability]}`),
    ].filter(Boolean)

    this.add.text(86, 220, lines.join('\n'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#d8e7ff',
      lineSpacing: 10,
    })

    this.button(84, 410, 'Level Select', () => this.scene.start('LevelSelectScene'))
    this.button(84, 470, 'Main Menu', () => this.scene.start('MenuScene'))
    this.button(84, 530, 'Share Result', () => this.shareResult())

    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('LevelSelectScene'))
  }

  private button(x: number, y: number, text: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 250, 44, 0x101a3d, 0.9).setOrigin(0).setStrokeStyle(1, 0x57f8d4, 0.7)
    this.add.text(x + 18, y + 11, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#f7fbff',
    })
    this.add
      .zone(x, y, 250, 44)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0x17345c, 0.95))
      .on('pointerout', () => bg.setFillStyle(0x101a3d, 0.9))
      .on('pointerdown', () => {
        AudioEngine.play(this, 'select')
        onClick()
      })
  }

  private shareResult(): void {
    const text = `I cleared ${this.result.title} in Shadow Runner: ${formatTime(this.result.timeMs)} with ${this.result.shards}/${this.result.totalShards} shards.`
    if (navigator.share) {
      void navigator.share({ title: 'Shadow Runner', text }).catch(() => undefined)
      return
    }
    void navigator.clipboard?.writeText(text)
  }
}
