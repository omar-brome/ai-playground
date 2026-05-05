import Phaser from "phaser";
import { chance, rndBetween } from "../rngHelper";

export class LaundryObstacle {
  static create(scene, x, difficulty, scrollSpeed) {
    const group = scene.add.group();
    const worldH = scene.game.registry.get("worldHeight") ?? scene.scale.height;
    const cyMin = 280;
    const cyMax = Math.max(cyMin + 100, worldH - 320);
    const centerY = rndBetween(scene, cyMin, cyMax);
    const gap = Phaser.Math.Clamp(255 - difficulty * 12, 188, 270);

    const topY = centerY - gap / 2;
    const bottomY = centerY + gap / 2;

    const topPost = scene.physics.add.image(x, topY - 85, "post").setOrigin(0.5, 1);
    const bottomPost = scene.physics.add.image(x, bottomY + 85, "post").setOrigin(0.5, 0);
    topPost.body.allowGravity = false;
    bottomPost.body.allowGravity = false;
    topPost.body.immovable = true;
    bottomPost.body.immovable = true;
    topPost.setVelocityX(-scrollSpeed);
    bottomPost.setVelocityX(-scrollSpeed);
    group.add(topPost);
    group.add(bottomPost);

    const shirts = [];
    const shirtCount = rndBetween(scene, 2, 3);
    for (let i = 0; i < shirtCount; i += 1) {
      const topShirt = scene.physics.add.image(
        x + rndBetween(scene, -28, 28),
        topY - rndBetween(scene, 4, 24),
        "shirt"
      );
      topShirt.body.allowGravity = false;
      topShirt.body.immovable = true;
      topShirt.setVelocityX(-scrollSpeed);
      group.add(topShirt);
      shirts.push(topShirt);

      if (chance(scene, 0.5)) {
        scene.tweens.add({
          targets: topShirt,
          y: topShirt.y + rndBetween(scene, -18, 18),
          duration: rndBetween(scene, 700, 1200),
          yoyo: true,
          repeat: -1
        });
      }
    }

    const scoreZone = scene.add.zone(x + 55, centerY, 16, worldH);
    scene.physics.add.existing(scoreZone);
    scoreZone.body.allowGravity = false;
    scoreZone.body.setVelocityX(-scrollSpeed);

    return { group, scoreZone, extras: shirts };
  }
}
