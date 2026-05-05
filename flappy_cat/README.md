# Flappy Cat

A browser-based **Flappy Bird**–style game built with **Phaser 3**. You guide a cat through a scrolling world of **laundry lines**, **furniture stacks**, **patrolling dogs**, **yarn**, and **lasers**—while grabbing **fish** and **power-ups**, dodging the **floor rug**, and chasing a high score.

---

## Technologies

| Layer | Choice | Role |
|--------|--------|------|
| **Game engine** | [Phaser 3](https://phaser.io/) (~3.90.x) | 2D canvas, Arcade physics, scenes, tweens, particles |
| **Bundler** | [Vite](https://vitejs.dev/) (~5.4.x) | Dev server, HMR, production builds (`/public` → site root) |
| **Language** | **JavaScript** (ES modules) | Game logic and scenes |
| **Page chrome** | `src/styles.css` | Layout around the canvas |
| **SFX** | **Web Audio** + optional **WAV** under `public/sounds/` | Jump, pass, hit, game-over samples; procedural fallbacks |
| **Music** | **Web Audio** (`ThemeMusic.js`) | Looping procedural chiptune theme (no external music file required) |
| **Voice UI** | **Web Speech API** (`speechSynthesis`) | Announces selected menu actions and “game over” (system voice varies by OS/browser) |
| **Persistence** | **localStorage** | Best score, mute, graphics tier, progress, missions — see [Persistence](#persistence) |

The game is **static front-end only** (no backend). Deploy the contents of `dist/` after `npm run build`.

---

## Prerequisites

- **Node.js** 18+ and **npm** recommended for Vite 5.

```bash
node -v
npm -v
```

---

## How to run

From the `flappy_cat` directory:

### Development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Production build

```bash
npm run build
```

Static output: `dist/`.

### Preview production build locally

```bash
npm run preview
```

---

## Controls

### In-game

| Input | Action |
|--------|--------|
| **Tap / click** anywhere | Flap (jump impulse) |
| **Space** | Flap |
| **P** | Pause / resume |
| **Two-finger tap** (touch) | Pause / resume |
| **M** | Toggle sound (SFX, theme, and voice follow the same mute) |

### Menus

- **Menu:** Choose **Normal**, **Zen**, or **Daily** mode, then **Play**; **Options** opens settings. **Space** starts with the selected mode.
- **Game over:** **Restart**, **Main Menu**, share buttons; **Space** restarts.
- **Options:** Cycle **Graphics** quality, toggle **Sound**, **Back** (or **Esc**) to menu.

---

## Gameplay summary

- **Gravity** pulls the cat; each flap applies an upward impulse (`CatController`).
- **Score** goes up by **1** each time you pass an obstacle’s **score zone** (narrow vertical trigger between hazards).
- **Orange fish** pickups add **+3** score (stack with gates).
- **Power-up orbs** (spawn mix with fish):
  - **Shield** — Absorbs **one** hazard hit (before your free “grace” warning).
  - **Slow-mo** — ~**3 s** of slower world scroll.
  - **Magnet** — Pulls **fish** toward the cat for a few seconds.
- **The grass / floor rug** and **flying off the top or bottom** of the world end the run.
- Hitting a **hazard body** normally kills you unless:
  - **Grace** — Once per run, first hazard contact triggers a near-miss (red vignette, short invincibility) instead of death.
  - **Shield** — If active, consumes the shield first.

**Difficulty** (Normal / Daily): increases over **time alive** and somewhat with **score** (faster scroll, tighter spawns). **Zen** keeps difficulty contribution at **0** and uses calmer baseline scroll/spawns in `ObstacleManager`.

---

## Game modes

| Mode | Behavior |
|------|-----------|
| **Normal** | Full difficulty ramp; **best score** can update. |
| **Zen** | Chill pace: difficulty input is **0** (no time/score ramp); **best score** does not update (relax / practice). |
| **Daily** | Same **seeded** obstacle RNG for everyone **per calendar day** (`RandomDataGenerator` + `daily-YYYY-MM-DD`), so obstacle layouts match for that day. Best score behaves like Normal. |

Selection is stored on `game.registry` as `gameMode` when you press **Play**.

---

## Obstacles

Obstacles are registered in `ObstacleManager` with **weights** (spawn frequency). Each family implements `create(scene, x, difficulty, scrollSpeed)` and returns `{ group, scoreZone, ... }`.

| ID | Description |
|----|-------------|
| **laundry** | Posts, hanging shirts; some shirts bob on tweens. |
| **furniture** | Stacked sofas / tables / chairs above and below a gap. |
| **dog** | Dog pair with optional vertical patrol motion. |
| **yarn** | Yarn balls; optional moving ball. |
| **laser** | Laser bar between mounts with vertical tween. |

Collisions use **overlap** on physics bodies; the **score zone** is a separate physics **Zone** that scrolls with the set.

---

## Features (overview)

### Menu & tutorial

- **How to play** card (controls, fish, rug, grace, modes, power-ups).
- **First-run overlay** — Short welcome; **Skip**, **Esc**, or auto-dismiss; stored so it doesn’t repeat (`GameSettings` / `flappy_cat_menu_tutorial_seen`).
- **Cat color** — Tap the cat to cycle **unlocked** tints (saved locally).

### Audio

- **Theme** — Looping upbeat procedural **chiptune** (`ThemeMusic.js`) after the first user gesture; respects **mute**.
- **SFX** — WAVs in `public/sounds/` when present (`jump`, `pass`, `hit`, `gameover`), with procedural fallbacks in `GameAudio.js`.
- **Voice** — `VoiceOver.js` uses **speechSynthesis** for menu/game-over phrases when **not** muted.

### Camera & juice

- Camera **follows** the cat with vertical smoothing.
- **Near-miss** red vignette and **shake** on death; milestone **confetti** / fireworks scaled by **graphics tier** (`PerformanceBudget.js`, pooled rects in `Effects.js`).

### Meta progression (`GameProgress.js`)

- **`flappy_cat_progress`** in localStorage: missions, total runs, synced best for unlock checks, trail unlock flag.
- **Missions** (examples): pass **5 laundry** sets; reach **15** points **without** collecting fish (Normal/Daily).
- **Unlocks** — Extra **cat tints** (Ash, Mint, Sunset) from runs / best score; **spark trail** after a strong run or enough total runs.

### Game over

- Shows **death cause** string when tagged (laundry, dog, laser, rug, etc.).
- **Share** — Text via Web Share or clipboard; optional **screenshot** share/download.
- **Voice** — “Game over” (short delay after the sting).

### Settings (`OptionsScene` + `GameSettings.js`)

- **Graphics** — `auto` / `low` / `medium` / `high` (confetti and firework counts).
- **Sound** — Global mute for SFX, theme, and TTS.

---

## Persistence (localStorage)

| Key / area | Purpose |
|------------|---------|
| `flappy_cat_best` | Best score (used by `ScoreSystem`). |
| `flappy_cat_muted` | `1` = muted. |
| `flappy_cat_graphics_quality` | `auto` \| `low` \| `medium` \| `high`. |
| `flappy_cat_menu_tutorial_seen` | First-run menu overlay dismissed. |
| `flappy_cat_progress` | Runs, missions, unlock-related flags, synced best snapshot. |
| `flappy_cat_skin` | Selected cat tint id. |

---

## Project layout

```
flappy_cat/
├── index.html
├── package.json
├── public/
│   └── sounds/              # Optional WAV samples (jump, pass, hit, gameover)
├── src/
│   ├── main.js              # Phaser config, scene order
│   ├── styles.css
│   ├── scenes/
│   │   ├── BootScene.js     # Procedural textures (cat, hazards, fish, power-up icons)
│   │   ├── MenuScene.js
│   │   ├── OptionsScene.js
│   │   ├── GameScene.js     # Run loop, pickups, modes, HUD
│   │   └── GameOverScene.js
│   └── game/
│       ├── CatController.js
│       ├── InputController.js
│       ├── ObstacleManager.js
│       ├── ScoreSystem.js
│       ├── Effects.js
│       ├── GameAudio.js
│       ├── GameSettings.js
│       ├── GameProgress.js
│       ├── PerformanceBudget.js
│       ├── ThemeMusic.js
│       ├── VoiceOver.js
│       ├── rngHelper.js     # Seeded RNG for Daily mode
│       └── obstacles/
│           ├── LaundryObstacle.js
│           ├── FurnitureObstacle.js
│           ├── DogPatrolObstacle.js
│           ├── YarnBallObstacle.js
│           └── LaserObstacle.js
└── README.md
```

---

## Adding a new obstacle type

1. Add `src/game/obstacles/MyObstacle.js` with `static create(scene, x, difficulty, scrollSpeed)` returning at least `{ group, scoreZone }` (physics group + scrolling score zone).
2. For **Daily** determinism, use helpers from `rngHelper.js` instead of raw `Math.random` / `Phaser.Math.Between` where the layout must match the seed.
3. In `GameScene.js`, register: `this.obstacles.register("tag", MyObstacle.create, weight);`
4. Add a **death message** in `GameScene` `DEATH_MESSAGES` if the tag should show custom copy on game over.

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| No sound until click | Browsers require a **user gesture** before AudioContext runs; tap the menu or Play. |
| No voice | **Web Speech** depends on the OS/browser; ensure sound is **not** muted; some mobile browsers limit TTS. |
| `npm` / Vite errors | Node **18+**, run commands from the `flappy_cat` folder. |
| Blank page on `file://` | Use **`npm run dev`** or **`npm run preview`** (or any static server for `dist/`). |

---

## License / assets

- **Sprites** are drawn in `BootScene` with Phaser Graphics (procedural textures)—no bundled raster art pack.
- **Theme music** is **generated in code** (original loop, not a recording of third-party music).
- Replace WAVs under `public/sounds/` with your own assets if you ship commercially and need a specific sound direction.
