import Phaser from "phaser";
import { getGraphicsQuality, cycleGraphicsQuality, isMuted, toggleMuted } from "../game/GameSettings";
import { preloadAllSfx, primeGameAudio } from "../game/GameAudio";
import { startThemeMusic } from "../game/ThemeMusic";
import { speakPhrase } from "../game/VoiceOver";

function graphicsLabel(mode) {
  switch (mode) {
    case "low":
      return "Low — minimal celebration FX";
    case "medium":
      return "Medium — balanced FX";
    case "high":
      return "High — full confetti & fireworks";
    default:
      return "Auto — match this device";
  }
}

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super("options");
  }

  create() {
    const { width, height } = this.scale;

    void primeGameAudio();
    preloadAllSfx();
    void startThemeMusic();

    this.add.rectangle(width / 2, height / 2, width, height, 0xbfe8ff);

    this.add.text(width / 2, 72, "Options", {
      fontSize: "44px",
      color: "#1a3957",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(width / 2, 138, "Graphics affects milestone confetti & firework particles.", {
      fontSize: "16px",
      color: "#315f83",
      align: "center",
      wordWrap: { width: width - 56 }
    }).setOrigin(0.5);

    const gfxBtn = this.add
      .rectangle(width / 2, 258, width - 48, 72, 0xffffff, 0.95)
      .setStrokeStyle(3, 0x64b7e8)
      .setInteractive({ useHandCursor: true });

    this.graphicsText = this.add
      .text(width / 2, 248, "", {
        fontSize: "18px",
        color: "#17395c",
        align: "center",
        wordWrap: { width: width - 72 }
      })
      .setOrigin(0.5);

    this.graphicsSub = this.add
      .text(width / 2, 278, "Tap to cycle", {
        fontSize: "14px",
        color: "#5a7a9a"
      })
      .setOrigin(0.5);

    this.refreshGraphicsUi = () => {
      const mode = getGraphicsQuality();
      this.graphicsText.setText(`Graphics: ${mode.toUpperCase()}`);
      this.graphicsSub.setText(graphicsLabel(mode));
    };
    this.refreshGraphicsUi();

    gfxBtn.on("pointerdown", () => {
      cycleGraphicsQuality();
      this.refreshGraphicsUi();
      speakPhrase(`Graphics ${getGraphicsQuality()}`);
    });

    const muteBtn = this.add
      .rectangle(width / 2, 360, width - 48, 56, 0xffffff, 0.95)
      .setStrokeStyle(2, 0xff9bbd)
      .setInteractive({ useHandCursor: true });

    this.muteText = this.add
      .text(width / 2, 360, "", { fontSize: "20px", color: "#17395c" })
      .setOrigin(0.5);

    const refreshMute = () => {
      this.muteText.setText(isMuted() ? "🔇 Sound off — tap to enable" : "🔊 Sound on — tap to mute");
    };
    refreshMute();
    muteBtn.on("pointerdown", () => {
      toggleMuted();
      refreshMute();
      speakPhrase(isMuted() ? "Sound off" : "Sound on");
    });

    const back = this.add
      .rectangle(width / 2, height - 100, 220, 58, 0x64b7e8)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height - 100, "Back", {
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    back.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      speakPhrase("Back");
      this.scene.start("menu");
    });

    if (this.input.keyboard) {
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }
  }

  update() {
    if (this.input.keyboard && this.keyEsc && Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      speakPhrase("Back");
      this.scene.start("menu");
    }
  }
}
