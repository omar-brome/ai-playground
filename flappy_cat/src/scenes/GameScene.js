import Phaser from "phaser";
import { CatController } from "../game/CatController";
import { InputController } from "../game/InputController";
import { ObstacleManager } from "../game/ObstacleManager";
import { LaundryObstacle } from "../game/obstacles/LaundryObstacle";
import { FurnitureObstacle } from "../game/obstacles/FurnitureObstacle";
import { DogPatrolObstacle } from "../game/obstacles/DogPatrolObstacle";
import { YarnBallObstacle } from "../game/obstacles/YarnBallObstacle";
import { LaserObstacle } from "../game/obstacles/LaserObstacle";
import { ScoreSystem } from "../game/ScoreSystem";
import { Effects } from "../game/Effects";
import { GameAudio, preloadAllSfx, primeGameAudio } from "../game/GameAudio";
import { isMuted, toggleMuted } from "../game/GameSettings";
import { startThemeMusic } from "../game/ThemeMusic";
import { speakPhrase } from "../game/VoiceOver";
import { rndBetween, rndFloat } from "../game/rngHelper";
import {
  getMissionHudLines,
  getSelectedSkinId,
  getSkinTint,
  isTrailUnlocked,
  recordRunEnd
} from "../game/GameProgress";

const DEATH_MESSAGES = {
  laundry: "Clipped the laundry",
  furniture: "Caught on furniture",
  dog: "Hit the dog",
  yarn: "Tangled in yarn",
  laser: "Zapped by the laser",
  floor: "Touched the rug",
  sky: "Flew too high",
  pit: "Fell off-screen",
  unknown: "Knocked out"
};

const SLOW_MO_MULT = 0.46;
const MAGNET_RANGE = 240;

export class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
  }

  create() {
    const { width, height } = this.scale;
    this.viewHeight = height;
    this.worldHeight = height + 280;
    this.game.registry.set("worldHeight", this.worldHeight);

    this.gameMode = this.game.registry.get("gameMode") ?? "normal";
    const zenMode = this.gameMode === "zen";
    const dailyMode = this.gameMode === "daily";

    if (dailyMode) {
      const now = new Date();
      const seed = `daily-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`;
      this.game.registry.set("_dailyRng", new Phaser.Math.RandomDataGenerator([seed]));
    } else {
      this.game.registry.remove("_dailyRng");
    }

    this.state = "running";
    this.timeAlive = 0;
    this.graceAvailable = true;
    this.invincible = false;
    this.pauseDebounceMs = 0;
    this.pauseLayers = null;

    this.laundryPassesThisRun = 0;
    this.fishCollectedThisRun = 0;

    this.shieldCharges = 0;
    this.slowMoEndTime = 0;
    this.magnetEndTime = 0;

    this.cameras.main.setBounds(0, 0, width, this.worldHeight);

    this.bg = this.add.rectangle(width / 2, this.worldHeight / 2, width, this.worldHeight, 0xbfe8ff);
    this.bg.setDepth(0);
    const grass = this.add.rectangle(width / 2, this.worldHeight - 34, width, 68, 0xd0f2bd);
    grass.setDepth(1);

    this.inputController = new InputController(this);
    this.inputController.bind();

    this.effects = new Effects(this);
    this.scoreSystem = new ScoreSystem({ ignoreBest: zenMode });
    this.gameAudio = new GameAudio();
    this.game.registry.set("gameAudio", this.gameAudio);
    void primeGameAudio();
    preloadAllSfx();

    const skinTint = getSkinTint(getSelectedSkinId());
    this.cat = new CatController(this, width * 0.3, this.worldHeight * 0.42, {
      onFlap: () => this.gameAudio.playJump(),
      tint: skinTint
    });
    this.cat.start();

    if (isTrailUnlocked()) {
      this.trailFx = this.add.particles(0, 0, "spark", {
        follow: this.cat.sprite,
        followOffset: { x: -22, y: 2 },
        scale: { start: 0.45, end: 0 },
        alpha: { start: 0.55, end: 0 },
        lifespan: 340,
        frequency: 90,
        quantity: 1,
        speedX: { min: -40, max: -10 },
        speedY: { min: -25, max: 25 },
        blendMode: "ADD"
      });
      this.trailFx.setDepth(24);
      this.events.once("shutdown", () => {
        this.trailFx?.destroy();
        this.trailFx = undefined;
      });
    }

    this.scoreText = this.add.text(width / 2, 42, "0", {
      fontSize: "54px",
      color: "#ffffff",
      stroke: "#315f83",
      strokeThickness: 8,
      fontStyle: "bold"
    }).setOrigin(0.5);
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);

    let modeLabel = "";
    if (zenMode) {
      modeLabel = "Zen · score won't update best";
    } else if (dailyMode) {
      modeLabel = "Daily · same order for everyone today";
    }
    if (modeLabel) {
      this.add
        .text(width / 2, 92, modeLabel, {
          fontSize: "13px",
          color: "#315f83",
          align: "center",
          wordWrap: { width: width - 40 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);
    }

    this.missionHud = this.add
      .text(12, 118, getMissionHudLines().join("\n"), {
        fontSize: "13px",
        color: "#1a3957",
        backgroundColor: "#ffffffb0",
        padding: { x: 8, y: 6 },
        lineSpacing: 4,
        wordWrap: { width: Math.min(220, width * 0.55) }
      })
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(99);

    this.powerHud = this.add
      .text(12, height - 22, "", {
        fontSize: "13px",
        color: "#224466",
        backgroundColor: "#ffffffaa",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(99);

    this.muteLabel = this.add
      .text(width - 14, 14, "", {
        fontSize: "16px",
        color: "#315f83",
        backgroundColor: "#ffffffaa",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(102)
      .setInteractive({ useHandCursor: true });
    this.refreshMuteLabel();
    this.muteLabel.on("pointerdown", (pointer) => {
      pointer.event.stopPropagation();
      this.toggleMuteUi();
    });

    if (this.input.keyboard) {
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    }

    this._twoFingerRef = (e) => this.handleTwoFingerPause(e);
    this.game.canvas.addEventListener("touchstart", this._twoFingerRef, { passive: true });
    this.events.once("shutdown", () => {
      this.game.canvas?.removeEventListener("touchstart", this._twoFingerRef);
    });

    this.floor = this.add.rectangle(width / 2, this.worldHeight - 52, width + 60, 40, 0x000000, 0);
    this.floor.setDepth(12);
    this.physics.add.existing(this.floor, true);
    this.physics.add.overlap(this.cat.sprite, this.floor, () => this.handleDeathAttempt("floor"));

    this.cameras.main.startFollow(this.cat.sprite, false, 0, 0.075, -95, -55);

    this.pickups = [];
    this.pickupAccum = 0;
    this.nextPickupMs = 4500;

    this.obstacles = new ObstacleManager(this, {
      catSprite: this.cat.sprite,
      onPass: (x, y, obstacleType) => this.handlePass(x, y, obstacleType),
      onHit: (tag) => this.handleHazardHit(tag),
      zenMode
    });
    this.obstacles.register("laundry", LaundryObstacle.create, 1.1);
    this.obstacles.register("furniture", FurnitureObstacle.create, 1.0);
    this.obstacles.register("dog", DogPatrolObstacle.create, 0.85);
    this.obstacles.register("yarn", YarnBallObstacle.create, 0.95);
    this.obstacles.register("laser", LaserObstacle.create, 0.75);
    this.obstacles.start();

    void startThemeMusic();
  }

  refreshPowerHud() {
    if (!this.powerHud) {
      return;
    }
    const now = this.time.now;
    const parts = [];
    if (this.shieldCharges > 0) {
      parts.push("Shield ready");
    }
    if (now < this.slowMoEndTime) {
      parts.push(`Slow-mo ${Math.ceil((this.slowMoEndTime - now) / 1000)}s`);
    }
    if (now < this.magnetEndTime) {
      parts.push(`Magnet ${Math.ceil((this.magnetEndTime - now) / 1000)}s`);
    }
    this.powerHud.setText(parts.join(" · "));
  }

  refreshMissionHud() {
    if (this.missionHud) {
      this.missionHud.setText(getMissionHudLines().join("\n"));
    }
  }

  getPickupScrollVx() {
    return -(this.obstacles.scrollSpeed * this.obstacles.scrollMult);
  }

  refreshMuteLabel() {
    if (!this.muteLabel) {
      return;
    }
    this.muteLabel.setText(isMuted() ? "🔇 Sound (M)" : "🔊 Sound (M)");
  }

  toggleMuteUi() {
    toggleMuted();
    this.refreshMuteLabel();
    speakPhrase(isMuted() ? "Sound off" : "Sound on");
  }

  handleTwoFingerPause(event) {
    if (!event.touches || event.touches.length < 2) {
      return;
    }
    const now = Date.now();
    if (now - this.pauseDebounceMs < 480) {
      return;
    }
    this.pauseDebounceMs = now;
    this.togglePause();
  }

  togglePause() {
    if (this.state === "over") {
      return;
    }
    if (this.state === "paused") {
      this.state = "running";
      this.physics.world.resume();
      this.tweens.resumeAll();
      this.time.paused = false;
      if (this.pauseLayers) {
        this.pauseLayers.forEach((obj) => obj.destroy());
        this.pauseLayers = null;
      }
      return;
    }
    if (this.state !== "running") {
      return;
    }
    this.state = "paused";
    this.physics.world.pause();
    this.tweens.pauseAll();
    this.time.paused = true;
    const { width, height } = this.scale;
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x1a3957, 0.58);
    dim.setScrollFactor(0);
    dim.setDepth(200);
    const title = this.add
      .text(width / 2, height / 2 - 28, "Paused", {
        fontSize: "46px",
        color: "#ffffff",
        fontStyle: "bold"
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);
    const hint = this.add
      .text(
        width / 2,
        height / 2 + 38,
        "Press P or two fingers to resume · M toggles sound",
        {
          fontSize: "17px",
          color: "#d6ecff",
          align: "center",
          wordWrap: { width: width - 48 }
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);
    this.pauseLayers = [dim, title, hint];
  }

  update(_time, deltaMs) {
    if (this.input.keyboard) {
      if (this.keyM && Phaser.Input.Keyboard.JustDown(this.keyM)) {
        this.toggleMuteUi();
      }
      if (this.keyP && Phaser.Input.Keyboard.JustDown(this.keyP)) {
        this.togglePause();
      }
    }

    if (this.state === "paused") {
      return;
    }

    if (this.state !== "running") {
      return;
    }

    const now = this.time.now;
    const slowActive = now < this.slowMoEndTime;
    this.obstacles.scrollMult = slowActive ? SLOW_MO_MULT : 1;
    this.refreshPowerHud();

    const deltaS = deltaMs / 1000;
    this.timeAlive += deltaS;

    if (this.inputController.update()) {
      this.cat.flap();
    }

    this.cat.update(deltaS);
    const difficulty = this.computeDifficulty();
    this.obstacles.update(deltaMs, difficulty);

    this.pickupAccum += deltaMs;
    if (this.pickupAccum >= this.nextPickupMs) {
      this.pickupAccum = 0;
      this.nextPickupMs = rndBetween(this, 4200, 7000);
      const roll = rndFloat(this, 0, 1);
      if (roll < 0.58) {
        this.spawnFishPickup();
      } else {
        this.spawnPowerPickup();
      }
    }

    const magnetOn = now < this.magnetEndTime;
    const cx = this.cat.sprite.x;
    const cy = this.cat.sprite.y;

    for (const p of this.pickups) {
      if (!p.sprite?.body || p.taken) {
        continue;
      }
      p.sprite.setVelocityX(this.getPickupScrollVx());
      if (magnetOn && p.kind === "fish") {
        const dx = cx - p.sprite.x;
        const dy = cy - p.sprite.y;
        if (dx * dx + dy * dy < MAGNET_RANGE * MAGNET_RANGE) {
          const pull = deltaS * 2.8;
          p.sprite.x += dx * pull;
          p.sprite.y += dy * pull * 0.5;
        }
      }
    }

    this.pickups = this.pickups.filter((p) => {
      if (!p.sprite.active || p.sprite.x < -50) {
        p.collider?.destroy();
        if (p.sprite.active) {
          p.sprite.destroy();
        }
        return false;
      }
      return true;
    });

    if (this.cat.sprite.y < -30) {
      this.handleDeathAttempt("sky");
    } else if (this.cat.sprite.y > this.worldHeight + 40) {
      this.handleDeathAttempt("pit");
    }
  }

  handleHazardHit(tag) {
    if (this.state !== "running") {
      return;
    }
    if (this.invincible) {
      return;
    }
    this.handleDeathAttempt(tag);
  }

  handleDeathAttempt(cause) {
    if (this.state !== "running") {
      return;
    }
    if (this.invincible) {
      return;
    }
    if (this.shieldCharges > 0) {
      this.shieldCharges -= 1;
      void this.gameAudio.playNearMiss();
      this.effects.nearMissVignette();
      this.refreshPowerHud();
      return;
    }
    if (this.graceAvailable) {
      this.graceAvailable = false;
      this.invincible = true;
      void this.gameAudio.playNearMiss();
      this.effects.nearMissVignette();
      this.time.delayedCall(1900, () => {
        this.invincible = false;
      });
      return;
    }
    this.gameOver(cause);
  }

  computeDifficulty() {
    if (this.gameMode === "zen") {
      return 0;
    }
    const timeDiff = Math.min(Math.max(0, this.timeAlive - 10) / 52, 2.2);
    const s = this.scoreSystem.score;
    let scoreBoost = 0;
    if (s >= 50) {
      scoreBoost = 1.05;
    } else if (s >= 30) {
      scoreBoost = 0.48;
    }
    return Math.min(timeDiff + scoreBoost, 3.65);
  }

  processMilestones(prevScore, newScore) {
    for (let m = 10; m <= newScore; m += 10) {
      if (prevScore < m) {
        this.gameAudio.playMilestone(m);
        this.effects.milestoneCelebration(m);
      }
    }
  }

  handlePass(x, y, obstacleType) {
    if (obstacleType === "laundry") {
      this.laundryPassesThisRun += 1;
      this.refreshMissionHud();
    }
    const prev = this.scoreSystem.score;
    const score = this.scoreSystem.increment();
    this.scoreText.setText(String(score));
    this.effects.scoreBurst(x, y);
    void this.gameAudio.playPass();
    this.processMilestones(prev, score);
  }

  spawnFishPickup() {
    if (this.state !== "running") {
      return;
    }
    const { width } = this.scale;
    const y = rndBetween(this, 120, this.worldHeight - 130);
    const fish = this.physics.add.image(width + 55, y, "fish");
    fish.setDepth(18);
    fish.body.allowGravity = false;
    fish.setVelocityX(this.getPickupScrollVx());
    const entry = { sprite: fish, collider: null, taken: false, kind: "fish" };
    entry.collider = this.physics.add.overlap(this.cat.sprite, fish, () => {
      if (entry.taken || !fish.active) {
        return;
      }
      entry.taken = true;
      const b = fish.body;
      if (b) {
        b.enable = false;
      }
      this.fishCollectedThisRun += 1;
      const prev = this.scoreSystem.score;
      const score = this.scoreSystem.addPoints(3);
      this.scoreText.setText(String(score));
      this.effects.scoreBurst(fish.x, fish.y);
      void this.gameAudio.playPass();
      this.processMilestones(prev, score);
      this.time.delayedCall(0, () => {
        entry.collider?.destroy();
        entry.collider = null;
        if (fish.active) {
          fish.destroy();
        }
      });
    });
    this.pickups.push(entry);
  }

  spawnPowerPickup() {
    if (this.state !== "running") {
      return;
    }
    const { width } = this.scale;
    const y = rndBetween(this, 130, this.worldHeight - 140);
    const kinds = ["shield", "slowmo", "magnet"];
    const kind = kinds[rndBetween(this, 0, kinds.length - 1)];
    const tex =
      kind === "shield" ? "pickup_shield" : kind === "slowmo" ? "pickup_slowmo" : "pickup_magnet";
    const sprite = this.physics.add.image(width + 55, y, tex);
    sprite.setDepth(19);
    sprite.body.allowGravity = false;
    sprite.setVelocityX(this.getPickupScrollVx());
    const entry = { sprite, collider: null, taken: false, kind };
    entry.collider = this.physics.add.overlap(this.cat.sprite, sprite, () => {
      if (entry.taken || !sprite.active) {
        return;
      }
      entry.taken = true;
      const b = sprite.body;
      if (b) {
        b.enable = false;
      }
      void this.gameAudio.playPass();
      if (kind === "shield") {
        this.shieldCharges = 1;
      } else if (kind === "slowmo") {
        this.slowMoEndTime = this.time.now + 3000;
      } else {
        this.magnetEndTime = this.time.now + 5000;
      }
      this.refreshPowerHud();
      this.effects.scoreBurst(sprite.x, sprite.y);
      this.time.delayedCall(0, () => {
        entry.collider?.destroy();
        entry.collider = null;
        if (sprite.active) {
          sprite.destroy();
        }
      });
    });
    this.pickups.push(entry);
  }

  gameOver(cause = "unknown") {
    if (this.state !== "running") {
      return;
    }
    this.state = "over";
    this.cameras.main.stopFollow();
    recordRunEnd({
      score: this.scoreSystem.score,
      mode: this.gameMode,
      laundryPassesThisRun: this.laundryPassesThisRun,
      fishCollectedThisRun: this.fishCollectedThisRun
    });
    void this.gameAudio.playDeathHit();
    this.effects.hitShake();
    const deathMessage = DEATH_MESSAGES[cause] ?? DEATH_MESSAGES.unknown;
    const now = new Date();
    const dailySeed = `daily-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    this.time.delayedCall(260, () => {
      this.scene.start("game-over", {
        score: this.scoreSystem.score,
        best: this.scoreSystem.best,
        deathCause: cause,
        deathMessage,
        gameMode: this.gameMode,
        dailySeed: this.gameMode === "daily" ? dailySeed : null
      });
    });
  }
}
