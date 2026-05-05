import Phaser from "phaser";
import { rndBetween } from "../rngHelper";

const TYPES = ["sofa", "table", "chair"];

export class FurnitureObstacle {
  static create(scene, x, difficulty, scrollSpeed) {
    const group = scene.add.group();
    const worldH = scene.game.registry.get("worldHeight") ?? scene.scale.height;
    const cyMin = 270;
    const cyMax = Math.max(cyMin + 100, worldH - 310);
    const centerY = rndBetween(scene, cyMin, cyMax);
    const gap = Phaser.Math.Clamp(238 - difficulty * 11, 172, 260);
    const topLimit = centerY - gap / 2;
    const bottomLimit = centerY + gap / 2;

    const topStackCount = rndBetween(scene, 2, 4);
    let yTop = topLimit - 24;
    for (let i = 0; i < topStackCount; i += 1) {
      const key = TYPES[rndBetween(scene, 0, TYPES.length - 1)];
      const piece = scene.physics.add.image(x + rndBetween(scene, -6, 6), yTop, key);
      piece.body.allowGravity = false;
      piece.body.immovable = true;
      piece.setVelocityX(-scrollSpeed);
      group.add(piece);
      yTop -= piece.displayHeight * 0.85;
    }

    const bottomStackCount = rndBetween(scene, 2, 4);
    let yBottom = bottomLimit + 24;
    for (let i = 0; i < bottomStackCount; i += 1) {
      const key = TYPES[rndBetween(scene, 0, TYPES.length - 1)];
      const piece = scene.physics.add.image(x + rndBetween(scene, -6, 6), yBottom, key);
      piece.body.allowGravity = false;
      piece.body.immovable = true;
      piece.setVelocityX(-scrollSpeed);
      group.add(piece);
      yBottom += piece.displayHeight * 0.82;
    }

    const scoreZone = scene.add.zone(x + 65, centerY, 16, worldH);
    scene.physics.add.existing(scoreZone);
    scoreZone.body.allowGravity = false;
    scoreZone.body.setVelocityX(-scrollSpeed);

    return { group, scoreZone };
  }
}
