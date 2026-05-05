import Phaser from "phaser";
import { chance, rndBetween } from "../rngHelper";

export class YarnBallObstacle {
  static create(scene, x, difficulty, scrollSpeed) {
    const group = scene.add.group();
    const worldH = scene.game.registry.get("worldHeight") ?? scene.scale.height;
    const cyMin = 250;
    const cyMax = Math.max(cyMin + 100, worldH - 300);
    const centerY = rndBetween(scene, cyMin, cyMax);
    const gap = Phaser.Math.Clamp(222 - difficulty * 9, 162, 242);
    const topY = centerY - gap / 2;
    const bottomY = centerY + gap / 2;

    const topBall = scene.physics.add.image(x, topY - 40, "yarn_ball");
    const bottomBall = scene.physics.add.image(x, bottomY + 40, "yarn_ball");
    [topBall, bottomBall].forEach((ball) => {
      ball.body.allowGravity = false;
      ball.body.immovable = true;
      ball.setVelocityX(-scrollSpeed);
      ball.setCircle(18, 4, 4);
      ball.refreshBody();
      group.add(ball);
    });

    topBall.setAngle(rndBetween(scene, -18, 18));
    bottomBall.setAngle(rndBetween(scene, -18, 18));

    const moving = !chance(scene, 0.35) ? (chance(scene, 0.5) ? topBall : bottomBall) : null;
    if (moving) {
      scene.tweens.add({
        targets: moving,
        y: moving.y + rndBetween(scene, -55, 55),
        duration: rndBetween(scene, 500, 900),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }

    const scoreZone = scene.add.zone(x + 58, centerY, 18, worldH);
    scene.physics.add.existing(scoreZone);
    scoreZone.body.allowGravity = false;
    scoreZone.body.setVelocityX(-scrollSpeed);

    return { group, scoreZone };
  }
}
