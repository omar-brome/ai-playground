import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create() {
    this.createTextures();
    this.scene.start("menu");
  }

  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0xffd28a, 1);
    g.fillRoundedRect(0, 0, 56, 42, 12);
    g.fillStyle(0x5a3c2a, 1);
    g.fillCircle(16, 14, 8);
    g.fillCircle(40, 14, 8);
    g.fillStyle(0x222222, 1);
    g.fillCircle(20, 19, 2);
    g.fillCircle(36, 19, 2);
    g.fillStyle(0xff7aa2, 1);
    g.fillRoundedRect(23, 22, 10, 6, 3);
    g.generateTexture("cat", 56, 42);
    g.clear();

    g.fillStyle(0xfaf2e2, 1);
    g.fillRoundedRect(0, 0, 60, 18, 5);
    g.generateTexture("shirt", 60, 18);
    g.clear();

    g.fillStyle(0x8c6d62, 1);
    g.fillRoundedRect(0, 0, 88, 34, 8);
    g.generateTexture("sofa", 88, 34);
    g.clear();

    g.fillStyle(0xb08f72, 1);
    g.fillRoundedRect(0, 0, 58, 26, 5);
    g.generateTexture("table", 58, 26);
    g.clear();

    g.fillStyle(0xd0ae86, 1);
    g.fillRoundedRect(0, 0, 44, 24, 4);
    g.generateTexture("chair", 44, 24);
    g.clear();

    g.fillStyle(0xa4836a, 1);
    g.fillEllipse(32, 18, 64, 30);
    g.fillStyle(0x3d2f2c, 1);
    g.fillCircle(18, 17, 3);
    g.fillCircle(40, 17, 3);
    g.generateTexture("dog", 64, 36);
    g.clear();

    g.fillStyle(0x9e6d50, 1);
    g.fillRect(0, 0, 14, 110);
    g.generateTexture("post", 14, 110);
    g.clear();

    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture("spark", 8, 8);
    g.clear();

    g.fillStyle(0xf5f5f5, 1);
    g.fillCircle(22, 22, 20);
    g.fillStyle(0xffb6c6, 1);
    g.fillCircle(30, 14, 7);
    g.lineStyle(3, 0xdddddd, 1);
    g.beginPath();
    g.arc(22, 22, 16, 0.2, 1.1);
    g.strokePath();
    g.generateTexture("yarn_ball", 44, 44);
    g.clear();

    g.fillStyle(0xff3355, 1);
    g.fillRoundedRect(0, 0, 132, 12, 4);
    g.fillStyle(0xffaac8, 0.55);
    g.fillRoundedRect(8, 2, 116, 4, 2);
    g.generateTexture("laser_beam", 132, 12);
    g.clear();

    g.fillStyle(0xff9a4a, 1);
    g.fillEllipse(18, 12, 34, 20);
    g.fillStyle(0xffc896, 1);
    g.fillEllipse(12, 12, 18, 12);
    g.fillStyle(0x2a2a2a, 1);
    g.fillCircle(26, 10, 2);
    g.fillStyle(0xff8a3c, 1);
    g.fillRoundedRect(0, 8, 12, 10, 3);
    g.generateTexture("fish", 36, 24);
    g.clear();

    g.fillStyle(0x7ecfff, 0.65);
    g.fillCircle(20, 20, 17);
    g.lineStyle(3, 0xffffff, 1);
    g.strokeCircle(20, 20, 17);
    g.fillStyle(0xffffff, 0.95);
    g.fillRect(18, 10, 4, 14);
    g.fillRect(12, 22, 16, 4);
    g.generateTexture("pickup_shield", 40, 40);
    g.clear();

    g.fillStyle(0x223344, 1);
    g.fillCircle(20, 20, 18);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 20, 11);
    g.lineStyle(2, 0x4466aa, 1);
    g.beginPath();
    g.arc(20, 20, 9, -Math.PI / 2, 0, false);
    g.strokePath();
    g.lineStyle(3, 0xaa4466, 1);
    g.lineBetween(20, 20, 26, 14);
    g.generateTexture("pickup_slowmo", 40, 40);
    g.clear();

    g.fillStyle(0xff5566, 1);
    g.fillCircle(22, 24, 5);
    g.fillStyle(0xcc2233, 1);
    g.fillRect(10, 10, 6, 18);
    g.fillRect(22, 10, 6, 18);
    g.fillRect(10, 8, 18, 8);
    g.generateTexture("pickup_magnet", 44, 44);
    g.destroy();
  }
}
