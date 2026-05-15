# Dungeon Groove

Rhythm-locked grid dungeon **prototype** built with **Phaser 3**, **Vite**, and **TypeScript**. The first **four vaults** are hand-authored; **every floor after that** is **randomly generated** (rooms, corridors, spawns). Procedural pixel-style art (no image files). Gameplay is inspired by the *Crypt of the Necrodancer* formula (move on the beat; enemies advance after your successful beat-gated turns) but is not a clone of that game’s content, levels, or branding.

## Run locally

```bash
cd dungeon-groove
npm install
npm run dev
```

Dev server defaults to `http://127.0.0.1:5174` (see `vite.config.ts`).

If `npm install` prints **`TAR_ENTRY_ERROR`** messages or **`npm run build`** fails with **`tsc: command not found`** / missing `typescript`, your `node_modules` is incomplete — delete it and reinstall:

```bash
rm -rf node_modules package-lock.json && npm install
```

## Controls

- **Arrow keys** or **WASD**: **hold** a direction; the game commits **once per metronome beat** when your input falls in the timing band (no need to re-tap every beat).
- **Click** the canvas once if the browser blocks audio — metronome ticks unlock after `AudioContext.resume()`.
- **`P`** or **`Esc`**: pause / resume (movement and metronome ticks stop while paused; unpause re-syncs the beat).
- **`M`**: toggle **metronome** click sounds on/off (timing window unchanged).
- **`N`**: after clearing a floor (overlay), go to the **next** depth. Vaults **I–IV** are fixed layouts; **depth 5+** uses a **new random map** each time (seed shown in the HUD).
- **`R`**: replay the **current** floor from the overlay. To start again from **vault I** with a new random-run salt, reload the page.

## Disclaimer

*Crypt of the Necrodancer* is a trademark of Brace Yourself Games. This repo is an independent learning exercise.
