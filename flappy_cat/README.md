# Flappy Cat (Phaser 3)

A playful Flappy Bird-inspired game where a jumpy cat survives household chaos: swinging laundry, stacked furniture, and dog patrol hazards.

---

## Technologies

| Layer | Choice | Role |
|--------|--------|------|
| **Game engine** | [Phaser 3](https://phaser.io/) (~3.90.x) | 2D rendering, Arcade physics, scenes, collisions, particles |
| **Bundler / dev server** | [Vite](https://vitejs.dev/) (~5.4.x) | Fast dev server with HMR, production builds |
| **Language** | **JavaScript** (ES modules, `"type": "module"`) | No TypeScript toolchain for quick iteration |
| **Styling** | Plain **CSS** (`src/styles.css`) | Page/chrome around the canvas |
| **Storage** | **localStorage** | Best score persistence (see below) |

The game runs entirely in the **browser**—no Electron or native runtime required.

---

## Prerequisites

You need a **Node.js** runtime with **npm** (Node 18+ is recommended; Vite 5 expects a recent Node).

- Check versions:

  ```bash
  node -v
  npm -v
  ```

If `npm` is missing, install [Node.js](https://nodejs.org/) (the LTS installer includes npm).

---

## How to run

From this directory (`flappy_cat`):

### Development (hot reload)

```bash
npm install
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`). Open it in a browser. Edits to source files reload while the dev server runs.

### Production build

```bash
npm install
npm run build
```

Output goes to `dist/`. Deploy `dist/` to any static host (GitHub Pages, Netlify, etc.).

### Preview the production build locally

```bash
npm run preview
```

This serves `dist/` so you can verify the built game before deploying.

---

## Controls

| Input | Action |
|--------|--------|
| **Space** | Jump / flap |
| **Click or touch** anywhere | Jump / flap |

On the menu and game-over screens, **Play / Restart** can also be triggered with Space or tap, depending on the scene.

---

## Gameplay overview

- **Gravity** pulls the cat down; each input applies an upward **jump impulse**.
- Passing **score zones** (invisible triggers placed with obstacle sets) increments the score and briefly shows particle feedback.
- **Colliding** with obstacle bodies or falling off-screen ends the run and opens the game-over scene.
- **Difficulty** ramps over time (scroll speed increases, spawn pacing tightens somewhat).

---

## Obstacle themes (required set)

1. **Laundry Chaos** — Hanging lines and shirt pieces that scroll with the stage; some pieces **bob vertically** via tweens for an “alive” feel.
2. **Furniture Maze** — Sofas, chairs, and tables **stacked** above and below a central gap so the lane changes each spawn.
3. **Dog Patrol Zones** — Dogs as hazards; optionally **moving** vertically for patrol-like motion.

New obstacle families are wired through a small **registry API** so you rarely touch core scene logic beyond one `register(...)` line.

---

## Project layout

```
flappy_cat/
├── index.html              # Canvas mount point
├── package.json           # Scripts and dependencies
├── src/
│   ├── main.js            # Phaser config + scene list
│   ├── styles.css         # Layout / canvas chrome
│   ├── scenes/
│   │   ├── BootScene.js   # Procedural textures, then jump to menu
│   │   ├── MenuScene.js  # Title + Play
│   │   ├── GameScene.js  # Loop, spawning, HUD, collisions
│   │   └── GameOverScene.js
│   └── game/
│       ├── CatController.js
│       ├── InputController.js
│       ├── ObstacleManager.js   # Spawn timing + weighted registry + cleanup
│       ├── ScoreSystem.js
│       ├── Effects.js          # Shake, particles
│       └── obstacles/          # One module per obstacle “family”
│           ├── LaundryObstacle.js
│           ├── FurnitureObstacle.js
│           └── DogPatrolObstacle.js
├── README.md
└── prompt.md                # Original design brief (optional reference)
```

**Separation of concerns**

- **Game loop / state** — Mostly `GameScene` (Phaser `update` tick).
- **Physics** — Phaser Arcade bodies on sprites/zones; custom gravity/acceleration logic for the cat in `CatController`.
- **Rendering** — Phaser Scene API (images, rects, particles); textures generated in `BootScene`.
- **Input** — `InputController` (keyboard + pointer).

---

## Scoring and persistence

- Current run score increments when the cat overlaps a spawn’s **score zone** once per obstacle.
- **Best score** is stored under the key **`flappy_cat_best`** in `localStorage`.

To reset the best score in devtools: Application → Local Storage → remove `flappy_cat_best`.

---

## Extending the game

### Add a new obstacle type

1. Create `src/game/obstacles/YourObstacle.js` exporting a class with a static `create(scene, x, difficulty, scrollSpeed)` that returns:

   `{ group, scoreZone }`

   Where:

   - `group` — a Phaser physics group containing all collidable sprites (_velocity X_ should match scroll).
   - `scoreZone` — a physics body (usually a narrow vertical `Zone`) that moves with the same horizontal speed; when the cat passes it, the score increments.

2. In `GameScene.js`, after constructing `ObstacleManager`, register it:

   ```js
   this.obstacles.register("your_name", YourObstacle.create, 1);
   ```

   The **weight** argument biases random selection (higher = more frequent).

### Optional stretch ideas (not implemented by default)

- Cat skins (swap texture key in `BootScene` + menu)
- Day/night background tweens in `GameScene`
- Web Audio or small OGG assets for jump / hit / score
- Extra hazards: laser lines, yarn balls, vacuum sweeps—each as another `obstacles/*.js` module

---

## Troubleshooting

| Issue | What to try |
|--------|-------------|
| `npm: command not found` | Install Node.js LTS; ensure your terminal sees the same PATH as your IDE. |
| Blank page / console errors | Run from project root `flappy_cat`; use `npm run dev` (not opening `index.html` as a `file://` URL unless you rely on other tooling). |
| Wrong Node version errors from Vite | Upgrade to Node 18+ (`node -v`). |
| Build works but physics feels off | Tune `jumpVelocity`, `gravity`, and `maxFall` in `CatController.js`; tune `scrollSpeed` / spawn interval ramp in `ObstacleManager.js` and difficulty in `GameScene.js`. |

---

## License / assets

Sprites are **generated in code** in `BootScene` (simple shapes)—no separate image packs to attribute. Swap in real sprites later by loading assets in `BootScene` or a dedicated preload scene.
