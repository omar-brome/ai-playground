import { isMuted } from "./GameSettings";

/** Shared context so menu can resume before gameplay — avoids delayed first sounds. */
let sharedCtx = null;

/** @type {Record<string, AudioBuffer | null | undefined>} */
const decodedBuffers = {};
/** @type {Record<string, Promise<AudioBuffer | null>>} */
const decodePromises = {};

export function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    return null;
  }
  if (!sharedCtx) {
    sharedCtx = new Ctx();
  }
  return sharedCtx;
}

/** Call once after any user gesture (menu tap, key, etc.) so the context is running before jumps. */
export async function primeGameAudio() {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
}

/** Background-fetch all SFX so first in-game plays use samples, not a cold fetch. */
export function preloadAllSfx() {
  void loadBuffer("jump");
  void loadBuffer("pass");
  void loadBuffer("hit");
  void loadBuffer("gameover");
}

/**
 * Lazily load and decode one WAV from `/public/sounds/*.wav` (Vite serves as `/sounds/`).
 * @param {"jump"|"pass"|"hit"|"gameover"} name
 */
export async function loadBuffer(name) {
  if (decodedBuffers[name] !== undefined) {
    return decodedBuffers[name];
  }
  if (decodePromises[name]) {
    return decodePromises[name];
  }
  decodePromises[name] = (async () => {
    const ctx = getAudioContext();
    if (!ctx) {
      decodedBuffers[name] = null;
      return null;
    }
    try {
      const res = await fetch(`/sounds/${name}.wav`, { cache: "force-cache" });
      if (!res.ok) {
        throw new Error("missing");
      }
      const raw = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(raw);
      decodedBuffers[name] = buf;
      return buf;
    } catch {
      decodedBuffers[name] = null;
      return null;
    }
  })();
  return decodePromises[name];
}

function playBufferNow(buffer, gain = 0.5) {
  if (isMuted() || !buffer) {
    return;
  }
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") {
    return;
  }
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  src.buffer = buffer;
  g.gain.value = gain;
  src.connect(g);
  g.connect(ctx.destination);
  src.start(0);
}

/**
 * Run playback after AudioContext is running (fixes delayed sounds when `resume()` is async).
 * Supports sync or async callbacks.
 */
function withRunningContext(fn) {
  if (isMuted()) {
    return;
  }
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }
  const run = () => {
    if (isMuted() || ctx.state !== "running") {
      return;
    }
    try {
      const out = fn(ctx);
      if (out && typeof out.then === "function") {
        void out.catch(() => {});
      }
    } catch (_) {
      /* noop */
    }
  };
  if (ctx.state === "running") {
    run();
  } else {
    void ctx.resume().then(run);
  }
}

export class GameAudio {
  constructor() {}

  /**
   * Procedural jump (instant, no fetch) — used as fallback and while WAV loads.
   */
  playJumpProcedural(ctx) {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, t0);
    osc.frequency.exponentialRampToValueAtTime(480, t0 + 0.045);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.085, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.11);
  }

  playJump() {
    withRunningContext(async (ctx) => {
      if (isMuted()) {
        return;
      }
      const buf = await loadBuffer("jump");
      if (isMuted()) {
        return;
      }
      if (buf && ctx.state === "running") {
        playBufferNow(buf, 0.48);
        return;
      }
      this.playJumpProcedural(ctx);
    });
  }

  /** Obstacle gate scored — optional sample + still works without assets. */
  async playPass() {
    if (isMuted()) {
      return;
    }
    await primeGameAudio();
    const buf = await loadBuffer("pass");
    if (isMuted()) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== "running") {
      return;
    }
    if (buf) {
      playBufferNow(buf, 0.4);
      return;
    }
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.exponentialRampToValueAtTime(1320, t0 + 0.06);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.07, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.1);
  }

  /** Final collision / death in the run scene. */
  async playDeathHit() {
    if (isMuted()) {
      return;
    }
    await primeGameAudio();
    const buf = await loadBuffer("hit");
    if (isMuted()) {
      return;
    }
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== "running") {
      return;
    }
    if (buf) {
      playBufferNow(buf, 0.52);
      return;
    }
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120, t0);
    osc.frequency.exponentialRampToValueAtTime(55, t0 + 0.1);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.09, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.17);
  }

  playNearMiss() {
    withRunningContext((ctx) => {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, t0);
      osc.frequency.linearRampToValueAtTime(55, t0 + 0.08);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.07, t0 + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.15);
    });
  }

  playMilestone(milestoneScore) {
    withRunningContext((ctx) => {
      const tier = Math.min(Math.floor(milestoneScore / 10), 20);
      const base = 520 + tier * 35;
      const steps = 4;
      const stepDur = 0.065;
      const loud = Math.min(0.1 + tier * 0.006, 0.18);

      for (let i = 0; i < steps; i += 1) {
        const t0 = ctx.currentTime + i * stepDur;
        const freq = base * (1 + i * 0.12);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(loud, t0 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + stepDur * 2.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + stepDur * 2.5);
      }
    });
  }
}

/** Game-over screen sting (no GameAudio instance needed). */
export async function playGameOverStinger() {
  if (isMuted()) {
    return;
  }
  await primeGameAudio();
  const buf = await loadBuffer("gameover");
  if (isMuted()) {
    return;
  }
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") {
    return;
  }
  if (buf) {
    playBufferNow(buf, 0.42);
    return;
  }
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, t0);
  osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.35);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.1, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.38);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.4);
}
