import Phaser from "phaser";
import { chance, rndBetween } from "../rngHelper";

export class LaserObstacle {
  static create(scene, x, difficulty, scrollSpeed) {
    const group = scene.add.group();
    const worldH = scene.game.registry.get("worldHeight") ?? scene.scale.height;
    const cyMin = 290;
    const cyMax = Math.max(cyMin + 80, worldH - 300);
    const centerY = rndBetween(scene, cyMin, cyMax);
    const gap = Phaser.Math.Clamp(210 - difficulty * 9, 158, 235);
    const topY = centerY - gap / 2 - 52;
    const bottomY = centerY + gap / 2 + 52;

    const mountTop = scene.physics.add.image(x - 44, topY, "post").setOrigin(0.5, 1).setTint(0x7a624e);
    const mountBot = scene.physics.add.image(x - 44, bottomY, "post").setOrigin(0.5, 0).setTint(0x7a624e);
    [mountTop, mountBot].forEach((post) => {
      post.body.allowGravity = false;
      post.body.immovable = true;
      post.setVelocityX(-scrollSpeed);
      group.add(post);
    });

    const bar = scene.physics.add.image(x + 38, centerY, "laser_beam").setTint(0xff3355);
    bar.body.allowGravity = false;
    bar.body.immovable = true;
    bar.setVelocityX(-scrollSpeed);
    bar.setBlendMode(Phaser.BlendModes.ADD);
    group.add(bar);

    scene.tweens.add({
      targets: bar,
      y: centerY + rndBetween(scene, 70, 110) * (chance(scene, 0.5) ? 1 : -1),
      duration: rndBetween(scene, 420, 700),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const scoreZone = scene.add.zone(x + 72, centerY, 18, worldH);
    scene.physics.add.existing(scoreZone);
    scoreZone.body.allowGravity = false;
    scoreZone.body.setVelocityX(-scrollSpeed);

    return { group, scoreZone };
  }
}
