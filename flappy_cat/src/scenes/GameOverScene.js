import Phaser from "phaser";
import { playGameOverStinger } from "../game/GameAudio";
import { startThemeMusic } from "../game/ThemeMusic";
import { speakAfterDelay, speakPhrase } from "../game/VoiceOver";

function buildShareText({ score, best, deathMessage, gameMode, dailySeed }) {
  const lines = [`Flappy Cat — ${score} pts`, `Best: ${best}`];
  if (gameMode === "zen") {
    lines.push("Mode: Zen");
  } else if (gameMode === "daily" && dailySeed) {
    lines.push(`Daily: ${dailySeed}`);
  }
  if (deathMessage) {
    lines.push(deathMessage);
  }
  return lines.join("\n");
}

async function shareTextPayload(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text, title: "Flappy Cat" });
      return true;
    } catch (e) {
      if (e?.name === "AbortError") {
        return true;
      }
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through */
    }
  }
  return false;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("game-over");
  }

  create(data) {
    const { width, height } = this.scale;
    const score = data?.score ?? 0;
    const best = data?.best ?? score;
    const deathMessage = data?.deathMessage;
    const gameMode = data?.gameMode ?? "normal";
    const dailySeed = data?.dailySeed ?? null;

    void playGameOverStinger();
    void startThemeMusic();
    speakAfterDelay("Game over", 420);

    this.add.rectangle(width / 2, height / 2, width, height, 0x95d2ff);
    this.add.text(width / 2, 190, "Cat-astrophe!", {
      fontSize: "52px",
      color: "#17395c",
      fontStyle: "bold"
    }).setOrigin(0.5);

    if (deathMessage) {
      this.add.text(width / 2, 252, deathMessage, {
        fontSize: "22px",
        color: "#315f83",
        align: "center",
        wordWrap: { width: width - 80 }
      }).setOrigin(0.5);
    }

    this.add.text(width / 2, deathMessage ? 335 : 315, `Score: ${score}`, {
      fontSize: "38px",
      color: "#ffffff",
      stroke: "#315f83",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, deathMessage ? 390 : 370, `Best: ${best}`, {
      fontSize: "30px",
      color: "#f7fbff"
    }).setOrigin(0.5);

    const shareY = deathMessage ? 442 : 428;
    const shareBtn = this.add.rectangle(width / 2, shareY, 255, 50, 0xffffff, 1)
      .setStrokeStyle(3, 0x315f83)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, shareY, "Share score", {
        fontSize: "22px",
        color: "#315f83",
        fontStyle: "bold"
      })
      .setOrigin(0.5);

    const snapY = shareY + 58;
    const snapBtn = this.add.rectangle(width / 2, snapY, 255, 46, 0xe8f6ff, 1)
      .setStrokeStyle(2, 0x64b7e8)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, snapY, "Screenshot & share", {
      fontSize: "18px",
      color: "#315f83",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const playAgainY = snapY + 70;
    const playAgain = this.add.rectangle(width / 2, playAgainY, 245, 66, 0xff9bbd)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, playAgainY, "Restart", {
      fontSize: "30px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const menuY = playAgainY + 78;
    const menuButton = this.add.rectangle(width / 2, menuY, 245, 58, 0x64b7e8)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, menuY, "Main Menu", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const toast = this.add
      .text(width / 2, height - 36, "", {
        fontSize: "15px",
        color: "#17395c",
        backgroundColor: "#ffffffcc",
        padding: { x: 10, y: 4 }
      })
      .setOrigin(0.5);

    const runShare = async () => {
      const body = buildShareText({ score, best, deathMessage, gameMode, dailySeed });
      const ok = await shareTextPayload(body);
      toast.setText(ok ? "Copied / shared!" : "Couldn't share — text in console");
      if (!ok) {
        console.log("Share text:\n", body);
      }
      this.tweens.add({
        targets: toast,
        alpha: 0,
        delay: 1800,
        duration: 400,
        onStart: () => toast.setAlpha(1)
      });
    };

    shareBtn.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      speakPhrase("Share score");
      void runShare();
    });

    snapBtn.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      speakPhrase("Screenshot");
      this.game.renderer.snapshot((img) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          toast.setText("Snapshot unavailable");
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.setText("Snapshot failed");
            return;
          }
          const file = new File([blob], "flappy-cat-score.png", { type: blob.type });
          if (navigator.canShare?.({ files: [file] })) {
            void navigator
              .share({
                files: [file],
                title: "Flappy Cat",
                text: buildShareText({ score, best, deathMessage, gameMode, dailySeed })
              })
              .then(() => toast.setText("Shared!"))
              .catch(() => {
                toast.setText("Saved file if download appeared");
              });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "flappy-cat-score.png";
            a.click();
            URL.revokeObjectURL(url);
            toast.setText("Image saved — share from your gallery");
          }
        }, "image/png");
      });
    });

    playAgain.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      speakPhrase("Restart");
      this.scene.start("game");
    });
    menuButton.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      speakPhrase("Main menu");
      this.scene.start("menu");
    });

    const optionsLink = this.add
      .text(width / 2, menuY + 72, "Graphics & sound (Options)", {
        fontSize: "17px",
        color: "#315f83"
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    optionsLink.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      speakPhrase("Options");
      this.scene.start("options");
    });

    this.input.keyboard.once("keydown-SPACE", () => {
      speakPhrase("Restart");
      this.scene.start("game");
    });
  }
}
