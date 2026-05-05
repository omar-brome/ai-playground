You are a senior game developer. Build a polished, fun, and extensible Flappy Bird-style game, but with a unique twist:

🎮 Game Concept

Create a 2D side-scrolling game inspired by Flappy Bird where the main character is a cute animated cat that flaps/jumps to survive obstacles.

The tone should be fun, slightly humorous, and visually charming.

⸻

🐱 Player Character

* Main character: a cat (simple sprite or shape-based if no assets)
* Animation: subtle “flap/jump” motion (e.g., tilt up when jumping, tilt down when falling)
* Physics: gravity + jump impulse on input (spacebar / tap)

⸻

🚧 Obstacles (Creative Theme Required)

Instead of boring pipes, design creative and themed barriers. Use at least 3 types:

Must include:

1. Laundry Chaos
    * Hanging clothes swinging slightly
    * Some clothes move up/down randomly
2. Furniture Maze
    * Sofas, chairs, tables creating narrow gaps
    * Some obstacles are stacked dynamically
3. Dog Patrol Zones
    * Sleeping dogs or moving guard dogs
    * If touched = game over

Bonus ideas (optional if time allows):

* Laser pointer beams (moving up/down like traps)
* Yarn balls that bounce unpredictably
* Vacuum cleaner sweeping across screen
* Floating shelves that fall after player passes

⸻

🎯 Core Gameplay

* Tap / space = jump
* Gravity pulls cat down
* Passing obstacles increases score
* Collision = game over
* Simple restart button

⸻

🧠 Game Feel Improvements (IMPORTANT)

Make it feel polished:

* Smooth physics (not too floaty)
* Slight screen shake on collision
* Small particle effect on score gain (optional)
* Increasing difficulty over time (speed increases gradually)

⸻

📊 UI / UX

* Start screen (Play button)
* Score counter (top)
* Game over screen with:
    * Final score
    * Best score (local storage)

⸻

🧱 Architecture Requirements

* Clean separation of:
    * Game loop
    * Physics
    * Rendering
    * Input handling
* Make it easy to add new obstacle types later

⸻

⚙️ Tech Preference

Use a simple, fast-to-develop 2D framework.

If web:

* Use Phaser.js (preferred) OR pure Canvas API

If desktop:

* Electron + Phaser OR lightweight JS game engine

Keep it minimal and fast to iterate.

⸻

🎨 Style Direction

* Cute, slightly cartoonish
* Soft colors
* Cat is expressive (tilt, tiny bounce, idle animation)
* Obstacles should feel “alive” not static

⸻

🚀 Stretch Goals (if time allows)

* Different cat skins (unlockable)
* Day/night background cycle
* Sound effects (jump, hit, score)
* Mobile touch support

⸻

💡 Best Tech Stack (for you)

🥇 Best choice: Phaser.js (Web game)

Why:

* Perfect for Flappy Bird-style mechanics
* Fast to prototype
* Huge community
* Easy collision + physics
* Runs instantly in browser (no setup pain)

👉 Stack:

* Phaser 3
* Vite (optional bundler)
* Vanilla JS or TypeScript

⸻

🥈 Alternative: Unity (if you want “serious game dev”)

Why:

* Better visuals & scaling
* More powerful physics
* But slower to iterate for a small hobby project

⸻

🥉 Not recommended (for this project):

* Unreal (too heavy)
* Pure mobile native (too slow for hobby iteration)

⸻

🔥 My recommendation for YOU

Go with:
👉 Phaser + Vite + JavaScript

You’ll get something playable in 1–3 hours, and you can keep expanding it like a real indie game.

⸻

If you want next step, I can:

* generate full starter Phaser project structure
* or code the first playable version for you
* or design cat sprites + obstacle visuals