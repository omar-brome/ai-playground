import Phaser from "phaser";
import { hasSeenMenuTutorial, isMuted, setMenuTutorialSeen, toggleMuted } from "../game/GameSettings";
import { preloadAllSfx, primeGameAudio } from "../game/GameAudio";
import { startThemeMusic } from "../game/ThemeMusic";
import { speakPhrase } from "../game/VoiceOver";
import {
  getSelectedSkinId,
  getSkinTint,
  getUnlockedSkins,
  setSelectedSkinId
} from "../game/GameProgress";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    const { width, height } = this.scale;

    const armAudio = () => {
      void primeGameAudio();
      preloadAllSfx();
      void startThemeMusic();
    };

    this.tutorialLayer = null;
    this.tutorialAutoHideEvent = null;

    this.add.rectangle(width / 2, height / 2, width, height, 0xbfe8ff);

    const optionsH = 48;
    const playH = 58;
    const gapControls = 12;
    const gapCatPlay = 16;
    const gapHintCat = 8;
    const gapChipCat = 28;
    const gapAfterInGame = 18;
    const gapBelowHowBox = 12;
    const chipRowH = 38;

    this.add.text(width / 2, 48, "Flappy Cat", {
      fontSize: Math.min(52, width * 0.12),
      color: "#1a3957",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(width / 2, 96, "Laundry, furniture, dogs — lasers, yarn, and chaos.", {
      fontSize: "15px",
      color: "#315f83",
      align: "center",
      wordWrap: { width: width - 56 }
    }).setOrigin(0.5);

    const howToTitleY = 104;
    const howToBodyTop = 154;
    const howToLines = [
      "• Tap anywhere or press SPACE to flap upward.",
      "• Fly through the gaps — avoid laundry, furniture, dogs, yarn, and lasers.",
      "• Orange fish = +3 score (stack with gates!).",
      "• Touching the grass rug, flying off the top/bottom, or hitting a hazard ends the run.",
      "• You get one warning (red flash) before a real knockout.",
      "• Zen = slower, chill pace (doesn't change your Best score). Daily = same obstacle order for everyone today.",
      "• Power-up orbs: bubble shield (1 block), clock (slow-mo ~3s), magnet (pulls fish briefly)."
    ];

    const howToBody = this.add
      .text(width / 2, howToBodyTop, howToLines.join("\n"), {
        fontSize: "12px",
        color: "#224466",
        align: "left",
        lineSpacing: 4,
        wordWrap: { width: width - 80 }
      })
      .setOrigin(0.5, 0)
      .setDepth(2);

    const bodyH = howToBody.height;
    const boxPadV = 14;
    const boxTop = howToBodyTop - boxPadV;
    const howToBoxH = bodyH + boxPadV * 2;
    const howToBoxCY = boxTop + howToBoxH / 2;

    const howToBox = this.add
      .rectangle(width / 2, howToBoxCY, width - 36, howToBoxH, 0xffffff, 0.88)
      .setStrokeStyle(3, 0x8ec8ee);
    howToBox.setDepth(1);
    howToBody.setDepth(3);

    this.add
      .text(width / 2, howToTitleY, "How to play", {
        fontSize: "20px",
        color: "#1a3957",
        fontStyle: "bold"
      })
      .setOrigin(0.5, 0)
      .setDepth(2);

    const inGameY = boxTop + howToBoxH + gapBelowHowBox;
    const inGameText = this.add.text(width / 2, inGameY, "In-game: P pause · two-finger tap pause · M sound", {
      fontSize: "11px",
      color: "#5a7a9a",
      align: "center",
      wordWrap: { width: width - 32 }
    }).setOrigin(0.5, 0);

    const optionsCY = height - 26 - optionsH / 2;
    /** Highest valid Play button center: directly above Options. */
    const playCYMax = optionsCY - optionsH / 2 - gapControls - playH / 2;
    const inGameBottom = inGameY + inGameText.height;

    const minChipY = inGameBottom + gapAfterInGame + chipRowH / 2;
    let chipY = minChipY;
    const catHalf = 28;
    let catCY = chipY + chipRowH / 2 + gapChipCat + catHalf;
    let catSkinHintY = catCY + catHalf + gapHintCat + 6;
    let playCYClamped = catSkinHintY + gapCatPlay + playH / 2;

    if (playCYClamped > playCYMax) {
      const shift = playCYClamped - playCYMax;
      chipY = Math.max(minChipY, chipY - shift);
      catCY = chipY + chipRowH / 2 + gapChipCat + catHalf;
      catSkinHintY = catCY + catHalf + gapHintCat + 6;
      playCYClamped = Math.min(catSkinHintY + gapCatPlay + playH / 2, playCYMax);
    }

    this.playMode = "normal";

    const cx = width / 2;
    const chipDX = Math.min(108, Math.max(72, (width - 120) / 2));
    const modeDefs = [
      { label: "Normal", mode: "normal", x: cx - chipDX },
      { label: "Zen", mode: "zen", x: cx },
      { label: "Daily", mode: "daily", x: cx + chipDX }
    ];
    this._modeChips = [];
    const refreshModeHighlight = () => {
      this._modeChips.forEach((c) => {
        const on = this.playMode === c.mode;
        c.rect.setFillStyle(on ? 0xff9bbd : 0xffffff, 1);
        c.rect.setStrokeStyle(2, on ? 0xffffff : 0x8ec8ee);
        c.txt.setColor(on ? "#ffffff" : "#315f83");
      });
    };
    for (const md of modeDefs) {
      const rect = this.add
        .rectangle(md.x, chipY, 100, chipRowH, 0xffffff, 1)
        .setStrokeStyle(2, 0x8ec8ee)
        .setInteractive({ useHandCursor: true });
      const txt = this.add
        .text(md.x, chipY, md.label, {
          fontSize: "15px",
          color: "#315f83",
          fontStyle: "bold"
        })
        .setOrigin(0.5);
      rect.on("pointerdown", (pointer) => {
        pointer.event.stopPropagation();
        this.playMode = md.mode;
        refreshModeHighlight();
        const voice =
          md.mode === "daily" ? "Daily challenge" : md.mode === "zen" ? "Zen mode" : "Normal mode";
        speakPhrase(voice);
      });
      this._modeChips.push({ mode: md.mode, rect, txt });
    }
    refreshModeHighlight();

    const cat = this.add.image(width / 2, catCY, "cat").setScale(1.25);
    cat.setTint(getSkinTint(getSelectedSkinId()));
    cat.setInteractive({ useHandCursor: true });
    cat.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      const ids = getUnlockedSkins();
      if (ids.length <= 1) {
        return;
      }
      const cur = getSelectedSkinId();
      const i = ids.indexOf(cur);
      const next = ids[(i + 1) % ids.length];
      setSelectedSkinId(next);
      cat.setTint(getSkinTint(next));
      speakPhrase("Next cat color");
    });

    this.add
      .text(width / 2, catSkinHintY, "Tap cat to change color when unlocked", {
        fontSize: "11px",
        color: "#6a8aac"
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: cat,
      y: cat.y - 8,
      angle: -6,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    const button = this.add.rectangle(width / 2, playCYClamped, 210, playH, 0xff9bbd, 1)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, playCYClamped, "Play", {
      fontSize: "30px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const optionsBtn = this.add.rectangle(width / 2, optionsCY, 210, optionsH, 0xffffff, 1)
      .setStrokeStyle(3, 0x64b7e8)
      .setInteractive({ useHandCursor: true });
    this.add.text(width / 2, optionsCY, "Options", {
      fontSize: "22px",
      color: "#315f83",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const startSelectedMode = () => {
      this.game.registry.set("gameMode", this.playMode);
      this.scene.start("game");
    };

    button.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      armAudio();
      speakPhrase("Play");
      startSelectedMode();
    });
    optionsBtn.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      armAudio();
      speakPhrase("Options");
      this.scene.start("options");
    });
    this.input.keyboard.once("keydown-SPACE", () => {
      armAudio();
      speakPhrase("Play");
      startSelectedMode();
    });

    this.muteHint = this.add
      .text(width - 12, 14, "", {
        fontSize: "15px",
        color: "#315f83",
        backgroundColor: "#ffffffcc",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(1, 0)
      .setDepth(50)
      .setInteractive({ useHandCursor: true });
    this.refreshMenuMuteLabel();
    this.muteHint.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      armAudio();
      toggleMuted();
      this.refreshMenuMuteLabel();
      speakPhrase(isMuted() ? "Sound off" : "Sound on");
    });

    if (this.input.keyboard) {
      this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    }

    if (!hasSeenMenuTutorial()) {
      this.time.delayedCall(400, () => this.showFirstRunTutorial(armAudio, width, height));
    }
  }

  /**
   * One-time welcome sheet: fades out after a few seconds or on Skip.
   */
  showFirstRunTutorial(armAudio, width, height) {
    if (hasSeenMenuTutorial() || this.tutorialLayer) {
      return;
    }

    const depth = 120;
    const dim = this.add.rectangle(width / 2, height / 2, width + 8, height + 8, 0x0d1b2a, 0.52);
    dim.setDepth(depth);
    dim.setInteractive({ useHandCursor: false });
    dim.on("pointerdown", () => armAudio());

    const panel = this.add.rectangle(width / 2, height * 0.42, width - 52, 220, 0xf8fcff, 0.98);
    panel.setStrokeStyle(4, 0x64b7e8);
    panel.setDepth(depth + 1);

    const title = this.add
      .text(width / 2, height * 0.42 - 72, "First time here?", {
        fontSize: "28px",
        color: "#1a3957",
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setDepth(depth + 2);

    const body = this.add
      .text(
        width / 2,
        height * 0.42 - 8,
        "Tap or press SPACE to flap.\nFish give +3. The grass rug is game over.\nAvoid everything else after your one free warning.",
        {
          fontSize: "17px",
          color: "#315f83",
          align: "center",
          lineSpacing: 6,
          wordWrap: { width: width - 88 }
        }
      )
      .setOrigin(0.5)
      .setDepth(depth + 2);

    const skip = this.add
      .rectangle(width / 2, height * 0.42 + 88, 140, 44, 0xff9bbd)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });
    const skipTx = this.add
      .text(width / 2, height * 0.42 + 88, "Skip", {
        fontSize: "20px",
        color: "#ffffff",
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setDepth(depth + 3);

    const hint = this.add
      .text(width / 2, height * 0.42 + 132, "This message goes away in a few seconds…", {
        fontSize: "14px",
        color: "#6a8aac",
        fontStyle: "italic"
      })
      .setOrigin(0.5)
      .setDepth(depth + 2);

    this.tutorialLayer = [dim, panel, title, body, skip, skipTx, hint];

    const dismiss = () => {
      if (!this.tutorialLayer) {
        return;
      }
      if (this.tutorialAutoHideEvent) {
        this.tutorialAutoHideEvent.remove(false);
        this.tutorialAutoHideEvent = undefined;
      }
      this._tutorialDismiss = undefined;
      this.tutorialEscKey = undefined;
      const layer = this.tutorialLayer;
      this.tutorialLayer = null;
      this.tweens.add({
        targets: layer,
        alpha: 0,
        duration: 420,
        ease: "Quad.In",
        onComplete: () => {
          layer.forEach((g) => g.destroy());
          setMenuTutorialSeen();
        }
      });
    };

    skip.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      armAudio();
      speakPhrase("Skip");
      dismiss();
    });

    this.tutorialAutoHideEvent = this.time.delayedCall(5600, () => dismiss());

    this._tutorialDismiss = dismiss;
    if (this.input.keyboard) {
      this.tutorialEscKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }
  }

  refreshMenuMuteLabel() {
    if (!this.muteHint) {
      return;
    }
    this.muteHint.setText(isMuted() ? "🔇 Sound off (M)" : "🔊 Sound on (M)");
  }

  update() {
    if (this.input.keyboard && this.keyM && Phaser.Input.Keyboard.JustDown(this.keyM)) {
      void primeGameAudio();
      void startThemeMusic();
      toggleMuted();
      this.refreshMenuMuteLabel();
      speakPhrase(isMuted() ? "Sound off" : "Sound on");
    }
    if (
      this.tutorialLayer &&
      this.input.keyboard &&
      this.tutorialEscKey &&
      Phaser.Input.Keyboard.JustDown(this.tutorialEscKey)
    ) {
      void primeGameAudio();
      preloadAllSfx();
      this._tutorialDismiss?.();
    }
  }
}
