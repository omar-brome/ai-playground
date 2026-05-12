import Phaser from 'phaser'
import { loadSave, setMuted } from './saveData'

type ToneKind = 'jump' | 'dash' | 'shard' | 'hit' | 'win' | 'select' | 'boss'

const frequencies: Record<ToneKind, number[]> = {
  jump: [330, 470],
  dash: [220, 880],
  shard: [660, 990, 1320],
  hit: [120, 80],
  win: [440, 660, 880, 1320],
  select: [520],
  boss: [90, 120, 180],
}

export class AudioEngine {
  private static context: AudioContext | null = null

  static isMuted(): boolean {
    return loadSave().muted
  }

  static toggleMute(): boolean {
    const next = !AudioEngine.isMuted()
    setMuted(next)
    return next
  }

  static play(scene: Phaser.Scene, kind: ToneKind): void {
    if (AudioEngine.isMuted()) return
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) return
    AudioEngine.context ??= new AudioContextCtor()
    const ctx = AudioEngine.context
    if (ctx.state === 'suspended') void ctx.resume()
    const start = ctx.currentTime
    frequencies[kind].forEach((frequency, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = kind === 'boss' || kind === 'hit' ? 'sawtooth' : 'triangle'
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start + index * 0.055)
      gain.gain.exponentialRampToValueAtTime(kind === 'boss' ? 0.08 : 0.045, start + index * 0.055 + 0.018)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.055 + 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start + index * 0.055)
      osc.stop(start + index * 0.055 + 0.18)
    })
    scene.events.emit('audio-played', kind)
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
