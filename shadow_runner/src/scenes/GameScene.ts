import Phaser from 'phaser'
import { AudioEngine } from '../game/AudioEngine'
import { addBurst, addFloatingText, flashCamera } from '../game/Effects'
import { formatTime, shardKey } from '../game/format'
import { cloneLevel } from '../game/levelCodec'
import { getBuiltInLevel } from '../game/levels'
import { abilityLabels, collectShard, loadSave, markLevelComplete, unlockAbility } from '../game/saveData'
import { PlayerController } from '../game/PlayerController'
import type { Ability, CampaignLevelId, EnemySpec, LevelDefinition, LevelId, LevelResult } from '../game/types'

type GameSceneData = {
  levelId?: LevelId
  customLevelId?: string
  playtestLevel?: LevelDefinition
}

type EnemyRuntime = {
  sprite: Phaser.Physics.Arcade.Sprite
  spec: EnemySpec
  originX: number
  direction: -1 | 1
  nextShotAt: number
}

export class GameScene extends Phaser.Scene {
  private level!: LevelDefinition
  private player!: PlayerController
  private save = loadSave()
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private movingPlatforms!: Phaser.Physics.Arcade.Group
  private hazards!: Phaser.Physics.Arcade.Group
  private shards!: Phaser.Physics.Arcade.StaticGroup
  private checkpoints!: Phaser.Physics.Arcade.StaticGroup
  private exits!: Phaser.Physics.Arcade.StaticGroup
  private enemies: EnemyRuntime[] = []
  private bullets!: Phaser.Physics.Arcade.Group
  private checkpoint = { x: 0, y: 0 }
  private startedAt = 0
  private shardCount = 0
  private totalShards = 0
  private hud!: Phaser.GameObjects.Text
  private signText!: Phaser.GameObjects.Text
  private lastSignAt = 0
  private playtest = false

  constructor() {
    super('GameScene')
  }

  init(data: GameSceneData): void {
    this.save = loadSave()
    this.playtest = Boolean(data.playtestLevel)
    if (data.playtestLevel) {
      this.level = cloneLevel(data.playtestLevel)
      return
    }
    if (data.customLevelId) {
      const slot = this.save.customLevels.find((item) => item.id === data.customLevelId)
      if (!slot) throw new Error(`Custom level not found: ${data.customLevelId}`)
      this.level = cloneLevel(slot.level)
      return
    }
    const levelId = data.levelId ?? 'rooftops'
    const builtIn = getBuiltInLevel(levelId)
    if (!builtIn) throw new Error(`Level not found: ${levelId}`)
    this.level = cloneLevel(builtIn)
  }

  create(): void {
    this.startedAt = this.time.now
    this.shardCount = 0
    this.totalShards = this.level.shards.length
    this.checkpoint = { ...this.level.spawn }
    this.physics.world.setBounds(0, 0, this.level.width, this.level.height)
    this.cameras.main.setBounds(0, 0, this.level.width, this.level.height)
    this.cameras.main.setBackgroundColor(this.backgroundColor())
    this.drawBackdrop()

    this.platforms = this.physics.add.staticGroup()
    this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true })
    this.hazards = this.physics.add.group({ allowGravity: false, immovable: true })
    this.shards = this.physics.add.staticGroup()
    this.checkpoints = this.physics.add.staticGroup()
    this.exits = this.physics.add.staticGroup()
    this.bullets = this.physics.add.group({ allowGravity: false })

    this.createPlatforms()
    this.createHazards()
    this.createShards()
    this.createCheckpointsAndExit()
    this.createEnemies()

    const granted: Ability[] = this.level.id.toString().startsWith('custom:') ? ['dash', 'doubleJump', 'phase'] : []
    this.player = new PlayerController(this, this.level.spawn.x, this.level.spawn.y, this.save, granted)
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08)

    this.physics.add.collider(this.player.sprite, this.platforms)
    this.physics.add.collider(this.player.sprite, this.movingPlatforms)
    this.physics.add.overlap(this.player.sprite, this.hazards, () => this.killPlayer('Hazard'), undefined, this)
    this.physics.add.overlap(this.player.sprite, this.bullets, (player, bullet) => {
      bullet.destroy()
      this.killPlayer('Security shot')
    })
    this.physics.add.overlap(this.player.sprite, this.shards, (_, shard) => this.collectShard(shard as Phaser.GameObjects.GameObject))
    this.physics.add.overlap(this.player.sprite, this.checkpoints, (_, cp) => this.activateCheckpoint(cp as Phaser.GameObjects.GameObject))
    this.physics.add.overlap(this.player.sprite, this.exits, () => this.completeLevel())
    this.physics.add.overlap(this.player.sprite, this.enemySprites(), () => this.killPlayer('Drone contact'))

    this.createHud()
    this.createInput()
  }

  update(): void {
    this.player.update()
    this.updateEnemies()
    this.updateHud()
    if (this.player.sprite.y > this.level.height + 90) this.killPlayer('Fell into the dark')
    if (this.time.now - this.lastSignAt > 2500) this.signText.setAlpha(0)
  }

  private createPlatforms(): void {
    const tint = this.level.theme === 'factory' ? 0x24304a : this.level.theme === 'tower' ? 0x1d2444 : 0x101a3d
    for (const p of this.level.platforms) {
      const rect = this.add.rectangle(p.x, p.y, p.width, p.height, p.tint ?? tint, 1).setOrigin(0).setStrokeStyle(1, 0x57f8d4, 0.24)
      this.physics.add.existing(rect, true)
      this.platforms.add(rect)
    }
    for (const p of this.level.movingPlatforms ?? []) {
      const rect = this.add.rectangle(p.x, p.y, p.width, p.height, 0x273c72, 1).setOrigin(0).setStrokeStyle(1, 0x7afcff, 0.75)
      this.physics.add.existing(rect)
      const body = rect.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(false).setImmovable(true)
      this.movingPlatforms.add(rect)
      const target = p.axis === 'x' ? { x: p.x + p.distance } : { y: p.y + p.distance }
      this.tweens.add({
        targets: rect,
        ...target,
        duration: p.durationMs,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: () => body.updateFromGameObject(),
      })
    }
  }

  private createHazards(): void {
    for (const h of this.level.hazards) {
      const rect = this.add.rectangle(h.x, h.y, h.width, h.height, 0xff2d55, 0.85).setOrigin(0)
      rect.setData('kind', 'hazard')
      this.physics.add.existing(rect)
      const body = rect.body as Phaser.Physics.Arcade.Body
      body.setAllowGravity(false).setImmovable(true)
      this.hazards.add(rect)
      if (h.movement) {
        const target = h.movement.axis === 'x' ? { x: h.x + h.movement.distance } : { y: h.y + h.movement.distance }
        this.tweens.add({
          targets: rect,
          ...target,
          duration: h.movement.durationMs,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          onUpdate: () => body.updateFromGameObject(),
        })
      }
    }
  }

  private createShards(): void {
    for (const shard of this.level.shards) {
      if (!this.playtest && loadSave().collectedShards[shardKey(this.level.id, shard.id)]) continue
      const sprite = this.physics.add.staticSprite(shard.x, shard.y, 'shard')
      sprite.setData('id', shard.id)
      sprite.setDepth(20)
      this.shards.add(sprite)
      this.tweens.add({ targets: sprite, y: shard.y - 10, yoyo: true, repeat: -1, duration: 850, ease: 'Sine.easeInOut' })
    }
    for (const pickup of this.level.abilityPickups ?? []) {
      const orb = this.physics.add.staticImage(pickup.x, pickup.y, 'shard').setTint(0x8d7cff).setScale(1.3)
      orb.setData('ability', pickup.ability)
      orb.setDepth(20)
      this.shards.add(orb)
    }
  }

  private createCheckpointsAndExit(): void {
    for (const cp of this.level.checkpoints) {
      const sprite = this.physics.add.staticSprite(cp.x, cp.y, 'checkpoint').setOrigin(0.5, 1)
      sprite.setData('checkpoint', cp)
      this.checkpoints.add(sprite)
    }
    const e = this.level.exit
    const exit = this.physics.add.staticSprite(e.x, e.y, 'exit').setOrigin(0, 0)
    exit.setDisplaySize(e.width, e.height)
    exit.refreshBody()
    this.exits.add(exit)

    for (const sign of this.level.signs ?? []) {
      const marker = this.add.rectangle(sign.x, sign.y, 24, 38, 0x57f8d4, 0.4).setStrokeStyle(1, 0xffffff, 0.7)
      this.physics.add.existing(marker, true)
      const zone = this.add.zone(sign.x, sign.y, 120, 90)
      this.physics.add.existing(zone, true)
      zone.setData('text', sign.text)
      this.physics.add.overlap(this.player?.sprite ?? marker, zone, () => undefined)
      this.events.once('postupdate', () => {
        this.physics.add.overlap(this.player.sprite, zone, (_, z) => {
          this.showSign(String((z as Phaser.GameObjects.Zone).getData('text')))
        })
      })
    }
  }

  private createEnemies(): void {
    for (const spec of this.level.enemies ?? []) {
      const sprite = this.physics.add.sprite(spec.x, spec.y, 'enemy')
      sprite.setTint(spec.kind === 'turret' ? 0xffd166 : spec.kind === 'chaser' ? 0xff477e : 0x8d7cff)
      sprite.setData('kind', spec.kind)
      sprite.setDragX(800)
      sprite.setCollideWorldBounds(true)
      this.physics.add.collider(sprite, this.platforms)
      this.physics.add.collider(sprite, this.movingPlatforms)
      this.enemies.push({ sprite, spec, originX: spec.x, direction: 1, nextShotAt: this.time.now + 900 })
    }
  }

  private enemySprites(): Phaser.GameObjects.GameObject[] {
    return this.enemies.map((enemy) => enemy.sprite)
  }

  private updateEnemies(): void {
    for (const enemy of this.enemies) {
      const { sprite, spec } = enemy
      if (!sprite.active) continue
      if (spec.kind === 'drone') {
        const distance = spec.patrolDistance ?? 130
        if (sprite.x > enemy.originX + distance) enemy.direction = -1
        if (sprite.x < enemy.originX - distance) enemy.direction = 1
        sprite.setVelocityX(enemy.direction * (spec.speed ?? 70))
      }
      if (spec.kind === 'chaser') {
        const dx = this.player.sprite.x - sprite.x
        if (Math.abs(dx) < 380) sprite.setVelocityX(Math.sign(dx) * (spec.speed ?? 95))
        else sprite.setVelocityX(0)
      }
      if (spec.kind === 'turret' && this.time.now > enemy.nextShotAt) {
        enemy.nextShotAt = this.time.now + 1500
        const bullet = this.physics.add.sprite(sprite.x, sprite.y - 6, 'bullet')
        this.bullets.add(bullet)
        const dir = Math.sign(this.player.sprite.x - sprite.x) || 1
        bullet.setVelocity(dir * 270, 0)
        bullet.setData('bornAt', this.time.now)
        AudioEngine.play(this, 'boss')
      }
    }
    this.bullets.children.each((child) => {
      const bullet = child as Phaser.Physics.Arcade.Sprite
      if (this.time.now - Number(bullet.getData('bornAt') ?? 0) > 3600) bullet.destroy()
      return true
    })
  }

  private collectShard(object: Phaser.GameObjects.GameObject): void {
    const ability = object.getData('ability') as Ability | undefined
    if (ability) {
      this.player.grantAbility(ability)
      if (!this.playtest) unlockAbility(ability)
      addFloatingText(this, this.player.sprite.x, this.player.sprite.y - 42, `Unlocked ${abilityLabels[ability]}`)
    } else {
      const id = String(object.getData('id'))
      if (!this.playtest) collectShard(shardKey(this.level.id, id))
      this.shardCount += 1
      addFloatingText(this, this.player.sprite.x, this.player.sprite.y - 38, '+ shard')
    }
    AudioEngine.play(this, 'shard')
    const position = object as unknown as { x: number; y: number }
    addBurst(this, position.x, position.y)
    object.destroy()
  }

  private activateCheckpoint(object: Phaser.GameObjects.GameObject): void {
    const cp = object.getData('checkpoint') as { x: number; y: number } | undefined
    if (!cp) return
    this.checkpoint = { x: cp.x, y: cp.y - 28 }
    addFloatingText(this, cp.x, cp.y - 80, 'Checkpoint')
  }

  private killPlayer(reason: string): void {
    if (this.player.isInvulnerable) return
    AudioEngine.play(this, 'hit')
    flashCamera(this, 0xff2d55, 160)
    this.cameras.main.shake(180, 0.01)
    this.player.respawn(this.checkpoint.x, this.checkpoint.y)
    addFloatingText(this, this.player.sprite.x, this.player.sprite.y - 50, reason, '#ff9ab4')
  }

  private completeLevel(): void {
    const timeMs = this.time.now - this.startedAt
    const unlocked = this.level.unlocksOnComplete ?? []
    if (!this.playtest && !this.level.id.toString().startsWith('custom:')) {
      markLevelComplete(this.level.id as CampaignLevelId, timeMs)
      for (const ability of unlocked) unlockAbility(ability)
    }
    AudioEngine.play(this, 'win')
    const result: LevelResult = {
      levelId: this.level.id,
      title: this.level.title,
      won: true,
      timeMs,
      shards: this.shardCount,
      totalShards: this.totalShards,
      unlocked,
    }
    this.scene.start('GameOverScene', { result })
  }

  private showSign(text: string): void {
    this.lastSignAt = this.time.now
    this.signText.setText(text).setAlpha(1)
  }

  private createHud(): void {
    this.hud = this.add
      .text(18, 16, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#f7fbff',
        backgroundColor: 'rgba(3,5,16,0.6)',
        padding: { x: 12, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(100)

    this.signText = this.add
      .text(480, 560, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
        color: '#f7fbff',
        backgroundColor: 'rgba(3,5,16,0.75)',
        padding: { x: 14, y: 10 },
        wordWrap: { width: 520 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0)
  }

  private updateHud(): void {
    const time = formatTime(this.time.now - this.startedAt)
    const abilities = (['dash', 'doubleJump', 'phase'] as Ability[])
      .filter((ability) => this.player.hasAbility(ability))
      .map((ability) => abilityLabels[ability].split(' ')[0])
      .join(' / ')
    this.hud.setText([
      this.level.title,
      `Time ${time}`,
      `Shards ${this.shardCount}/${this.totalShards}`,
      `Abilities ${abilities || 'none'}`,
      'Esc menu | R restart',
    ])
  }

  private createInput(): void {
    this.input.keyboard?.on('keydown-R', () => this.player.respawn(this.level.spawn.x, this.level.spawn.y))
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LevelSelectScene'))
  }

  private drawBackdrop(): void {
    const g = this.add.graphics().setDepth(-20)
    const color = this.level.theme === 'factory' ? 0xff477e : this.level.theme === 'tower' ? 0x8d7cff : 0x57f8d4
    for (let x = -80; x < this.level.width; x += 170) {
      const h = Phaser.Math.Between(160, 420)
      g.fillStyle(0x070b1f, 0.92)
      g.fillRect(x, this.level.height - h - 60, 110, h)
      g.lineStyle(1, color, 0.16)
      g.strokeRect(x, this.level.height - h - 60, 110, h)
    }
    g.lineStyle(1, color, 0.08)
    for (let y = 100; y < this.level.height; y += 80) g.lineBetween(0, y, this.level.width, y)
  }

  private backgroundColor(): string {
    if (this.level.theme === 'factory') return '#130813'
    if (this.level.theme === 'tower') return '#080616'
    if (this.level.theme === 'boss') return '#09040d'
    return '#060814'
  }
}
