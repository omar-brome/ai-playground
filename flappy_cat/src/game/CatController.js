import Phaser from "phaser";

export class CatController {
  constructor(scene, x, y) {
    this.scene = scene;
    this.jumpVelocity = -310;
    this.gravity = 900;
    this.maxFall = 420;

    this.sprite = scene.physics.add.image(x, y, "cat");
    this.sprite.setScale(1.05);
    this.sprite.setCircle(20, 8, 2);
    this.sprite.setCollideWorldBounds(false);
    this.sprite.body.setAllowGravity(false);

    this.idleTween = scene.tweens.add({
      targets: this.sprite,
      y: y - 5,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  start() {
    if (this.idleTween) {
      this.idleTween.stop();
    }
  }

  flap() {
    this.sprite.body.velocity.y = this.jumpVelocity;
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.11,
      scaleY: 1.01,
      duration: 70,
      yoyo: true
    });
  }

  update(deltaS) {
    const body = this.sprite.body;
    body.velocity.y += this.gravity * deltaS;
    if (body.velocity.y > this.maxFall) {
      body.velocity.y = this.maxFall;
    }

    const targetAngle = Phaser.Math.Clamp(body.velocity.y * 0.09, -25, 70);
    this.sprite.angle = Phaser.Math.Linear(this.sprite.angle, targetAngle, 0.12);
  }
}
