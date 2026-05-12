import Phaser from 'phaser'
import { AudioEngine } from '../game/AudioEngine'
import { addBurst, addFloatingText, flashCamera } from '../game/Effects'
import { bossLevel } from '../game/levels'
import { loadSave, markLevelComplete } from '../game/saveData'
import { PlayerController } from '../game/PlayerController'
import type { LevelResult } from '../game/types'
import { formatTime } from '../game/format'

type AttackMode = 'sweep' | 'burst' | 'slam'

export class BossScene extends Phaser.Scene {
  private player!: PlayerController
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private hazards!: Phaser.Physics.Arcade.Group
  private bullets!: Phaser.Physics.Arcade.Group
  private boss!: Phaser.GameObjects.Container
  private core!: Phaser.Physics.Arcade.Image
  private bossHp = 5
  private vulnerableUntil = 0
  private startedAt = 0
  private hud!: Phaser.GameObjects.Text
  private nextAttackAt = 0
  private attackIndex = 0
  private armoredHintAt = 0

  constructor() {
    super('BossScene')
  }

  create(): void {
    this.startedAt = this.time.now
    this.physics.world.setBounds(0, 0, bossLevel.width, bossLevel.height)
    this.cameras.main.setBounds(0, 0, bossLevel.width, bossLevel.height)
    this.cameras.main.setBackgroundColor('#09040d')
    this.drawArena()
    this.platforms = this.physics.add.staticGroup()
    this.hazards = this.physics.add.group({ allowGravity: false, immovable: true })
    this.bullets = this.physics.add.group({ allowGravity: false })

    for (const p of bossLevel.platforms) {
      const rect = this.add.rectangle(p.x, p.y, p.width, p.height, 0x17122d, 1).setOrigin(0).setStrokeStyle(1, 0x8d7cff, 0.55)
      this.physics.add.existing(rect, true)
      this.platforms.add(rect)
    }
    for (const h of bossLevel.hazards) {
      const rect = this.add.rectangle(h.x, h.y, h.width, h.height, 0xff2d55, 0.85).setOrigin(0)
      this.physics.add.existing(rect)
      const body = rect.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(false).setImmovable(true)
      this.hazards.add(rect)
    }

    this.player = new PlayerController(this, bossLevel.spawn.x, bossLevel.spawn.y, loadSave(), ['dash', 'doubleJump', 'phase'])
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08)
    this.physics.add.collider(this.player.sprite, this.platforms)
    this.physics.add.overlap(this.player.sprite, this.hazards, () => this.damagePlayer('Core hazard'))
    this.physics.add.overlap(this.player.sprite, this.bullets, (_, bullet) => {
      bullet.destroy()
      this.damagePlayer('Sentinel shot')
    })

    this.createBoss()
    this.createHud()
    this.nextAttackAt = this.time.now + 1100
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LevelSelectScene'))
    this.input.keyboard?.on('keydown-R', () => this.player.respawn(bossLevel.spawn.x, bossLevel.spawn.y))
  }

  update(): void {
    this.player.update()
    if (this.player.sprite.y > bossLevel.height + 100) this.damagePlayer('Fell from arena')
    if (this.time.now > this.nextAttackAt) this.runAttack()
    this.bullets.children.each((child) => {
      const bullet = child as Phaser.Physics.Arcade.Sprite
      if (this.time.now - Number(bullet.getData('bornAt') ?? 0) > 4200) bullet.destroy()
      return true
    })
    const exposed = this.time.now < this.vulnerableUntil
    this.core.setAlpha(exposed ? 1 : 0.28)
    this.core.setTint(exposed ? 0xffd166 : 0x6f5a2c)
    this.hud.setText([
      'The Sentinel',
      `Core integrity: ${Math.max(0, this.bossHp)}/5`,
      `Time ${formatTime(this.time.now - this.startedAt)}`,
      exposed ? 'CORE EXPOSED: strike now!' : 'Dodge the wave. The core opens after it attacks.',
    ])
  }

  private createBoss(): void {
    const shell = this.add.rectangle(0, 0, 220, 170, 0x101a3d, 1).setStrokeStyle(2, 0xff477e, 0.9)
    const eye = this.add.circle(0, -10, 36, 0xff477e, 0.9)
    const ring = this.add.circle(0, -10, 58).setStrokeStyle(2, 0x57f8d4, 0.7)
    this.boss = this.add.container(850, 245, [shell, eye, ring]).setDepth(30)
    this.tweens.add({ targets: this.boss, y: 275, yoyo: true, repeat: -1, duration: 1700, ease: 'Sine.easeInOut' })

    this.core = this.physics.add.image(850, 320, 'shard').setTint(0xffd166).setScale(1.8).setDepth(40)
    ;(this.core.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.core.setImmovable(true)
    this.physics.add.overlap(this.player.sprite, this.core, () => this.hitCore())
  }

  private runAttack(): void {
    const modes: AttackMode[] = ['sweep', 'burst', 'slam']
    const mode = modes[this.attackIndex % modes.length]
    this.attackIndex += 1
    this.nextAttackAt = this.time.now + 4600
    this.vulnerableUntil = 0
    AudioEngine.play(this, 'boss')
    addFloatingText(this, 850, 150, mode.toUpperCase(), '#ffd166')

    if (mode === 'sweep') {
      for (let i = 0; i < 7; i += 1) {
        this.time.delayedCall(i * 120, () => this.spawnBullet(260 + i * 190, 130, 0, 310))
      }
    } else if (mode === 'burst') {
      for (let i = 0; i < 12; i += 1) {
        const angle = Phaser.Math.DegToRad(i * 30)
        this.spawnBullet(850, 280, Math.cos(angle) * 230, Math.sin(angle) * 230)
      }
    } else {
      for (let i = 0; i < 4; i += 1) {
        this.time.delayedCall(i * 230, () => {
          const x = Phaser.Math.Between(240, 1450)
          const hazard = this.add.rectangle(x, 664, 70, 36, 0xff2d55, 0.92)
          this.physics.add.existing(hazard)
          const body = hazard.body as Phaser.Physics.Arcade.Body
          body.setAllowGravity(false).setImmovable(true)
          this.hazards.add(hazard)
          this.time.delayedCall(900, () => hazard.destroy())
        })
      }
    }

    const exposeDelay = mode === 'burst' ? 1050 : mode === 'sweep' ? 1350 : 1600
    this.time.delayedCall(exposeDelay, () => this.exposeCore())
  }

  private exposeCore(): void {
    this.vulnerableUntil = this.time.now + 2300
    AudioEngine.play(this, 'select')
    flashCamera(this, 0xffd166, 100)
    addFloatingText(this, this.core.x, this.core.y - 92, 'CORE EXPOSED', '#ffd166')
    this.tweens.add({
      targets: this.core,
      scale: 2.35,
      duration: 180,
      yoyo: true,
      repeat: 5,
      ease: 'Sine.easeInOut',
    })
  }

  private spawnBullet(x: number, y: number, vx: number, vy: number): void {
    const bullet = this.physics.add.sprite(x, y, 'bullet')
    bullet.setData('bornAt', this.time.now)
    bullet.setVelocity(vx, vy)
    this.bullets.add(bullet)
  }

  private hitCore(): void {
    if (this.time.now > this.vulnerableUntil) {
      if (this.time.now > this.armoredHintAt) {
        this.armoredHintAt = this.time.now + 900
        addFloatingText(this, this.core.x, this.core.y - 65, 'Wait for exposure', '#ff9ab4')
      }
      return
    }
    this.vulnerableUntil = 0
    this.bossHp -= 1
    flashCamera(this, 0xffd166, 120)
    this.cameras.main.shake(140, 0.006)
    addBurst(this, this.core.x, this.core.y, 0xffd166, 28)
    AudioEngine.play(this, 'shard')
    if (this.bossHp <= 0) this.win()
  }

  private damagePlayer(reason: string): void {
    if (this.player.isInvulnerable) return
    AudioEngine.play(this, 'hit')
    this.player.respawn(bossLevel.spawn.x, bossLevel.spawn.y)
    flashCamera(this, 0xff2d55, 140)
    addFloatingText(this, this.player.sprite.x, this.player.sprite.y - 45, reason, '#ff9ab4')
  }

  private win(): void {
    const timeMs = this.time.now - this.startedAt
    markLevelComplete('boss', timeMs)
    const result: LevelResult = {
      levelId: 'boss',
      title: bossLevel.title,
      won: true,
      timeMs,
      shards: 0,
      totalShards: 0,
    }
    this.scene.start('GameOverScene', { result })
  }

  private createHud(): void {
    this.hud = this.add
      .text(18, 16, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#f7fbff',
        backgroundColor: 'rgba(3,5,16,0.65)',
        padding: { x: 12, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(100)
  }

  private drawArena(): void {
    const g = this.add.graphics().setDepth(-20)
    g.lineStyle(1, 0xff477e, 0.12)
    for (let x = 0; x < bossLevel.width; x += 70) g.lineBetween(x, 0, bossLevel.width - x, bossLevel.height)
    g.fillStyle(0xff477e, 0.08)
    g.fillCircle(850, 260, 280)
  }
}
