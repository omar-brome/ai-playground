import Phaser from "phaser";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("game-over");
  }

  create(data) {
    const { width, height } = this.scale;
    const score = data?.score ?? 0;
    const best = data?.best ?? score;

    this.add.rectangle(width / 2, height / 2, width, height, 0x95d2ff);
    this.add.text(width / 2, 190, "Cat-astrophe!", {
      fontSize: "52px",
      color: "#17395c",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(width / 2, 315, `Score: ${score}`, {
      fontSize: "38px",
      color: "#ffffff",
      stroke: "#315f83",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 370, `Best: ${best}`, {
      fontSize: "30px",
      color: "#f7fbff"
    }).setOrigin(0.5);

    const playAgain = this.add.rectangle(width / 2, 500, 245, 66, 0xff9bbd)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, 500, "Restart", {
      fontSize: "30px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const menuButton = this.add.rectangle(width / 2, 580, 245, 58, 0x64b7e8)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, 580, "Main Menu", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    playAgain.on("pointerdown", () => this.scene.start("game"));
    menuButton.on("pointerdown", () => this.scene.start("menu"));

    this.input.keyboard.once("keydown-SPACE", () => this.scene.start("game"));
    this.input.once("pointerdown", () => this.scene.start("game"));
  }
}
