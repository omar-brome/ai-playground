import Phaser from 'phaser'
import { BeatScheduler } from '../game/BeatScheduler'
import { GridWorld } from '../game/GridWorld'
import { LEVEL_01 } from '../game/levels'
import { resolvePlayerTurn } from '../game/TurnResolver'
import type { Entity } from '../game/types'

const TILE = 32
const ORIGIN_X = 48
const ORIGIN_Y = 96
const BPM_DEFAULT = 112
const WINDOW_MS = 125

export class GameScene extends Phaser.Scene {
  private audioCtx!: AudioContext
  private beat!: BeatScheduler
  private world!: GridWorld
  private tileSprites: Phaser.GameObjects.Image[][] = []
  private entityViews = new Map<string, Phaser.GameObjects.Image>()
  private hudHp!: Phaser.GameObjects.Text
  private hudHint!: Phaser.GameObjects.Text
  private hudBpm!: Phaser.GameObjects.Text
  private beatPulse!: Phaser.GameObjects.Rectangle
  private overlay!: Phaser.GameObjects.Container
  private overlayText!: Phaser.GameObjects.Text

  private lastHudBeat = -1
  private lastConsumedRhythmBeat = Number.MIN_SAFE_INTEGER
  private simulationBeatOrdinal = 0

  private gameFrozen = false

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    this.audioCtx = new AC()
    this.beat = new BeatScheduler(this.audioCtx, BPM_DEFAULT, WINDOW_MS)

    this.add.rectangle(400, 320, 900, 640, 0x12091c, 0.92).setScrollFactor(0)

    this.hudHint = this.add
      .text(24, 18, 'Arrows / WASD on the beat  •  [ ] slower/faster BPM  •  R restart', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#dcccff',
      })
      .setAlpha(0.85)

    this.hudHp = this.add.text(24, 46, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#f6fffb',
    })

    this.hudBpm = this.add.text(24, 72, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#b39ddb',
    })

    this.beatPulse = this.add
      .rectangle(this.scale.width / 2, 44, 40, 10, 0xffc857, 0.95)
      .setStrokeStyle(2, 0xffffff, 0.35)

    this.overlay = this.add.container(400, 300).setDepth(50).setVisible(false)
    const bg = this.add.rectangle(0, 0, 520, 160, 0x1a0f28, 0.94).setStrokeStyle(2, 0xffffff, 0.2)
    this.overlayText = this.add.text(0, 0, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#fff7e8',
      align: 'center',
    }).setOrigin(0.5)
    this.overlay.add([bg, this.overlayText])

    this.input.once('pointerdown', () => {
      void this.audioCtx.resume()
      this.beat.snapAnchorToNow()
    })

    this.resetRun()

    this.input.keyboard?.on('keydown', (ev: KeyboardEvent) => {
      if (this.gameFrozen && ev.code !== 'KeyR') return

      if (ev.code === 'KeyR') {
        ev.preventDefault()
        this.resetRun()
        return
      }

      if (ev.code === 'BracketLeft') {
        this.beat.setBpm(this.beat.bpm - 4)
        this.refreshHud()
        return
      }
      if (ev.code === 'BracketRight') {
        this.beat.setBpm(this.beat.bpm + 4)
        this.refreshHud()
        return
      }

      let dx = 0
      let dy = 0
      if (ev.code === 'ArrowLeft' || ev.code === 'KeyA') dx = -1
      else if (ev.code === 'ArrowRight' || ev.code === 'KeyD') dx = 1
      else if (ev.code === 'ArrowUp' || ev.code === 'KeyW') dy = -1
      else if (ev.code === 'ArrowDown' || ev.code === 'KeyS') dy = 1
      else return

      ev.preventDefault()

      const now = this.beat.now()
      if (!this.beat.inBeatWindow(now)) return

      const rhythmBeat = this.beat.beatIndexAt(now)
      if (rhythmBeat === this.lastConsumedRhythmBeat) return

      const turn = resolvePlayerTurn(this.world, dx, dy, this.simulationBeatOrdinal)
      if (!turn.ok) return

      this.lastConsumedRhythmBeat = rhythmBeat
      this.simulationBeatOrdinal += 1
      this.refreshEntitiesFromWorld()
      this.refreshHud()

      if (turn.playerHp <= 0) {
        this.freezeGame('You died — press R to restart')
        return
      }

      if (this.world.allEnemiesDead()) {
        this.freezeGame('Floor clear — press R to replay')
      }
    })
  }

  update(): void {
    const now = this.beat.now()
    const idx = this.beat.beatIndexAt(now)
    if (idx !== this.lastHudBeat) {
      this.lastHudBeat = idx
      this.beat.playClick()
    }

    const phase = this.beat.beatPhase01(now)
    const w = 28 + 140 * (1 - phase)
    this.beatPulse.width = Phaser.Math.Clamp(w, 28, 220)
    this.beatPulse.setAlpha(0.55 + 0.45 * (1 - phase))
  }

  private freezeGame(message: string): void {
    this.gameFrozen = true
    this.overlayText.setText(message)
    this.overlay.setVisible(true)
  }

  private resetRun(): void {
    this.gameFrozen = false
    this.overlay.setVisible(false)

    this.world = new GridWorld(LEVEL_01)
    this.simulationBeatOrdinal = 0
    this.lastConsumedRhythmBeat = Number.MIN_SAFE_INTEGER

    this.tileSprites.forEach((row) => row.forEach((img) => img.destroy()))
    this.tileSprites = []
    this.entityViews.forEach((img) => img.destroy())
    this.entityViews.clear()

    for (let y = 0; y < this.world.height; y++) {
      const row: Phaser.GameObjects.Image[] = []
      for (let x = 0; x < this.world.width; x++) {
        const wall = this.world.isWall(x, y)
        const img = this.add.image(
          ORIGIN_X + x * TILE + TILE / 2,
          ORIGIN_Y + y * TILE + TILE / 2,
          wall ? 'tile-wall' : 'tile-floor',
        )
        row.push(img)
      }
      this.tileSprites.push(row)
    }

    this.refreshEntitiesFromWorld()
    void this.audioCtx.resume()
    this.beat.snapAnchorToNow()
    this.refreshHud()
  }

  private textureForEntity(e: Entity): string {
    if (e.kind === 'player') return 'spr-player'
    if (e.kind === 'slime') return 'spr-slime'
    return 'spr-skeleton'
  }

  private refreshEntitiesFromWorld(): void {
    const seen = new Set<string>()
    for (const e of this.world.snapshotEntities()) {
      seen.add(e.id)
      let img = this.entityViews.get(e.id)
      const px = ORIGIN_X + e.x * TILE + TILE / 2
      const py = ORIGIN_Y + e.y * TILE + TILE / 2
      const key = this.textureForEntity(e)
      if (!img) {
        img = this.add.image(px, py, key).setDepth(5)
        this.entityViews.set(e.id, img)
      } else {
        img.setTexture(key)
        img.setPosition(px, py)
      }
    }

    for (const id of [...this.entityViews.keys()]) {
      if (!seen.has(id)) {
        this.entityViews.get(id)?.destroy()
        this.entityViews.delete(id)
      }
    }
  }

  private refreshHud(): void {
    const p = this.world.getPlayer()
    const hp = p?.hp ?? 0
    this.hudHp.setText(`HP ${hp}   •   enemies ${this.world.listEnemies().length}`)
    this.hudBpm.setText(`BPM ${Math.round(this.beat.bpm)}   •   beat window ±${WINDOW_MS} ms`)
  }
}
