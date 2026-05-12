# Shadow Runner

**Shadow Runner** is a browser-playable 2D neon platformer portfolio demo built with **Phaser 3**, **Vite**, and **TypeScript**.

You play as a shadow-powered runner escaping a city security system, collecting memory shards, unlocking movement abilities, building custom challenge rooms, and defeating the final Sentinel boss.

The project is static frontend only. It uses procedural visuals/audio and browser `localStorage`, so it runs without a backend or external asset downloads.

---

## Highlights

- **Polished platformer feel**: acceleration, friction, coyote time, jump buffering, variable jump height, dash, double jump, phase, respawn, and checkpoints.
- **Campaign mode**: three handmade levels plus a final boss fight.
- **Ability progression**: clear levels to unlock Shadow Dash, Echo Jump, and Phase Step.
- **Boss encounter**: multi-wave Sentinel fight with exposed weak-point windows.
- **Level editor**: place tiles, hazards, shards, enemies, checkpoints, spawn, and exits.
- **Custom levels**: save custom rooms in browser `localStorage`, export JSON, import JSON, and playtest instantly.
- **Local progression**: completed levels, best times, collected shards, unlocked abilities, custom levels, and sound preference.
- **Portfolio polish**: main menu, level select, about screen, HUD, camera shake, particles, hit feedback, procedural SFX, and shareable game-over result.

---

## Tech Stack

| Layer | Choice | Purpose |
| --- | --- | --- |
| Game engine | Phaser 3 | Scenes, Arcade Physics, rendering, tweens, input, camera |
| Build tool | Vite | Dev server, HMR, production static build |
| Language | TypeScript | Typed game systems, level schema, save data |
| Persistence | `localStorage` | Progress and custom level storage |
| Audio | Web Audio API | Procedural tones for jumps, hits, boss cues, wins |
| Testing | Vitest | Pure utility tests for level import/export |
| Linting | ESLint | TypeScript lint checks |

---

## Quick Start

From this folder:

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually:

```text
http://127.0.0.1:5173/
```

---

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check and build static dist/
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm run test      # Run Vitest tests
```

`npm run build` outputs a static `dist/` folder that can be deployed to GitHub Pages, Netlify, Vercel, or any static host.

---

## Gameplay

### Campaign

The campaign has three levels:

1. **Rooftop Wake**: tutorial rooftops, basic jumps, first enemies, and checkpoint flow.
2. **Glass Factory**: dash-focused routes, moving platforms, lasers, turrets, and chasers.
3. **Signal Tower**: vertical climb with double-jump chains and the Phase Step unlock.

Clearing all three levels unlocks the boss stage:

4. **The Sentinel**: a final arena encounter with wave attacks and exposed-core damage windows.

### Progression

Abilities unlock as campaign rewards:

| Ability | Control | What It Does |
| --- | --- | --- |
| Shadow Dash | `Shift` | Fast horizontal burst; refreshes on ground |
| Echo Jump | Jump again in air | Double jump recovery and vertical routes |
| Phase Step | `E` | Short invulnerability window for passing danger |

The game tracks:

- completed campaign levels
- best clear times
- collected memory shards
- unlocked abilities
- sound on/off
- saved custom levels

---

## Controls

| Input | Action |
| --- | --- |
| `A/D` or arrow keys | Move |
| `W`, `Up`, or `Space` | Jump |
| Hold jump | Higher variable jump |
| Release jump early | Short hop |
| `Shift` | Shadow Dash |
| `E` | Phase Step |
| `R` | Respawn / restart current room |
| `Esc` | Return to level select or menu |
| `Space` on menu | Start campaign |

---

## Boss: The Sentinel

The Sentinel fight is built around a clear loop:

1. Dodge the current attack wave.
2. Wait for the **CORE EXPOSED** prompt.
3. Jump or dash into the bright yellow core.
4. Repeat until core integrity reaches `0/5`.

Attack patterns:

- **SWEEP**: bullets drop from above in a line.
- **BURST**: bullets fire outward from the boss.
- **SLAM**: temporary red floor hazards appear around the arena.

When the core is dim, it is armored. The HUD will tell you to wait for exposure.

---

## Level Editor

Open **Level Editor** from the main menu.

Editor features:

- Select tools from the top toolbar.
- Click or drag in the level area to place objects.
- Right-click to erase.
- Use arrow keys to pan around the level.
- Use `1-0` to switch tools quickly.
- Press `P` or click **Play** to playtest immediately.
- Press `Esc` to return to the menu.

Available tools:

| Tool | Purpose |
| --- | --- |
| Tile | Solid platform block |
| Hazard | Red damage zone |
| Shard | Collectible memory shard |
| Drone | Patrolling enemy |
| Turret | Shooting enemy |
| Chaser | Enemy that follows nearby player |
| CP | Checkpoint |
| Exit | Level finish door |
| Spawn | Player start point |
| Erase | Remove nearby placed objects |

### Custom Level Storage

Custom levels are stored in the browser, not as files on disk.

- Save key: `shadow_runner_save_v1`
- Storage: browser `localStorage`
- Stored area: `customLevels` inside the save object
- Scope: tied to the current browser and origin, for example `http://127.0.0.1:5173`

When you click **Save**, the editor:

1. Stores the custom level in browser `localStorage`.
2. Copies a JSON export to the clipboard.

Use **Import** to paste that exported JSON back into the editor later.

---

## Project Structure

```text
shadow_runner/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  eslint.config.js
  src/
    main.ts
    styles.css
    vite-env.d.ts
    game/
      AudioEngine.ts
      Effects.ts
      PlayerController.ts
      format.ts
      levelCodec.ts
      levelCodec.test.ts
      levels.ts
      saveData.ts
      types.ts
    scenes/
      AboutScene.ts
      BootScene.ts
      BossScene.ts
      EditorScene.ts
      GameOverScene.ts
      GameScene.ts
      LevelSelectScene.ts
      MenuScene.ts
```

---

## Main Systems

### Scenes

- `BootScene`: creates procedural textures for the runner, shards, checkpoints, exits, enemies, and bullets.
- `MenuScene`: main menu, progress summary, sound toggle, reset progress, and navigation.
- `LevelSelectScene`: campaign/custom level selection, ability status, best times.
- `GameScene`: campaign and custom level runtime.
- `EditorScene`: grid editor, save/export/import, and playtest entry.
- `BossScene`: final Sentinel encounter.
- `GameOverScene`: mission summary and share text.
- `AboutScene`: in-game portfolio/tech explanation.

### Game Data

- `levels.ts`: handmade campaign level definitions and boss arena data.
- `types.ts`: shared level, save, ability, enemy, and result types.
- `saveData.ts`: `localStorage` persistence helpers.
- `levelCodec.ts`: custom level JSON import/export/validation.
- `PlayerController.ts`: movement controller and ability logic.
- `AudioEngine.ts`: procedural Web Audio cues.
- `Effects.ts`: particles, floating text, and camera flash helpers.

---

## Save Data

All player progress is saved locally in the browser:

```text
shadow_runner_save_v1
```

The save object contains:

- `completedLevels`
- `bestTimes`
- `collectedShards`
- `abilities`
- `muted`
- `customLevels`

To reset from the UI, use **Reset Progress** on the main menu.

To inspect manually in Chrome:

1. Open DevTools.
2. Go to **Application**.
3. Open **Local Storage**.
4. Select `http://127.0.0.1:5173`.
5. Look for `shadow_runner_save_v1`.

---

## Quality Checks

These commands are expected to pass:

```bash
npm run build
npm run lint
npm run test
```

Current test coverage focuses on level JSON import/export validation. The game itself is mostly runtime-driven Phaser code.

---

## Deployment

Build the static site:

```bash
npm run build
```

Deploy the generated `dist/` directory to a static host.

Notes:

- No backend is required.
- No environment variables are required.
- Custom levels and progress are per browser because they use `localStorage`.
- Phaser can create a large JS bundle; Vite may warn about chunk size, but the build still succeeds.

---

## Portfolio Notes

Shadow Runner is intentionally **Mario-inspired only at the genre level**. It does not use Nintendo names, art, music, or assets.

The goal is to show:

- game feel and input polish
- browser game architecture
- Phaser scene organization
- level data modeling
- local persistence
- user-generated content through an editor
- production-ready static build flow
