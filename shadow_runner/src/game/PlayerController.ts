import Phaser from 'phaser'
import type { Ability, SaveData } from './types'
import { AudioEngine } from './AudioEngine'

type PlayerKeys = {
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
  up: Phaser.Input.Keyboard.Key
  jump: Phaser.Input.Keyboard.Key
  dash: Phaser.Input.Keyboard.Key
  phase: Phaser.Input.Keyboard.Key
}

export class PlayerController {
  readonly sprite: Phaser.Physics.Arcade.Sprite
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private keys: PlayerKeys
  private abilities: Record<Ability, boolean>
  private lastGroundedAt = 0
  private jumpPressedAt = -9999
  private canDoubleJump = false
  private dashAvailable = true
  private dashUntil = 0
  private phaseUntil = 0
  private invulnerableUntil = 0
  private facing: -1 | 1 = 1

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    save: SaveData,
    grantedAbilities: Ability[] = [],
  ) {
    this.abilities = { ...save.abilities }
    for (const ability of grantedAbilities) this.abilities[ability] = true
    this.sprite = scene.physics.add.sprite(x, y, 'runner')
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setDragX(1800)
    this.sprite.setMaxVelocity(430, 980)
    this.sprite.setDepth(40)
    this.sprite.setData('controller', this)
    this.body.setSize(24, 38).setOffset(6, 5)

    this.cursors = scene.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys)
    this.keys = scene.input.keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      dash: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      phase: Phaser.Input.Keyboard.KeyCodes.E,
    }) as PlayerKeys
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body
  }

  get isPhasing(): boolean {
    return this.scene.time.now < this.phaseUntil
  }

  get isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnerableUntil || this.isPhasing
  }

  hasAbility(ability: Ability): boolean {
    return this.abilities[ability]
  }

  grantAbility(ability: Ability): void {
    this.abilities[ability] = true
  }

  setInvulnerable(ms = 1100): void {
    this.invulnerableUntil = this.scene.time.now + ms
  }

  respawn(x: number, y: number): void {
    this.sprite.enableBody(true, x, y, true, true)
    this.sprite.setVelocity(0, 0)
    this.dashAvailable = true
    this.canDoubleJump = this.abilities.doubleJump
    this.setInvulnerable(1200)
  }

  update(): void {
    const now = this.scene.time.now
    const body = this.body
    const onGround = body.blocked.down || body.touching.down
    if (onGround) {
      this.lastGroundedAt = now
      this.canDoubleJump = this.abilities.doubleJump
      this.dashAvailable = true
    }

    const left = this.cursors.left?.isDown || this.keys.left.isDown
    const right = this.cursors.right?.isDown || this.keys.right.isDown
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.jump)
    const jumpHeld = this.cursors.up?.isDown || this.keys.up.isDown || this.keys.jump.isDown
    if (jumpPressed) this.jumpPressedAt = now

    if (now < this.dashUntil) {
      body.setAllowGravity(false)
      body.setVelocityX(this.facing * 760)
      body.setVelocityY(0)
    } else {
      body.setAllowGravity(true)
      if (left) {
        body.setAccelerationX(-2500)
        this.facing = -1
      } else if (right) {
        body.setAccelerationX(2500)
        this.facing = 1
      } else {
        body.setAccelerationX(0)
      }
    }

    if (now - this.jumpPressedAt < 130) {
      const coyote = now - this.lastGroundedAt < 115
      if (coyote) {
        body.setVelocityY(-610)
        this.jumpPressedAt = -9999
        AudioEngine.play(this.scene, 'jump')
      } else if (this.canDoubleJump) {
        body.setVelocityY(-560)
        this.canDoubleJump = false
        this.jumpPressedAt = -9999
        AudioEngine.play(this.scene, 'jump')
      }
    }

    if (!jumpHeld && body.velocity.y < -160) {
      body.setVelocityY(body.velocity.y * 0.78)
    }

    if (this.abilities.dash && this.dashAvailable && Phaser.Input.Keyboard.JustDown(this.keys.dash)) {
      this.dashUntil = now + 155
      this.dashAvailable = false
      this.setInvulnerable(220)
      AudioEngine.play(this.scene, 'dash')
    }

    if (this.abilities.phase && Phaser.Input.Keyboard.JustDown(this.keys.phase)) {
      this.phaseUntil = now + 850
      this.setInvulnerable(850)
      AudioEngine.play(this.scene, 'dash')
    }

    this.sprite.setFlipX(this.facing === -1)
    this.sprite.setAlpha(this.isPhasing ? 0.38 : now < this.invulnerableUntil ? 0.72 : 1)
    this.sprite.setTint(this.isPhasing ? 0x8d7cff : 0xffffff)
  }
}
