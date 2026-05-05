import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0xbfe8ff);
    this.add.text(width / 2, 140, "Flappy Cat", {
      fontSize: "56px",
      color: "#1a3957",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(width / 2, 200, "Laundry. Furniture. Dogs. Chaos.", {
      fontSize: "20px",
      color: "#315f83"
    }).setOrigin(0.5);

    const cat = this.add.image(width / 2, 320, "cat").setScale(1.5);
    this.tweens.add({
      targets: cat,
      y: cat.y - 8,
      angle: -6,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const button = this.add.rectangle(width / 2, 470, 210, 66, 0xff9bbd, 1)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, 470, "Play", {
      fontSize: "32px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(width / 2, 555, "Press Space or Tap to jump", {
      fontSize: "18px",
      color: "#315f83"
    }).setOrigin(0.5);

    button.on("pointerdown", () => this.scene.start("game"));
    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("game"));
    this.input.once("pointerdown", () => this.scene.start("game"));
  }
}
