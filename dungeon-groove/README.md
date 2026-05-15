# Dungeon Groove

Rhythm-locked grid dungeon **prototype** built with **Phaser 3**, **Vite**, and **TypeScript**. Gameplay is inspired by the *Crypt of the Necrodancer* formula (move on the beat; enemies advance after your successful beat-gated turns) but uses original placeholder art and a tiny bespoke room — not a clone of that game’s content, levels, or branding.

## Run locally

```bash
cd dungeon-groove
npm install
npm run dev
```

Dev server defaults to `http://127.0.0.1:5174` (see `vite.config.ts`).

## Controls

- **Arrow keys** or **WASD**: move / bump-attack (only registers **inside the beat window**).
- **Click** the canvas once if the browser blocks audio — metronome ticks unlock after `AudioContext.resume()`.
- **`[` / `]`**: decrease / increase BPM (debug tuning).
- **`R`**: restart (also shown on game-over / victory overlay).

## Disclaimer

*Crypt of the Necrodancer* is a trademark of Brace Yourself Games. This repo is an independent learning exercise.
