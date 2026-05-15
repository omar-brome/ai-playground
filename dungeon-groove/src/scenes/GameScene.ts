import Phaser from 'phaser'
import { BeatScheduler } from '../game/BeatScheduler'
import { GridWorld } from '../game/GridWorld'
import { DUNGEON_LEVELS } from '../game/levels'
import { generateProceduralLevel } from '../game/randomLevel'
import { resolvePlayerTurn } from '../game/TurnResolver'
import type { Entity, LevelDef } from '../game/types'

const TILE = 32
const BPM_DEFAULT = 112
const WINDOW_MS = 125
/** Display scale for 40×40 generated character sprites inside a 32px cell. */
const ENTITY_SCALE = 0.78

export class GameScene extends Phaser.Scene {
  private audioCtx!: AudioContext
  private beat!: BeatScheduler
  private world!: GridWorld
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private keyW?: Phaser.Input.Keyboard.Key
  private keyA?: Phaser.Input.Keyboard.Key
  private keyS?: Phaser.Input.Keyboard.Key
  private keyD?: Phaser.Input.Keyboard.Key
  private tileSprites: Phaser.GameObjects.Image[][] = []
  private entityViews = new Map<string, Phaser.GameObjects.Image>()
  private hudHp!: Phaser.GameObjects.Text
  private hudHint!: Phaser.GameObjects.Text
  private hudBpm!: Phaser.GameObjects.Text
  private hudRhythm!: Phaser.GameObjects.Text
  private hudVault!: Phaser.GameObjects.Text
  private beatPulse!: Phaser.GameObjects.Rectangle
  private overlay!: Phaser.GameObjects.Container
  private overlayText!: Phaser.GameObjects.Text
  /** Pause menu (above gameplay, below nothing else needed). */
  private pauseLayer!: Phaser.GameObjects.Container

  private lastHudBeat = -1
  private lastConsumedRhythmBeat = Number.MIN_SAFE_INTEGER
  private simulationBeatOrdinal = 0
  /** Set when a held move was in-window for a new beat but `resolvePlayerTurn` returned not ok (e.g. wall). */
  private moveRejectHint: 'wall' | null = null

  private currentLevelIndex = 0
  private awaitingNextLevel = false
  /** XOR salt so each procedural depth gets a different seed; refreshed on full campaign reset. */
  private procRunSalt = 0xdecafbad
  private cachedLevelDef!: LevelDef
  private boardOriginX = 48
  private boardOriginY = 96

  private gameFrozen = false
  /** Pauses movement, metronome tick advance, and beat HUD (P / Esc). */
  private paused = false

  constructor() {
    super({ key: 'GameScene' })
  }

  create(): void {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    this.audioCtx = new AC()
    this.beat = new BeatScheduler(this.audioCtx, BPM_DEFAULT, WINDOW_MS)

    this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width + 8, this.scale.height + 8, 0x080512, 1)
      .setScrollFactor(0)

    this.hudVault = this.add
      .text(this.scale.width - 20, 18, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#cbb6ff',
      })
      .setOrigin(1, 0)
      .setAlpha(0.92)

    this.hudHint = this.add
      .text(
        24,
        18,
        'Hold WASD / arrows  ·  P or Esc pause  ·  M metronome  ·  N next vault  ·  [ ] BPM  ·  R restart',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#dcccff',
        },
      )
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

    this.hudRhythm = this.add.text(24, 94, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#e8e0ff',
      wordWrap: { width: this.scale.width - 48 },
    })

    this.beatPulse = this.add
      .rectangle(this.scale.width / 2, 44, 40, 10, 0xffc857, 0.95)
      .setStrokeStyle(2, 0xffffff, 0.35)

    this.overlay = this.add.container(this.scale.width / 2, this.scale.height / 2).setDepth(50).setVisible(false)
    const bg = this.add.rectangle(0, 0, 520, 160, 0x1a0f28, 0.94).setStrokeStyle(2, 0xffffff, 0.2)
    this.overlayText = this.add.text(0, 0, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      color: '#fff7e8',
      align: 'center',
    }).setOrigin(0.5)
    this.overlay.add([bg, this.overlayText])

    const pw = this.scale.width + 40
    const ph = this.scale.height + 40
    this.pauseLayer = this.add
      .container(this.scale.width / 2, this.scale.height / 2)
      .setDepth(60)
      .setScrollFactor(0)
      .setVisible(false)
    const pauseDim = this.add.rectangle(0, 0, pw, ph, 0x040208, 0.72).setScrollFactor(0)
    const pauseTitle = this.add
      .text(0, -18, 'Paused', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        color: '#f4ecff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
    const pauseSub = this.add
      .text(0, 28, 'P or Esc — resume   ·   M — metronome on/off', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#b8a8d8',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
    this.pauseLayer.add([pauseDim, pauseTitle, pauseSub])

    this.input.once('pointerdown', () => {
      void this.audioCtx.resume()
      this.beat.snapAnchorToNow()
    })

    this.resetRun()

    const kb = this.input.keyboard
    if (kb) {
      kb.addCapture([
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D,
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
      ])
      this.cursors = kb.createCursorKeys()
      this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W)
      this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A)
      this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S)
      this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    }

    kb?.on('keydown', (ev: KeyboardEvent) => {
      if (ev.code === 'ArrowLeft' || ev.code === 'ArrowRight' || ev.code === 'ArrowUp' || ev.code === 'ArrowDown') {
        ev.preventDefault()
      }

      if (ev.code === 'KeyM') {
        ev.preventDefault()
        this.beat.setMuted(!this.beat.isMuted)
        this.refreshHud()
        return
      }

      if (ev.code === 'KeyP' || ev.code === 'Escape') {
        ev.preventDefault()
        this.togglePause()
        return
      }

      if (
        this.gameFrozen &&
        ev.code !== 'KeyR' &&
        !(ev.code === 'KeyN' && this.awaitingNextLevel)
      ) {
        return
      }

      if (ev.code === 'KeyR') {
        ev.preventDefault()
        this.awaitingNextLevel = false
        this.loadCurrentLevel()
        return
      }

      if (ev.code === 'KeyN' && this.gameFrozen && this.awaitingNextLevel) {
        ev.preventDefault()
        this.currentLevelIndex += 1
        this.awaitingNextLevel = false
        this.loadCurrentLevel()
        return
      }

      if (ev.code === 'BracketLeft' && !this.paused) {
        this.beat.setBpm(this.beat.bpm - 4)
        this.refreshHud()
        return
      }
      if (ev.code === 'BracketRight' && !this.paused) {
        this.beat.setBpm(this.beat.bpm + 4)
        this.refreshHud()
        return
      }
    })
  }

  private togglePause(): void {
    this.paused = !this.paused
    this.pauseLayer.setVisible(this.paused)
    if (!this.paused) {
      void this.audioCtx.resume()
      this.beat.snapAnchorToNow()
      this.lastHudBeat = this.beat.beatIndexAt(this.beat.now())
    }
  }

  private tryCommitHeldMove(): void {
    this.moveRejectHint = null
    if (this.gameFrozen || this.paused) return

    let dx = 0
    let dy = 0
    if (this.cursors?.left.isDown || this.keyA?.isDown) dx -= 1
    if (this.cursors?.right.isDown || this.keyD?.isDown) dx += 1
    if (this.cursors?.up.isDown || this.keyW?.isDown) dy -= 1
    if (this.cursors?.down.isDown || this.keyS?.isDown) dy += 1

    if (dx !== 0 && dy !== 0) dy = 0

    if (dx === 0 && dy === 0) return

    const now = this.beat.now()
    if (!this.beat.inBeatWindow(now)) return

    const rhythmBeat = this.beat.beatIndexAt(now)
    if (rhythmBeat <= this.lastConsumedRhythmBeat) return

    const turn = resolvePlayerTurn(this.world, dx, dy, this.simulationBeatOrdinal)
    if (!turn.ok) {
      this.moveRejectHint = 'wall'
      return
    }

    this.lastConsumedRhythmBeat = rhythmBeat
    this.simulationBeatOrdinal += 1
    this.refreshEntitiesFromWorld()
    this.refreshHud()

    if (turn.playerHp <= 0) {
      this.freezeGame('You died — press R to restart')
      return
    }

    if (this.world.allEnemiesDead()) {
      this.awaitingNextLevel = true
      const curated = DUNGEON_LEVELS.length
      if (this.currentLevelIndex < curated - 1) {
        this.freezeGame(
          `Vault clear!  Press N · vault ${this.currentLevelIndex + 2}/${curated} (hand-made)  ·  R replay`,
        )
      } else if (this.currentLevelIndex === curated - 1) {
        this.freezeGame(
          'Vault IV clear — Press N for infinite random vaults (new layout each floor)  ·  R replay',
        )
      } else {
        this.freezeGame(
          `Floor ${this.currentLevelIndex + 1} clear — Press N for another random layout  ·  R replay`,
        )
      }
      return
    }
  }

  update(): void {
    void this.audioCtx.resume()

    if (this.paused) {
      this.updateRhythmFeedback(this.beat.now())
      return
    }

    this.tryCommitHeldMove()

    const now = this.beat.now()
    const idx = this.beat.beatIndexAt(now)
    if (idx !== this.lastHudBeat) {
      this.lastHudBeat = idx
      this.beat.playClick()
    }

    const phase = this.beat.beatPhase01(now)
    const w = 28 + 140 * (1 - phase)
    this.beatPulse.width = Phaser.Math.Clamp(w, 28, 220)
    const baseAlpha = 0.55 + 0.45 * (1 - phase)
    this.beatPulse.setAlpha(baseAlpha)
    this.beatPulse.setFillStyle(0xffc857, 0.95)

    this.updateRhythmFeedback(now)
    this.applyEnemyPresentation()
  }

  private updateRhythmFeedback(now: number): void {
    if (this.paused) {
      this.hudRhythm.setText(this.beat.isMuted ? 'Paused — metronome is muted (M to hear ticks)' : 'Paused — P / Esc resume')
      this.hudRhythm.setColor('#d4c8f0')
      return
    }
    if (this.gameFrozen) {
      this.hudRhythm.setText('')
      return
    }

    let dx = 0
    let dy = 0
    if (this.cursors?.left.isDown || this.keyA?.isDown) dx -= 1
    if (this.cursors?.right.isDown || this.keyD?.isDown) dx += 1
    if (this.cursors?.up.isDown || this.keyW?.isDown) dy -= 1
    if (this.cursors?.down.isDown || this.keyS?.isDown) dy += 1
    if (dx !== 0 && dy !== 0) dy = 0

    if (dx === 0 && dy === 0) {
      this.hudRhythm.setText('')
      return
    }

    const offMs = this.beat.offsetFromNearestBeatCenterMs(now)
    const win = this.beat.inBeatWindow(now)
    const rhythmBeat = this.beat.beatIndexAt(now)
    const absOff = Math.abs(offMs)

    if (!win) {
      const side = offMs < 0 ? 'Early' : 'Late'
      this.hudRhythm.setText(`${side} — ${absOff} ms from beat (±${this.beat.halfWindowMs} ms window)`)
      this.hudRhythm.setColor(offMs < 0 ? '#7ec8ff' : '#ff8fab')
      this.beatPulse.setFillStyle(offMs < 0 ? 0x5aa8ff : 0xff6b9d, 0.95)
      return
    }

    if (rhythmBeat <= this.lastConsumedRhythmBeat) {
      this.hudRhythm.setText('On beat window — already moved this tick (wait for next metronome)')
      this.hudRhythm.setColor('#c4b5fd')
      this.beatPulse.setFillStyle(0x9b87f5, 0.95)
      return
    }

    if (this.moveRejectHint === 'wall') {
      this.hudRhythm.setText('In window — blocked (wall or occupied)')
      this.hudRhythm.setColor('#ffb86b')
      this.beatPulse.setFillStyle(0xff9f43, 0.95)
      return
    }

    const skew = offMs === 0 ? 'on center' : offMs < 0 ? `${absOff} ms early` : `${absOff} ms late`
    this.hudRhythm.setText(`In window (${skew}) — ready to step`)
    this.hudRhythm.setColor('#b8f5c8')
    this.beatPulse.setFillStyle(0xffc857, 0.95)
  }

  private freezeGame(message: string): void {
    this.gameFrozen = true
    this.overlayText.setText(message)
    this.overlay.setVisible(true)
  }

  /** Full campaign restart (vault I). */
  private resetRun(): void {
    this.currentLevelIndex = 0
    this.awaitingNextLevel = false
    this.procRunSalt = (Date.now() ^ (Math.floor(Math.random() * 0x7fffffff) >>> 0)) >>> 0
    this.loadCurrentLevel()
  }

  private computeLevelDef(): LevelDef {
    if (this.currentLevelIndex < DUNGEON_LEVELS.length) {
      return DUNGEON_LEVELS[this.currentLevelIndex]
    }
    const depth = this.currentLevelIndex + 1
    const seed = (this.procRunSalt ^ Math.imul(this.currentLevelIndex, 0x9e3779b9)) >>> 0
    const gen = generateProceduralLevel(seed)
    return {
      ...gen,
      title: `∞ · Depth ${depth} (seed ${(seed % 100000).toString().padStart(5, '0')})`,
    }
  }

  /** Reload current vault layout and rhythm state. */
  private loadCurrentLevel(): void {
    this.paused = false
    this.pauseLayer.setVisible(false)
    this.gameFrozen = false
    this.overlay.setVisible(false)

    this.cachedLevelDef = this.computeLevelDef()
    const def = this.cachedLevelDef
    this.world = new GridWorld(def)
    this.simulationBeatOrdinal = 0
    this.lastConsumedRhythmBeat = Number.MIN_SAFE_INTEGER

    const bw = def.width * TILE
    const bh = def.height * TILE
    this.boardOriginX = Math.max(20, (this.scale.width - bw) / 2)
    this.boardOriginY = Math.max(92, (this.scale.height - bh) / 2 + 6)

    this.tileSprites.forEach((row) => row.forEach((img) => img.destroy()))
    this.tileSprites = []
    this.entityViews.forEach((img) => img.destroy())
    this.entityViews.clear()

    for (let y = 0; y < this.world.height; y++) {
      const row: Phaser.GameObjects.Image[] = []
      for (let x = 0; x < this.world.width; x++) {
        const wall = this.world.isWall(x, y)
        const img = this.add.image(
          this.boardOriginX + x * TILE + TILE / 2,
          this.boardOriginY + y * TILE + TILE / 2,
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
      const px = this.boardOriginX + e.x * TILE + TILE / 2
      const py = this.boardOriginY + e.y * TILE + TILE / 2
      const key = this.textureForEntity(e)
      if (!img) {
        img = this.add.image(px, py, key).setDepth(5).setScale(ENTITY_SCALE)
        this.entityViews.set(e.id, img)
      } else {
        img.setTexture(key)
        img.setPosition(px, py)
        img.setScale(ENTITY_SCALE)
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
    const def = this.cachedLevelDef
    const curated = DUNGEON_LEVELS.length
    const tag =
      this.currentLevelIndex < curated
        ? `${this.currentLevelIndex + 1}/${curated} · hand-made`
        : `${this.currentLevelIndex + 1} · random`
    this.hudVault.setText(`${def.title ?? 'Vault'}   ·   ${tag}`)
    this.hudHp.setText(`HP ${hp}   •   enemies ${this.world.listEnemies().length}`)
    this.hudBpm.setText(
      `BPM ${Math.round(this.beat.bpm)}   •   timing ±${this.beat.halfWindowMs} ms${this.beat.isMuted ? '   •   metronome off' : ''}`,
    )
  }

  /** Hostile read: warm tint + slight breathe on enemies only. */
  private applyEnemyPresentation(): void {
    if (this.gameFrozen || this.paused) return
    const w = Math.sin(this.time.now / 260)
    for (const e of this.world.snapshotEntities()) {
      const img = this.entityViews.get(e.id)
      if (!img) continue
      if (e.kind === 'player') {
        img.clearTint()
        img.setScale(ENTITY_SCALE)
        continue
      }
      const u = (w + 1) * 0.5
      const g = Math.floor(95 + 75 * u)
      const b = Math.floor(100 + 55 * u)
      img.setTint((255 << 16) | (g << 8) | b)
      img.setScale(ENTITY_SCALE * (1 + 0.05 * w))
    }
  }
}
