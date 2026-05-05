import Phaser from "phaser";

export class DogPatrolObstacle {
  static create(scene, x, difficulty, scrollSpeed) {
    const group = scene.physics.add.group();
    const centerY = Phaser.Math.Between(260, 560);
    const gap = Phaser.Math.Clamp(180 - difficulty * 16, 120, 180);
    const topY = centerY - gap / 2 - 38;
    const bottomY = centerY + gap / 2 + 38;

    const topDog = scene.physics.add.image(x, topY, "dog").setScale(0.95);
    const bottomDog = scene.physics.add.image(x, bottomY, "dog").setScale(0.95);
    [topDog, bottomDog].forEach((dog) => {
      dog.body.allowGravity = false;
      dog.body.immovable = true;
      dog.setVelocityX(-scrollSpeed);
      group.add(dog);
    });

    topDog.setTint(0xe6cfb5);
    bottomDog.setTint(0xcda17b);

    if (Math.random() > 0.45) {
      const movingDog = Math.random() > 0.5 ? topDog : bottomDog;
      scene.tweens.add({
        targets: movingDog,
        y: movingDog.y + Phaser.Math.Between(-40, 40),
        duration: Phaser.Math.Between(800, 1200),
        yoyo: true,
        repeat: -1
      });
    }

    const scoreZone = scene.add.zone(x + 70, centerY, 16, scene.scale.height);
    scene.physics.add.existing(scoreZone);
    scoreZone.body.allowGravity = false;
    scoreZone.body.setVelocityX(-scrollSpeed);

    return { group, scoreZone };
  }
}
