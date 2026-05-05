import Phaser from "phaser";
import { chance, rndBetween } from "../rngHelper";

export class DogPatrolObstacle {
  static create(scene, x, difficulty, scrollSpeed) {
    const group = scene.add.group();
    const worldH = scene.game.registry.get("worldHeight") ?? scene.scale.height;
    const cyMin = 270;
    const cyMax = Math.max(cyMin + 100, worldH - 310);
    const centerY = rndBetween(scene, cyMin, cyMax);
    const gap = Phaser.Math.Clamp(228 - difficulty * 10, 165, 248);
    const topY = centerY - gap / 2 - 38;
    const bottomY = centerY + gap / 2 + 38;

    const topDog = scene.physics.add.image(x, topY, "dog").setScale(0.95);
    const bottomDog = scene.physics.add.image(x, bottomY, "dog").setScale(0.95);
    [topDog, bottomDog].forEach((dog) => {
      dog.body.allowGravity = false;
      dog.body.immovable = true;
      dog.setVelocityX(-scrollSpeed);
      dog.refreshBody();
      group.add(dog);
    });

    topDog.setTint(0xe6cfb5);
    bottomDog.setTint(0xcda17b);

    if (!chance(scene, 0.45)) {
      const movingDog = chance(scene, 0.5) ? topDog : bottomDog;
      scene.tweens.add({
        targets: movingDog,
        y: movingDog.y + rndBetween(scene, -40, 40),
        duration: rndBetween(scene, 800, 1200),
        yoyo: true,
        repeat: -1
      });
    }

    const scoreZone = scene.add.zone(x + 70, centerY, 16, worldH);
    scene.physics.add.existing(scoreZone);
    scoreZone.body.allowGravity = false;
    scoreZone.body.setVelocityX(-scrollSpeed);

    return { group, scoreZone };
  }
}
