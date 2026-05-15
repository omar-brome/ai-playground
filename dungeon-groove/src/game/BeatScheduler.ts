/** Rhythm timing using AudioContext clock (stable vs requestAnimationFrame alone). */
export class BeatScheduler {
  readonly ctx: AudioContext
  private beatPeriodSec: number
  private readonly windowSec: number
  /** Audio-context time of an arbitrary beat boundary reference. */
  private anchorTime: number

  constructor(ctx: AudioContext, bpm: number, windowMs: number) {
    this.ctx = ctx
    this.beatPeriodSec = 60 / bpm
    this.windowSec = windowMs / 1000
    this.anchorTime = ctx.currentTime + 0.08
  }

  get beatPeriod(): number {
    return this.beatPeriodSec
  }

  setBpm(bpm: number): void {
    const clamped = Math.min(220, Math.max(40, bpm))
    this.beatPeriodSec = 60 / clamped
  }

  get bpm(): number {
    return 60 / this.beatPeriodSec
  }

  now(): number {
    return this.ctx.currentTime
  }

  /** Re-align anchor so the metronome feels responsive after resume. */
  snapAnchorToNow(): void {
    const t = this.ctx.currentTime
    const p = this.beatPeriodSec
    const k = Math.round((t - this.anchorTime) / p)
    this.anchorTime = t - k * p
  }

  nearestBeatTime(time: number): number {
    const p = this.beatPeriodSec
    const k = Math.round((time - this.anchorTime) / p)
    return this.anchorTime + k * p
  }

  inBeatWindow(time: number): boolean {
    const nearest = this.nearestBeatTime(time)
    return Math.abs(time - nearest) <= this.windowSec
  }

  /** Soft tick on beat crossings for HUD / click (call from scene update). */
  beatIndexAt(time: number): number {
    const p = this.beatPeriodSec
    return Math.floor((time - this.anchorTime) / p)
  }

  /** 0 right after a beat boundary, approaches 1 just before the next beat. */
  beatPhase01(time: number): number {
    const p = this.beatPeriodSec
    let phase = ((time - this.anchorTime) % p) / p
    if (phase < 0) phase += 1
    return phase
  }

  playClick(): void {
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 880
    gain.gain.value = 0.06
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(t)
    osc.stop(t + 0.035)
  }
}
