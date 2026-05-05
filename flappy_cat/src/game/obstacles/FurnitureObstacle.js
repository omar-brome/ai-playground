import Phaser from "phaser";

const TYPES = ["sofa", "table", "chair"];

export class FurnitureObstacle {
  static create(scene, x, difficulty, scrollSpeed) {
    const group = scene.physics.add.group();
    const centerY = Phaser.Math.Between(260, 560);
    const gap = Phaser.Math.Clamp(190 - difficulty * 15, 120, 190);
    const topLimit = centerY - gap / 2;
    const bottomLimit = centerY + gap / 2;

    const topStackCount = Phaser.Math.Between(2, 4);
    let yTop = topLimit - 24;
    for (let i = 0; i < topStackCount; i += 1) {
      const key = TYPES[Phaser.Math.Between(0, TYPES.length - 1)];
      const piece = scene.physics.add.image(x + Phaser.Math.Between(-6, 6), yTop, key);
      piece.body.allowGravity = false;
      piece.body.immovable = true;
      piece.setVelocityX(-scrollSpeed);
      group.add(piece);
      yTop -= piece.displayHeight * 0.85;
    }

    const bottomStackCount = Phaser.Math.Between(2, 4);
    let yBottom = bottomLimit + 24;
    for (let i = 0; i < bottomStackCount; i += 1) {
      const key = TYPES[Phaser.Math.Between(0, TYPES.length - 1)];
      const piece = scene.physics.add.image(x + Phaser.Math.Between(-6, 6), yBottom, key);
      piece.body.allowGravity = false;
      piece.body.immovable = true;
      piece.setVelocityX(-scrollSpeed);
      group.add(piece);
      yBottom += piece.displayHeight * 0.82;
    }

    const scoreZone = scene.add.zone(x + 65, centerY, 16, scene.scale.height);
    scene.physics.add.existing(scoreZone);
    scoreZone.body.allowGravity = false;
    scoreZone.body.setVelocityX(-scrollSpeed);

    return { group, scoreZone };
  }
}
