import Phaser from 'phaser'
import './styles.css'
import { AboutScene } from './scenes/AboutScene'
import { BootScene } from './scenes/BootScene'
import { BossScene } from './scenes/BossScene'
import { EditorScene } from './scenes/EditorScene'
import { GameOverScene } from './scenes/GameOverScene'
import { GameScene } from './scenes/GameScene'
import { LevelSelectScene } from './scenes/LevelSelectScene'
import { MenuScene } from './scenes/MenuScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 640,
  backgroundColor: '#060814',
  pixelArt: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1600, x: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, AboutScene, LevelSelectScene, GameScene, EditorScene, BossScene, GameOverScene],
}

new Phaser.Game(config)
