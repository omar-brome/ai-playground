import Phaser from 'phaser'
import { AudioEngine } from '../game/AudioEngine'
import { cloneLevel, exportLevel, importLevel } from '../game/levelCodec'
import { upsertCustomLevel } from '../game/saveData'
import type { EnemyKind, LevelDefinition, LevelEntityKind } from '../game/types'

type EditorTool = LevelEntityKind | EnemyKind | 'spawn' | 'erase'

const grid = 40

function makeBlankLevel(): LevelDefinition {
  return {
    id: `custom:${Date.now()}`,
    title: 'Custom Shadow Room',
    subtitle: 'Built in the Shadow Runner editor.',
    theme: 'custom',
    width: 1800,
    height: 760,
    spawn: { x: 120, y: 620 },
    platforms: [{ x: 0, y: 700, width: 360, height: 60 }],
    hazards: [],
    shards: [],
    enemies: [],
    checkpoints: [],
    exit: { x: 1650, y: 610, width: 70, height: 90 },
  }
}

export class EditorScene extends Phaser.Scene {
  private level: LevelDefinition = makeBlankLevel()
  private tool: EditorTool = 'tile'
  private layer!: Phaser.GameObjects.Layer
  private toolText!: Phaser.GameObjects.Text
  private statusText!: Phaser.GameObjects.Text
  private cameraKeys!: Phaser.Types.Input.Keyboard.CursorKeys
  private preview!: Phaser.GameObjects.Rectangle
  private toolButtons = new Map<EditorTool, Phaser.GameObjects.Rectangle>()
  private lastPaintKey = ''

  constructor() {
    super('EditorScene')
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, this.level.width, this.level.height)
    this.cameras.main.setBackgroundColor('#070914')
    this.cameraKeys = this.input.keyboard?.createCursorKeys() ?? ({} as Phaser.Types.Input.Keyboard.CursorKeys)
    this.drawGrid()
    this.layer = this.add.layer()
    this.renderLevel()
    this.createToolbar()
    this.createPreview()
    this.input.mouse?.disableContextMenu()
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handlePointer(pointer))
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.updatePreview(pointer)
      if (pointer.isDown && pointer.leftButtonDown()) this.handlePointer(pointer)
    })
    this.input.on('pointerup', () => {
      this.lastPaintKey = ''
    })
    this.registerHotkeys()
  }

  update(): void {
    const cam = this.cameras.main
    if (this.cameraKeys.left?.isDown) cam.scrollX -= 8
    if (this.cameraKeys.right?.isDown) cam.scrollX += 8
    if (this.cameraKeys.up?.isDown) cam.scrollY -= 8
    if (this.cameraKeys.down?.isDown) cam.scrollY += 8
  }

  private createToolbar(): void {
    const bg = this.add.rectangle(0, 0, 960, 86, 0x030510, 0.92).setOrigin(0).setScrollFactor(0).setDepth(100)
    bg.setStrokeStyle(1, 0x57f8d4, 0.25)
    this.toolText = this.add
      .text(18, 12, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        color: '#f7fbff',
      })
      .setScrollFactor(0)
      .setDepth(101)
    this.statusText = this.add
      .text(18, 88, 'Tip: Save stores custom levels in this browser and copies export JSON to your clipboard.', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#57f8d4',
        backgroundColor: 'rgba(3,5,16,0.72)',
        padding: { x: 8, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(101)

    const tools: [EditorTool, string][] = [
      ['tile', 'Tile'],
      ['hazard', 'Hazard'],
      ['shard', 'Shard'],
      ['drone', 'Drone'],
      ['turret', 'Turret'],
      ['chaser', 'Chaser'],
      ['checkpoint', 'CP'],
      ['exit', 'Exit'],
      ['spawn', 'Spawn'],
      ['erase', 'Erase'],
    ]
    tools.forEach(([tool, label], index) => this.button(18 + index * 78, 42, 70, label, () => this.setTool(tool), tool))
    this.button(810, 10, 62, 'Play', () => this.scene.start('GameScene', { playtestLevel: cloneLevel(this.level) }))
    this.button(878, 10, 62, 'Menu', () => this.scene.start('MenuScene'))
    this.button(810, 48, 62, 'Save', () => this.saveLevel())
    this.button(878, 48, 62, 'Import', () => this.importFromPrompt())
    this.updateToolText()
  }

  private button(
    x: number,
    y: number,
    width: number,
    label: string,
    onClick: () => void,
    tool?: EditorTool,
  ): void {
    const bg = this.add
      .rectangle(x, y, width, 28, 0x101a3d, 0.94)
      .setOrigin(0)
      .setStrokeStyle(1, 0x57f8d4, 0.45)
      .setScrollFactor(0)
      .setDepth(101)
    this.add
      .text(x + 8, y + 7, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f7fbff',
      })
      .setScrollFactor(0)
      .setDepth(102)
    this.add
      .zone(x, y, width, 28)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(103)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        AudioEngine.play(this, 'select')
        onClick()
      })
      .on('pointerover', () => bg.setFillStyle(0x17345c, 0.96))
      .on('pointerout', () => bg.setFillStyle(tool === this.tool ? 0x1d4a68 : 0x101a3d, 0.94))
    if (tool) this.toolButtons.set(tool, bg)
  }

  private setTool(tool: EditorTool): void {
    this.tool = tool
    for (const [key, bg] of this.toolButtons) {
      bg.setFillStyle(key === tool ? 0x1d4a68 : 0x101a3d, 0.94)
      bg.setStrokeStyle(1, key === tool ? 0xffd166 : 0x57f8d4, key === tool ? 0.95 : 0.45)
    }
    this.updateToolText()
    this.setStatus(`Selected ${tool}. Click or drag in the world to place it.`)
  }

  private updateToolText(): void {
    this.toolText.setText(`Tool: ${this.tool}  |  Click/drag to place. Right-click erases. Levels save in browser localStorage.`)
  }

  private handlePointer(pointer: Phaser.Input.Pointer): void {
    if (this.isToolbarPointer(pointer)) return
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    if (pointer.rightButtonDown()) {
      this.setTool('erase')
      this.applyTool(world.x, world.y)
      return
    }
    if (pointer.leftButtonDown()) this.applyTool(world.x, world.y)
  }

  private applyTool(rawX: number, rawY: number): void {
    const x = Math.floor(rawX / grid) * grid
    const y = Math.floor(rawY / grid) * grid
    const paintKey = `${this.tool}:${x}:${y}`
    if (paintKey === this.lastPaintKey) return
    this.lastPaintKey = paintKey
    if (this.tool === 'erase') {
      this.eraseAt(x, y)
    } else if (this.tool === 'tile') {
      this.level.platforms.push({ x, y, width: grid * 3, height: grid })
    } else if (this.tool === 'hazard') {
      this.level.hazards.push({ x, y, width: grid * 2, height: grid })
    } else if (this.tool === 'shard') {
      this.level.shards.push({ id: `s${Date.now()}`, x: x + grid / 2, y: y + grid / 2 })
    } else if (this.tool === 'checkpoint') {
      this.level.checkpoints.push({ id: `cp${Date.now()}`, x: x + grid / 2, y: y + grid })
    } else if (this.tool === 'exit') {
      this.level.exit = { x, y: y - grid, width: 70, height: 90 }
    } else if (this.tool === 'spawn') {
      this.level.spawn = { x: x + grid / 2, y }
    } else {
      this.level.enemies ??= []
      this.level.enemies.push({ id: `${this.tool}${Date.now()}`, kind: this.tool, x: x + grid / 2, y: y + grid / 2 })
    }
    this.renderLevel()
    this.setStatus(`${this.tool} placed at ${x}, ${y}.`)
  }

  private eraseAt(x: number, y: number): void {
    const near = (a: number, b: number, threshold = grid): boolean => Math.abs(a - b) < threshold
    this.level.platforms = this.level.platforms.filter((p) => !(near(p.x, x) && near(p.y, y)))
    this.level.hazards = this.level.hazards.filter((h) => !(near(h.x, x) && near(h.y, y)))
    this.level.shards = this.level.shards.filter((s) => !(near(s.x, x) && near(s.y, y)))
    this.level.checkpoints = this.level.checkpoints.filter((cp) => !(near(cp.x, x) && near(cp.y, y)))
    this.level.enemies = (this.level.enemies ?? []).filter((e) => !(near(e.x, x) && near(e.y, y)))
  }

  private saveLevel(): void {
    const title = window.prompt('Level title', this.level.title)?.trim() || this.level.title
    this.level.title = title
    const id = this.level.id.replace('custom:', '') || String(Date.now())
    upsertCustomLevel({
      id,
      title,
      updatedAt: new Date().toISOString(),
      level: { ...cloneLevel(this.level), id: `custom:${id}` },
    })
    const exported = exportLevel(this.level)
    void navigator.clipboard?.writeText(exported)
    this.updateToolText()
    this.setStatus(`Saved "${title}" to browser localStorage (shadow_runner_save_v1). Export JSON copied to clipboard.`)
  }

  private importFromPrompt(): void {
    const raw = window.prompt('Paste exported level JSON')
    if (!raw) return
    try {
      this.level = importLevel(raw)
      this.renderLevel()
      this.setStatus(`Imported "${this.level.title}".`)
    } catch (error) {
      this.setStatus(error instanceof Error ? error.message : 'Import failed.')
    }
  }

  private renderLevel(): void {
    this.layer?.destroy()
    this.layer = this.add.layer()
    this.drawGrid()
    for (const p of this.level.platforms) {
      this.layer.add(this.add.rectangle(p.x, p.y, p.width, p.height, 0x101a3d, 1).setOrigin(0).setStrokeStyle(1, 0x57f8d4, 0.35))
    }
    for (const h of this.level.hazards) {
      this.layer.add(this.add.rectangle(h.x, h.y, h.width, h.height, 0xff2d55, 0.75).setOrigin(0))
    }
    for (const s of this.level.shards) this.layer.add(this.add.image(s.x, s.y, 'shard'))
    for (const cp of this.level.checkpoints) this.layer.add(this.add.image(cp.x, cp.y, 'checkpoint').setOrigin(0.5, 1))
    for (const e of this.level.enemies ?? []) this.layer.add(this.add.image(e.x, e.y, 'enemy'))
    this.layer.add(this.add.rectangle(this.level.spawn.x, this.level.spawn.y, 26, 42, 0x57f8d4, 0.85))
    this.layer.add(this.add.image(this.level.exit.x, this.level.exit.y, 'exit').setOrigin(0).setDisplaySize(this.level.exit.width, this.level.exit.height))
  }

  private createPreview(): void {
    this.preview = this.add
      .rectangle(0, 0, grid, grid, 0x57f8d4, 0.2)
      .setOrigin(0)
      .setStrokeStyle(2, 0xffd166, 0.95)
      .setDepth(80)
      .setVisible(false)
  }

  private updatePreview(pointer: Phaser.Input.Pointer): void {
    if (this.isToolbarPointer(pointer)) {
      this.preview.setVisible(false)
      return
    }
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    const x = Math.floor(world.x / grid) * grid
    const y = Math.floor(world.y / grid) * grid
    const size = this.previewSize()
    this.preview.setPosition(x, y).setSize(size.width, size.height).setDisplaySize(size.width, size.height).setVisible(true)
    this.preview.setFillStyle(this.tool === 'hazard' || this.tool === 'erase' ? 0xff2d55 : 0x57f8d4, 0.18)
  }

  private previewSize(): { width: number; height: number } {
    if (this.tool === 'tile') return { width: grid * 3, height: grid }
    if (this.tool === 'hazard') return { width: grid * 2, height: grid }
    if (this.tool === 'exit') return { width: 70, height: 90 }
    if (this.tool === 'spawn') return { width: 26, height: 42 }
    return { width: grid, height: grid }
  }

  private isToolbarPointer(pointer: Phaser.Input.Pointer): boolean {
    return pointer.y < 118
  }

  private setStatus(message: string): void {
    this.statusText?.setText(message)
  }

  private registerHotkeys(): void {
    const tools: EditorTool[] = ['tile', 'hazard', 'shard', 'drone', 'turret', 'chaser', 'checkpoint', 'exit', 'spawn', 'erase']
    tools.forEach((tool, index) => {
      this.input.keyboard?.on(`keydown-${index === 9 ? 'ZERO' : index + 1}`, () => this.setTool(tool))
    })
    this.input.keyboard?.on('keydown-P', () => this.scene.start('GameScene', { playtestLevel: cloneLevel(this.level) }))
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MenuScene'))
  }

  private drawGrid(): void {
    const existing = this.children.getByName('editor-grid')
    existing?.destroy()
    const g = this.add.graphics().setName('editor-grid').setDepth(-10)
    g.lineStyle(1, 0x57f8d4, 0.08)
    for (let x = 0; x <= this.level.width; x += grid) g.lineBetween(x, 0, x, this.level.height)
    for (let y = 0; y <= this.level.height; y += grid) g.lineBetween(0, y, this.level.width, y)
  }
}
