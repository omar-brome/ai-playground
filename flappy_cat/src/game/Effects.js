export class Effects {
  constructor(scene) {
    this.scene = scene;
  }

  scoreBurst(x, y) {
    const particles = this.scene.add.particles(0, 0, "spark", {
      x,
      y,
      speed: { min: 40, max: 140 },
      lifespan: 360,
      quantity: 10,
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      blendMode: "ADD"
    });
    this.scene.time.delayedCall(420, () => particles.destroy());
  }

  hitShake() {
    this.scene.cameras.main.shake(210, 0.01);
  }
}
