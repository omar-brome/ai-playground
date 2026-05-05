import Phaser from "phaser";

export class ObstacleManager {
  constructor(scene, options) {
    this.scene = scene;
    this.catSprite = options.catSprite;
    this.onPass = options.onPass;
    this.onHit = options.onHit;
    this.zenMode = options.zenMode === true;
    /** World scroll multiplier (slow-mo power-up). */
    this.scrollMult = 1;
    this.scrollSpeed = this.zenMode ? 82 : 128;
    this.spawnIntervalMs = 2280;
    this.elapsed = 0;
    this.obstacles = [];
    this.registry = [];
  }

  register(typeName, createFn, weight = 1) {
    this.registry.push({ typeName, createFn, weight });
  }

  start() {
    const w = this.scene.scale.width;
    const stagger = 440;
    if (this.registry.length > 0) {
      const openingCount = Math.min(3, this.registry.length);
      for (let i = 0; i < openingCount; i += 1) {
        const reg = this.registry[i];
        const x = w + 140 + i * stagger;
        this.spawnFromRegistry(reg, x, 0);
      }
    }
  }

  update(deltaMs, difficulty) {
    const mult = this.scrollMult;
    this.elapsed += deltaMs * mult;
    const targetCap = this.zenMode ? 122 : 158;
    const diffBoost = this.zenMode ? 0 : difficulty * 32;
    this.scrollSpeed = Phaser.Math.Linear(this.scrollSpeed, targetCap + diffBoost, 0.025);
    if (this.zenMode) {
      this.spawnIntervalMs = Phaser.Math.Clamp(2680, 2100, 3100);
    } else {
      this.spawnIntervalMs = Phaser.Math.Clamp(2280 - difficulty * 120, 1500, 2400);
    }

    for (const entry of this.obstacles) {
      this.applyScrollToObstacle(entry);
    }

    if (this.elapsed >= this.spawnIntervalMs) {
      this.elapsed = 0;
      this.spawnNow(difficulty);
    }

    this.obstacles = this.obstacles.filter((entry) => {
      const alive = entry.scoreZone.x > -80;
      if (!alive) {
        entry.colliders?.forEach((c) => c.destroy());
        entry.group.destroy(true, true);
        if (entry.scoreZone?.active) {
          entry.scoreZone.destroy();
        }
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
    this.spawnFromRegistry(selected, spawnX, difficulty);
  }

  spawnFromRegistry(registryEntry, spawnX, difficulty) {
    const obstacle = registryEntry.createFn(
      this.scene,
      spawnX,
      difficulty,
      this.scrollSpeed * this.scrollMult
    );
    obstacle.scored = false;
    obstacle.colliders = [];

    // Physics.Arcade.Group resets body velocity to group defaults (0) when children are added — re-apply scroll.
    this.applyScrollToObstacle(obstacle);

    obstacle.group.getChildren().forEach((obj) => {
      obj.setDepth(15);
    });
    if (obstacle.scoreZone?.setDepth) {
      obstacle.scoreZone.setDepth(14);
    }

    obstacle.hitTag = registryEntry.typeName;

    obstacle.group.getChildren().forEach((obj) => {
      if (obj.body) {
        obstacle.colliders.push(
          this.scene.physics.add.overlap(this.catSprite, obj, () => {
            this.onHit(obstacle.hitTag);
          })
        );
      }
    });

    obstacle.colliders.push(
      this.scene.physics.add.overlap(this.catSprite, obstacle.scoreZone, () => {
        if (obstacle.scored || !obstacle.scoreZone?.active) {
          return;
        }
        obstacle.scored = true;
        this.onPass(obstacle.scoreZone.x, this.catSprite.y, obstacle.hitTag);
        obstacle.scoreZone.destroy();
      })
    );

    this.obstacles.push(obstacle);
  }

  applyScrollToObstacle(obstacle) {
    const vx = -this.scrollSpeed * this.scrollMult;
    obstacle.group.getChildren().forEach((obj) => {
      if (obj.body) {
        obj.setVelocityX(vx);
      }
    });
    if (obstacle.scoreZone?.body) {
      obstacle.scoreZone.body.setVelocityX(vx);
    }
  }

  pickByWeight() {
    const total = this.registry.reduce((sum, item) => sum + item.weight, 0);
    const rng = this.scene.game.registry.get("_dailyRng");
    let roll = rng ? rng.realInRange(0, total) : Math.random() * total;
    for (const item of this.registry) {
      roll -= item.weight;
      if (roll <= 0) {
        return item;
      }
    }
    return this.registry[0];
  }
}
