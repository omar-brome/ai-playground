import Phaser from "phaser";

export class ObstacleManager {
  constructor(scene, options) {
    this.scene = scene;
    this.catSprite = options.catSprite;
    this.onPass = options.onPass;
    this.onHit = options.onHit;
    this.scrollSpeed = 175;
    this.spawnIntervalMs = 1450;
    this.elapsed = 0;
    this.obstacles = [];
    this.registry = [];
  }

  register(typeName, createFn, weight = 1) {
    this.registry.push({ typeName, createFn, weight });
  }

  start() {
    this.spawnNow();
  }

  update(deltaMs, difficulty) {
    this.elapsed += deltaMs;
    this.scrollSpeed = Phaser.Math.Linear(this.scrollSpeed, 175 + difficulty * 45, 0.04);
    this.spawnIntervalMs = Phaser.Math.Clamp(1450 - difficulty * 180, 920, 1450);

    if (this.elapsed >= this.spawnIntervalMs) {
      this.elapsed = 0;
      this.spawnNow(difficulty);
    }

    this.obstacles = this.obstacles.filter((entry) => {
      const alive = entry.scoreZone.x > -80;
      if (!alive) {
        entry.group.destroy(true, true);
        entry.scoreZone.destroy();
      }
      return alive;
    });
  }

  spawnNow(difficulty = 0) {
    if (!this.registry.length) {
      return;
    }

    const selected = this.pickByWeight();
    const spawnX = this.scene.scale.width + 80;
    const obstacle = selected.createFn(this.scene, spawnX, difficulty, this.scrollSpeed);
    obstacle.scored = false;

    this.scene.physics.add.overlap(this.catSprite, obstacle.group, () => {
      this.onHit();
    });

    this.scene.physics.add.overlap(this.catSprite, obstacle.scoreZone, () => {
      if (obstacle.scored) {
        return;
      }
      obstacle.scored = true;
      this.onPass(obstacle.scoreZone.x, this.catSprite.y);
      obstacle.scoreZone.destroy();
    });

    this.obstacles.push(obstacle);
  }

  pickByWeight() {
    const total = this.registry.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of this.registry) {
      roll -= item.weight;
      if (roll <= 0) {
        return item;
      }
    }
    return this.registry[0];
  }
}
