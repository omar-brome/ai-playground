import Phaser from 'phaser'
import { AudioEngine } from '../game/AudioEngine'
import { bossLevel, campaignLevels } from '../game/levels'
import { abilityLabels, loadSave } from '../game/saveData'
import type { Ability, CustomLevelSlot, LevelDefinition } from '../game/types'
import { formatTime } from '../game/format'

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene')
  }

  create(): void {
    const save = loadSave()
    this.cameras.main.setBackgroundColor('#070914')
    this.add.text(48, 36, 'Select Mission', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '42px',
      color: '#f7fbff',
    })
    this.add.text(50, 88, 'Clear levels to unlock movement abilities and the boss.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#bcd0e9',
    })

    let y = 140
    for (const level of campaignLevels) {
      this.levelCard(54, y, level, this.canPlay(level.requiredAbilities ?? [], save.abilities), save)
      y += 108
    }

    const bossUnlocked = Object.values(save.abilities).every(Boolean)
    this.levelCard(54, y + 12, bossLevel, bossUnlocked, save)

    this.add.text(520, 140, 'Abilities', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '24px',
      color: '#57f8d4',
    })
    ;(Object.entries(abilityLabels) as [Ability, string][]).forEach(([ability, label], index) => {
      this.add.text(520, 180 + index * 34, `${save.abilities[ability] ? 'ONLINE' : 'LOCKED'}  ${label}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: save.abilities[ability] ? '#f7fbff' : '#77839a',
      })
    })

    this.add.text(520, 325, 'Custom levels', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '24px',
      color: '#57f8d4',
    })
    if (save.customLevels.length === 0) {
      this.add.text(520, 365, 'No custom rooms yet. Open the editor to build one.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#9fb0cb',
        wordWrap: { width: 360 },
      })
    } else {
      save.customLevels.slice(0, 4).forEach((slot, index) => this.customCard(520, 365 + index * 54, slot))
    }

    this.smallButton(520, 590, 'Editor', () => this.scene.start('EditorScene'))
    this.smallButton(640, 590, 'Menu', () => this.scene.start('MenuScene'))
  }

  private canPlay(required: Ability[], abilities: Record<Ability, boolean>): boolean {
    return required.every((ability) => abilities[ability])
  }

  private levelCard(
    x: number,
    y: number,
    level: LevelDefinition,
    enabled: boolean,
    save: ReturnType<typeof loadSave>,
  ): void {
    const key = level.id === 'boss' ? 'boss' : level.id
    const completed = key in save.completedLevels && save.completedLevels[key as keyof typeof save.completedLevels]
    const best = key in save.bestTimes ? save.bestTimes[key as keyof typeof save.bestTimes] : undefined
    const bg = this.add
      .rectangle(x, y, 400, 86, enabled ? 0x101a3d : 0x171925, 0.9)
      .setOrigin(0)
      .setStrokeStyle(1, enabled ? 0x57f8d4 : 0x4b536a, enabled ? 0.75 : 0.4)
    const title = `${completed ? 'CLEAR' : enabled ? 'READY' : 'LOCKED'}  ${level.title}`
    this.add.text(x + 18, y + 13, title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: enabled ? '#f7fbff' : '#77839a',
    })
    this.add.text(x + 18, y + 43, best ? `Best ${formatTime(best)}  |  ${level.subtitle}` : level.subtitle, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#aebfda',
    })
    const zone = this.add.zone(x, y, 400, 86).setOrigin(0)
    if (enabled) {
      zone.setInteractive({ useHandCursor: true })
      zone.on('pointerover', () => bg.setFillStyle(0x17345c, 0.95))
      zone.on('pointerout', () => bg.setFillStyle(0x101a3d, 0.9))
      zone.on('pointerdown', () => {
        AudioEngine.play(this, 'select')
        this.scene.start(level.id === 'boss' ? 'BossScene' : 'GameScene', { levelId: level.id })
      })
    }
  }

  private customCard(x: number, y: number, slot: CustomLevelSlot): void {
    const bg = this.add.rectangle(x, y, 350, 44, 0x101a3d, 0.9).setOrigin(0).setStrokeStyle(1, 0x8d7cff, 0.65)
    this.add.text(x + 12, y + 11, slot.title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f7fbff',
    })
    this.add
      .zone(x, y, 350, 44)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0x24204f, 0.95))
      .on('pointerout', () => bg.setFillStyle(0x101a3d, 0.9))
      .on('pointerdown', () => {
        AudioEngine.play(this, 'select')
        this.scene.start('GameScene', { customLevelId: slot.id })
      })
  }

  private smallButton(x: number, y: number, text: string, onClick: () => void): void {
    this.add.rectangle(x, y, 100, 40, 0x101a3d, 0.92).setOrigin(0).setStrokeStyle(1, 0x57f8d4, 0.7)
    this.add.text(x + 18, y + 11, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f7fbff',
    })
    this.add.zone(x, y, 100, 40).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', onClick)
  }
}
