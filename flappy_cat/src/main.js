import Phaser from "phaser";
import "./styles.css";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { OptionsScene } from "./scenes/OptionsScene";

const config = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: 480,
  height: 800,
  backgroundColor: "#bfe8ff",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, OptionsScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
