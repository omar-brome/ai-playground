import Phaser from "phaser";
import { getEffectsTier, getMilestoneBudget } from "./PerformanceBudget";
import { rndBetween } from "./rngHelper";

const CONFETTI_COLORS = [
  0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xff85c0, 0xa78bfa, 0x00d4ff, 0xffa94d
];

const FIREWORK_TINTS = [0xff3355, 0xffcc00, 0x00ffaa, 0xff66cc, 0x66ccff, 0x99ff66];

/**
 * Reuses rectangle shapes for confetti instead of allocating hundreds per milestone.
 */
class ConfettiRectPool {
  constructor(scene, maxFree) {
    this.scene = scene;
    this.maxFree = maxFree;
    /** @type {Phaser.GameObjects.Rectangle[]} */
    this.free = [];
  }

  borrow(x, y, w, h, color) {
    let r = this.free.pop();
    if (!r) {
      r = this.scene.add.rectangle(x, y, w, h, color);
      r.setDepth(55);
    } else {
      r.setPosition(x, y);
      r.setSize(w, h);
      r.setFillStyle(color, 1);
      r.angle = 0;
      r.setAlpha(0.95);
      r.setVisible(true);
    }
    return r;
  }

  release(r) {
    if (!r?.active) {
      return;
    }
    this.scene.tweens.killTweensOf(r);
    r.setVisible(false);
    if (this.free.length < this.maxFree) {
      this.free.push(r);
    } else {
      r.destroy();
    }
  }

  destroyAll() {
    this.free.forEach((r) => r.destroy());
    this.free = [];
  }
}

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.confettiPool = new ConfettiRectPool(scene, 110);
    scene.events.once("shutdown", () => {
      this.confettiPool?.destroyAll();
      this.confettiPool = null;
    });
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

  /** Brief red vignette when grace absorbs a hit (near-miss). */
  nearMissVignette() {
    const { width, height } = this.scene.scale;
    const v = this.scene.add.rectangle(width / 2, height / 2, width + 4, height + 4, 0xff2233, 0.38);
    v.setDepth(150);
    v.setScrollFactor(0);
    this.scene.tweens.add({
      targets: v,
      alpha: 0,
      duration: 220,
      ease: "Quad.Out",
      onComplete: () => v.destroy()
    });
  }

  /**
   * Full-screen confetti drift + staggered firework bursts at milestone scores.
   * Particle counts scale down on low-end devices; confetti rects are pooled.
   * @param {number} milestoneScore
   */
  milestoneCelebration(milestoneScore) {
    const pool = this.confettiPool;
    if (!pool) {
      return;
    }

    const { width, height } = this.scene.scale;
    const tier = getEffectsTier();
    const budget = getMilestoneBudget(tier);
    const big50 = milestoneScore >= 50;

    let confettiCount = budget.confetti;
    let bursts = budget.bursts;
    if (big50) {
      if (tier === "high") {
        confettiCount += 12;
        bursts += 2;
      } else if (tier === "medium") {
        confettiCount += 8;
        bursts += 1;
      } else {
        confettiCount += 4;
      }
    }
    confettiCount = Math.min(confettiCount, 95);

    for (let i = 0; i < confettiCount; i += 1) {
      const x = rndBetween(this.scene, 16, Math.max(16, width - 16));
      const startY = rndBetween(this.scene, -140, -10);
      const color = Phaser.Math.RND.pick(CONFETTI_COLORS);
      const w = rndBetween(this.scene, 5, 9);
      const h = rndBetween(this.scene, 7, 14);
      const rect = pool.borrow(x, startY, w, h, color);
      this.scene.tweens.add({
        targets: rect,
        y: height + 60,
        x: x + rndBetween(this.scene, -160, 160),
        angle: rndBetween(this.scene, -480, 480),
        duration: rndBetween(this.scene, 2000, 3200),
        ease: "Cubic.easeIn",
        onComplete: () => pool.release(rect)
      });
    }

    const qtyBase = budget.fireworkQty;

    for (let b = 0; b < bursts; b += 1) {
      this.scene.time.delayedCall(b * budget.stagger, () => {
        const fx = rndBetween(this.scene, 48, Math.max(48, width - 48));
        const fy = rndBetween(
          this.scene,
          72,
          Math.max(72, Math.min(height * 0.52, height - 140))
        );
        const tint = Phaser.Math.RND.pick(FIREWORK_TINTS);
        const qty = big50 ? Math.min(qtyBase + 10, 60) : qtyBase;
        const particles = this.scene.add.particles(fx, fy, "spark", {
          speed: { min: 70, max: 220 },
          angle: { min: 0, max: 360 },
          lifespan: { min: 420, max: 950 },
          quantity: qty,
          scale: { start: 1.05, end: 0 },
          alpha: { start: 1, end: 0 },
          tint,
          blendMode: "ADD"
        });
        particles.setDepth(56);
        this.scene.time.delayedCall(1000, () => particles.destroy());
      });
    }

    this.scene.cameras.main.flash(90, 248, 252, 255, false);
  }
}
