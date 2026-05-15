import Phaser from 'phaser'
import './styles.css'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'
import { PreloadScene } from './scenes/PreloadScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 640,
  backgroundColor: '#080510',
  pixelArt: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, GameScene],
}

new Phaser.Game(config)
