import Phaser from "phaser";

export class CatController {
  constructor(scene, x, y, options = {}) {
    this.scene = scene;
    this.onFlap = options.onFlap;
    this.jumpVelocity = -292;
    this.gravity = 780;
    this.maxFall = 420;

    this.sprite = scene.physics.add.image(x, y, "cat");
    if (options.tint !== undefined && options.tint !== 0xffffff) {
      this.sprite.setTint(options.tint);
    }
    this.sprite.setScale(1.05);
    this.sprite.setDepth(25);
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
    if (typeof this.onFlap === "function") {
      this.onFlap();
    }
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
