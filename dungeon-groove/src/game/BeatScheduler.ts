/** Rhythm timing using AudioContext clock (stable vs requestAnimationFrame alone). */
export class BeatScheduler {
  readonly ctx: AudioContext
  private beatPeriodSec: number
  private windowSec: number
  /** User-facing ±window (seconds); recombined with beat length on BPM change. */
  private readonly requestedWindowHalfSec: number
  /** Audio-context time of an arbitrary beat boundary reference. */
  private anchorTime: number
  private metronomeMuted = false

  constructor(ctx: AudioContext, bpm: number, windowMs: number) {
    this.ctx = ctx
    this.requestedWindowHalfSec = windowMs / 1000
    this.beatPeriodSec = 60 / bpm
    this.windowSec = BeatScheduler.effectiveWindowSec(this.beatPeriodSec, this.requestedWindowHalfSec)
    this.anchorTime = ctx.currentTime + 0.08
  }

  /**
   * Narrow ±windowMs around each beat leaves dead zones between beats (felt "laggy").
   * Cap at just under half a beat so "nearest beat" windows overlap and input is reliable.
   */
  private static effectiveWindowSec(beatPeriodSec: number, requestedHalfWidthSec: number): number {
    const maxHalf = beatPeriodSec * 0.49
    return Math.min(requestedHalfWidthSec, maxHalf)
  }

  get beatPeriod(): number {
    return this.beatPeriodSec
  }

  setBpm(bpm: number): void {
    const clamped = Math.min(220, Math.max(40, bpm))
    this.beatPeriodSec = 60 / clamped
    this.windowSec = BeatScheduler.effectiveWindowSec(this.beatPeriodSec, this.requestedWindowHalfSec)
  }

  get bpm(): number {
    return 60 / this.beatPeriodSec
  }

  /** Half-width of the timing band around each beat (ms), after capping to beat length. */
  get halfWindowMs(): number {
    return Math.round(this.windowSec * 1000)
  }

  get isMuted(): boolean {
    return this.metronomeMuted
  }

  setMuted(value: boolean): void {
    this.metronomeMuted = value
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

  /** Milliseconds after (+) or before (−) the nearest beat center. */
  offsetFromNearestBeatCenterMs(time: number): number {
    const nearest = this.nearestBeatTime(time)
    return Math.round((time - nearest) * 1000)
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
    if (this.metronomeMuted) return
    if (this.ctx.state !== 'running') return
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
