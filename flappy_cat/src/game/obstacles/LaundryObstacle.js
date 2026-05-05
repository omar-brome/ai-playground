import Phaser from "phaser";

export class LaundryObstacle {
  static create(scene, x, difficulty, scrollSpeed) {
    const group = scene.physics.add.group();
    const centerY = Phaser.Math.Between(270, 560);
    const gap = Phaser.Math.Clamp(200 - difficulty * 18, 130, 200);

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
    const shirtCount = Phaser.Math.Between(2, 3);
    for (let i = 0; i < shirtCount; i += 1) {
      const topShirt = scene.physics.add.image(x + Phaser.Math.Between(-28, 28), topY - Phaser.Math.Between(4, 24), "shirt");
      topShirt.body.allowGravity = false;
      topShirt.body.immovable = true;
      topShirt.setVelocityX(-scrollSpeed);
      group.add(topShirt);
      shirts.push(topShirt);

      if (Math.random() > 0.5) {
        scene.tweens.add({
          targets: topShirt,
          y: topShirt.y + Phaser.Math.Between(-18, 18),
          duration: Phaser.Math.Between(700, 1200),
          yoyo: true,
          repeat: -1
        });
      }
    }

    const scoreZone = scene.add.zone(x + 55, centerY, 16, scene.scale.height);
    scene.physics.add.existing(scoreZone);
    scoreZone.body.allowGravity = false;
    scoreZone.body.setVelocityX(-scrollSpeed);

    return { group, scoreZone, extras: shirts };
  }
}
