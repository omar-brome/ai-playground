import Phaser from "phaser";
import { CatController } from "../game/CatController";
import { InputController } from "../game/InputController";
import { ObstacleManager } from "../game/ObstacleManager";
import { LaundryObstacle } from "../game/obstacles/LaundryObstacle";
import { FurnitureObstacle } from "../game/obstacles/FurnitureObstacle";
import { DogPatrolObstacle } from "../game/obstacles/DogPatrolObstacle";
import { ScoreSystem } from "../game/ScoreSystem";
import { Effects } from "../game/Effects";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
  }

  create() {
    const { width, height } = this.scale;
    this.state = "running";
    this.timeAlive = 0;
    this.bg = this.add.rectangle(width / 2, height / 2, width, height, 0xbfe8ff);
    this.add.rectangle(width / 2, height - 34, width, 68, 0xd0f2bd);

    this.inputController = new InputController(this);
    this.inputController.bind();

    this.cat = new CatController(this, width * 0.3, height * 0.45);
    this.cat.start();

    this.effects = new Effects(this);
    this.scoreSystem = new ScoreSystem();

    this.scoreText = this.add.text(width / 2, 42, "0", {
      fontSize: "54px",
      color: "#ffffff",
      stroke: "#315f83",
      strokeThickness: 8,
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.obstacles = new ObstacleManager(this, {
      catSprite: this.cat.sprite,
      onPass: (x, y) => this.handlePass(x, y),
      onHit: () => this.gameOver()
    });
    this.obstacles.register("laundry", LaundryObstacle.create, 1.2);
    this.obstacles.register("furniture", FurnitureObstacle.create, 1.0);
    this.obstacles.register("dog", DogPatrolObstacle.create, 0.9);
    this.obstacles.start();
  }

  update(_time, deltaMs) {
    if (this.state !== "running") {
      return;
    }

    const deltaS = deltaMs / 1000;
    this.timeAlive += deltaS;

    if (this.inputController.update()) {
      this.cat.flap();
    }

    this.cat.update(deltaS);
    const difficulty = Math.min(this.timeAlive / 35, 2.5);
    this.obstacles.update(deltaMs, difficulty);

    if (this.cat.sprite.y < -20 || this.cat.sprite.y > this.scale.height + 20) {
      this.gameOver();
    }
  }

  handlePass(x, y) {
    const score = this.scoreSystem.increment();
    this.scoreText.setText(String(score));
    this.effects.scoreBurst(x, y);
  }

  gameOver() {
    if (this.state !== "running") {
      return;
    }
    this.state = "over";
    this.effects.hitShake();
    this.time.delayedCall(260, () => {
      this.scene.start("game-over", {
        score: this.scoreSystem.score,
        best: this.scoreSystem.best
      });
    });
  }
}
