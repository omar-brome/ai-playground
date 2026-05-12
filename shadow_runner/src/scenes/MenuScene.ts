import Phaser from 'phaser'
import { AudioEngine } from '../game/AudioEngine'
import { loadSave, resetProgress } from '../game/saveData'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene')
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#060814')
    this.addGrid()

    this.add
      .text(70, 70, 'SHADOW\nRUNNER', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '82px',
        lineSpacing: -14,
        color: '#f7fbff',
        stroke: '#101a3d',
        strokeThickness: 10,
      })
      .setDepth(4)

    this.add
      .text(75, 245, 'A neon platformer with unlocks, a boss, and a level editor.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#bcd0e9',
      })
      .setDepth(4)

    const save = loadSave()
    const completed = Object.values(save.completedLevels).filter(Boolean).length
    const abilityCount = Object.values(save.abilities).filter(Boolean).length
    this.add
      .text(75, 292, `Progress: ${completed}/4 clears  |  Abilities: ${abilityCount}/3`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#57f8d4',
      })
      .setDepth(4)

    this.button(80, 335, 'Play Campaign', () => this.scene.start('LevelSelectScene'))
    this.button(80, 390, 'Level Editor', () => this.scene.start('EditorScene'))
    this.button(80, 445, 'About This Demo', () => this.scene.start('AboutScene'))
    this.button(80, 500, AudioEngine.isMuted() ? 'Sound: Off' : 'Sound: On', (_, label) => {
      const muted = AudioEngine.toggleMute()
      label.setText(muted ? 'Sound: Off' : 'Sound: On')
    })
    this.button(80, 555, 'Reset Progress', () => {
      resetProgress()
      this.scene.restart()
    })

    this.add
      .text(
        560,
        380,
        [
          'Controls',
          'Move: A/D or arrows',
          'Jump: W/Up/Space',
          'Dash: Shift',
          'Phase: E',
          'Restart: R',
        ].join('\n'),
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          color: '#d8e7ff',
          lineSpacing: 8,
          backgroundColor: 'rgba(6,8,20,0.58)',
          padding: { x: 18, y: 16 },
        },
      )
      .setDepth(4)

    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('LevelSelectScene'))
  }

  private button(
    x: number,
    y: number,
    text: string,
    onClick: (zone: Phaser.GameObjects.Zone, label: Phaser.GameObjects.Text) => void,
  ): void {
    const zone = this.add.zone(x, y, 310, 48).setOrigin(0).setInteractive({ useHandCursor: true })
    const bg = this.add.rectangle(x, y, 310, 48, 0x101a3d, 0.88).setOrigin(0).setStrokeStyle(1, 0x57f8d4, 0.75)
    const label = this.add.text(x + 18, y + 12, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#f7fbff',
    })
    zone.on('pointerover', () => bg.setFillStyle(0x17345c, 0.95))
    zone.on('pointerout', () => bg.setFillStyle(0x101a3d, 0.88))
    zone.on('pointerdown', () => {
      AudioEngine.play(this, 'select')
      onClick(zone, label)
    })
  }

  private addGrid(): void {
    const g = this.add.graphics()
    g.lineStyle(1, 0x57f8d4, 0.1)
    for (let x = 0; x < 960; x += 48) g.lineBetween(x, 0, x + 220, 640)
    for (let y = 0; y < 640; y += 48) g.lineBetween(0, y, 960, y - 180)
    g.fillStyle(0x57f8d4, 0.1)
    g.fillCircle(760, 180, 140)
    g.fillStyle(0x8d7cff, 0.1)
    g.fillCircle(840, 420, 190)
  }
}
