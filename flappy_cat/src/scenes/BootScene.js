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
    g.destroy();
  }
}
