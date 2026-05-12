import Phaser from 'phaser'
import { AudioEngine } from '../game/AudioEngine'

export class AboutScene extends Phaser.Scene {
  constructor() {
    super('AboutScene')
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#060814')
    this.add.circle(760, 140, 220, 0x57f8d4, 0.08)
    this.add.text(70, 58, 'About This Demo', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '48px',
      color: '#f7fbff',
    })
    this.add.text(
      74,
      135,
      [
        'Shadow Runner is a static browser game built with Phaser 3, Vite, and TypeScript.',
        '',
        'Portfolio systems included:',
        '- Platformer controller with coyote time, jump buffering, dash, double jump, and phase.',
        '- Three campaign levels, custom level editor, local save data, and best times.',
        '- Enemy behaviors, moving hazards, collectibles, checkpoints, and a boss encounter.',
        '- Procedural visuals and Web Audio tones so the demo works without external assets.',
        '',
        'The design avoids cloned Mario art and focuses on an original neon escape theme.',
      ].join('\n'),
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '19px',
        color: '#d8e7ff',
        lineSpacing: 8,
        wordWrap: { width: 800 },
      },
    )
    this.button(74, 548, 'Back to Menu', () => this.scene.start('MenuScene'))
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MenuScene'))
  }

  private button(x: number, y: number, text: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 230, 46, 0x101a3d, 0.92).setOrigin(0).setStrokeStyle(1, 0x57f8d4, 0.7)
    this.add.text(x + 18, y + 13, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#f7fbff',
    })
    this.add
      .zone(x, y, 230, 46)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0x17345c, 0.95))
      .on('pointerout', () => bg.setFillStyle(0x101a3d, 0.92))
      .on('pointerdown', () => {
        AudioEngine.play(this, 'select')
        onClick()
      })
  }
}
