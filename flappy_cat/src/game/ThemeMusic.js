import { getAudioContext, primeGameAudio } from "./GameAudio";
import { isMuted } from "./GameSettings";

const THEME_GAIN = 0.11;

/** @type {AudioBuffer | null} */
let themeBuffer = null;
/** @type {AudioBufferSourceNode | null} */
let themeSource = null;
/** @type {GainNode | null} */
let themeGain = null;
let themeStarted = false;

function midiToFreq(m) {
  return 440 * 2 ** ((m - 69) / 12);
}

/**
 * Render one seamless-ish loop of upbeat 8-bit–style music (original, not a specific game tune).
 */
async function buildThemeBuffer(ctx) {
  const sampleRate = ctx.sampleRate ?? 44100;
  const bpm = 130;
  const beat = 60 / bpm;
  const beats = 8;
  const duration = beat * beats;
  const frames = Math.ceil(duration * sampleRate);
  const offline = new OfflineAudioContext(2, frames, sampleRate);

  function tone(when, freq, len, velocity, type, detune = 0) {
    const osc = offline.createOscillator();
    const g = offline.createGain();
    osc.type = type;
    if (detune) {
      osc.detune.setValueAtTime(detune, when);
    }
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(velocity, when + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0008, when + Math.max(len, 0.04));
    osc.connect(g);
    g.connect(offline.destination);
    osc.start(when);
    osc.stop(when + len + 0.03);
  }

  const bassLine = [48, 55, 43, 48, 45, 52, 43, 48];
  const melody = [72, 74, 76, 79, 77, 74, 72, 71];

  for (let b = 0; b < beats; b += 1) {
    const t = b * beat;
    tone(t, midiToFreq(bassLine[b % 8]), beat * 0.92, 0.11, "square", -8);
    tone(t + beat * 0.08, midiToFreq(melody[b % 8]), beat * 0.38, 0.09, "triangle");
    tone(t + beat * 0.52, midiToFreq(melody[(b + 2) % 8] + 12), beat * 0.28, 0.055, "triangle");
  }

  const rendered = await offline.startRendering();
  const len = rendered.length;
  const fade = Math.floor(sampleRate * 0.04);
  for (let c = 0; c < rendered.numberOfChannels; c += 1) {
    const d = rendered.getChannelData(c);
    for (let i = 0; i < fade; i += 1) {
      const x = i / fade;
      d[i] *= x;
      d[len - 1 - i] *= x;
    }
  }
  return rendered;
}

async function ensureBuffer(ctx) {
  if (themeBuffer) {
    return themeBuffer;
  }
  themeBuffer = await buildThemeBuffer(ctx);
  return themeBuffer;
}

/**
 * Start looping theme once AudioContext is allowed (after user gesture). Safe to call every scene.
 */
export async function startThemeMusic() {
  if (themeStarted) {
    syncThemeMusicMute();
    return;
  }
  if (typeof window === "undefined") {
    return;
  }
  await primeGameAudio();
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  await ensureBuffer(ctx);

  if (!themeBuffer || themeStarted) {
    return;
  }

  themeGain = ctx.createGain();
  themeGain.gain.value = isMuted() ? 0 : THEME_GAIN;
  themeSource = ctx.createBufferSource();
  themeSource.buffer = themeBuffer;
  themeSource.loop = true;
  themeSource.connect(themeGain);
  themeGain.connect(ctx.destination);
  themeSource.start(0);
  themeStarted = true;
}

/** Align theme volume with mute toggle (and smooth ducking). */
export function syncThemeMusicMute() {
  const ctx = getAudioContext();
  if (!ctx || !themeGain) {
    return;
  }
  const now = ctx.currentTime;
  themeGain.gain.cancelScheduledValues(now);
  themeGain.gain.setValueAtTime(themeGain.gain.value, now);
  themeGain.gain.setTargetAtTime(isMuted() ? 0 : THEME_GAIN, now, 0.045);
}
