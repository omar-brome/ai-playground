# Hollow

**Hollow** is a first-person **psychological horror** prototype built in **Unity 6** with the **Universal Render Pipeline (URP)**. You explore a minimal asylum blockout while an AI creature hunts you. The design goal is that *the hollow adapts to you*: it reacts to **noise** (footsteps and your **microphone**), remembers **hiding spots** it has caught you in, and can be extended with **ML-Agents**, **FMOD**, and an optional **Whisper** voice sidecar.

**Unity Hub path:** open the folder **`ai-playground/hollow/My project`** (this directory).

---

## What you’re playing

- **Genre:** First-person horror / stealth prototype (not a shipped game — a vertical slice for systems).
- **Setting:** A greybox **asylum yard** (floor, perimeter walls, fog, one **locker** hiding volume) spawned at runtime by **`HollowLevelBootstrap`** on scene `Level_Asylum`.
- **Threat:** A **monster** with **NavMesh** locomotion, a **state machine** (`MonsterBrain`), **sight** (cone + range + obstacle raycasts), **hearing** (via the global **`NoiseSystem`**), and **memory** (`MonsterMemory`) for suspicious hiding spots.
- **You:** Move, look, **hide** near the locker, manage **noise**; the creature turns with a **capped yaw rate** so you can break line-of-sight by circling, and **hearing** uses a **strength threshold** so it does not snap back to a full chase on every residual footstep blip.

---

## Core mechanics

| System | Role |
|--------|------|
| **NoiseSystem** | Collects short-lived noise events (footsteps, mic RMS, props). The monster queries the loudest event in range and uses a **decay** model. |
| **MicrophoneNoiseListener** | Live mic **RMS**; loud room audio can raise tension via noise emission (grant **macOS microphone** permission). |
| **MonsterBrain** | FSM: Patrolling → Investigating → Hunting → Searching → CheckingSpots (plus Stalking hook). Transitions drive **`FMODManager`** tension stubs when FMOD is off. |
| **MonsterNavigation** | **NavMeshAgent** with **manual rotation** (limited °/s) so the player can escape the sight cone; **stopping distance** avoids the agent sitting inside the player capsule. |
| **MonsterSenses** | Vision cone + **Obstacle** layer raycasts; hearing respects **`minHearStrength`**. |
| **MonsterMemory** | Records hiding spots when you’re **discovered** there; raises suspicion weights used when **CheckingSpots**. |
| **PlayerHiding** | **E** to enter a nearby **`HidingSpot`**; discovery at close range teaches the monster that spot. |
| **AdaptiveDifficulty** | Tracks hides / play patterns and nudges **aggression** / **intelligence** over time. |
| **HollowGameplayAudio** | **Procedural** ambience + footstep thuds (no asset pack required). Optional **FMOD** replaces/extends this later. |

---

## Controls

| Input | Action |
|-------|--------|
| **WASD** | Move |
| **Mouse** | Look (click Game view to lock cursor) |
| **E** | Hide / exit hide when inside locker range |
| **Esc** | Toggle pause |
| **R** | Resume (when paused) |
| **T** | Restart **current** scene (works from pause UI too) |
| Pause UI | **Resume**, **Restart level**, **Main menu** |

---

## How to run

1. Install **Unity 6000.x** (project authored against **6000.4.6f1**).
2. **Unity Hub → Add →** select **`My project`** (this folder).
3. Open the project; wait for **Package Manager** (URP, **AI Navigation**, **Input System**, **ML-Agents**).
4. Press **Play**. The editor script **`HollowPlayModeStartScene`** aims to start from **`MainMenu`**. If you still see the empty **SampleScene**, open **`Assets/Scenes/MainMenu.unity`** or use **Hollow → Use MainMenu as Play Mode Start Scene**.
5. In the Game window, click **Play — Hollow** to load **`Level_Asylum`** (build order: **MainMenu** → **Level_Asylum**).

**Audio:** Ensure the Game view is **not muted**, macOS volume is up, and **Project Settings → Audio** is sensible. Procedural audio runs on the **player camera**; FMOD is optional.

**Microphone (macOS):** Allow microphone access for the editor/player, or mic-driven noise stays at zero.

---

## Project layout (high level)

```
My project/
├── Assets/
│   ├── Scripts/
│   │   ├── Monster/     # Brain, Navigation, Senses, Memory, ML agent, Animator
│   │   ├── Player/      # FPS controller, noise, hiding, mic, inventory
│   │   ├── Systems/     # Noise, game state, bootstrap, Whisper client, WAV helper
│   │   ├── Audio/       # FMOD wrapper (stub or real), procedural audio, placeholders
│   │   ├── Environment/ # HidingSpot, doors, lights, props
│   │   ├── UI/          # Main menu, HUD, sanity hook
│   │   └── Editor/      # Play Mode start scene helper
│   ├── Scenes/          # MainMenu, Level_Asylum, SampleScene (template)
│   ├── ML-Agents/       # monster_ppo.yaml, Results/
│   ├── FMODProject/     # Notes for Studio + import
│   └── …
├── whisper_server/      # Optional Flask + Whisper HTTP API
├── Packages/manifest.json
└── README.md            # (this file)
```

---

## Optional: FMOD

1. Import **FMOD Unity Integration** from [fmod.com/download](https://fmod.com/download).
2. **Player Settings → Scripting Define Symbols:** add **`HOLLOW_FMOD`**.
3. Wire **`FMODManager`** events and parameters (`tension`, `monsterDist`, `sanity`). See **`Assets/FMODProject/README.txt`**.

Without FMOD, **`FMODManager`** is a **stub** (optional debug logs).

---

## Optional: ML-Agents

- Config: **`Assets/ML-Agents/config/monster_ppo.yaml`**. Default behavior name key **`My Behavior`** matches a fresh Agent in the Inspector (change YAML or Behavior Name so they match).
- **`MonsterMLAgent`** is **disabled** in the bootstrap until you set **Behavior Parameters** (e.g. **9** vector observations; discrete space sized for your `OnActionReceived` encoding).
- Train with **`mlagents-learn`** and write models under **`Assets/ML-Agents/Results/`**.

---

## Optional: Whisper sidecar

```bash
cd whisper_server
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

Unity **`WhisperClient`** POSTs WAV data to **`http://localhost:5000/transcribe`** (see **`WavUtility`**).

---

## Tags and layers

- **Tag:** `Player`
- **User layer:** `Obstacle` (environment + NavMesh geometry; used for LOS raycasts)

---

## Product / template notes

- **Product Name** in Player Settings: **Hollow**
- **Active Input Handling:** Both (legacy + **Input System**) for UI and movement.
- **SampleScene** is the default URP empty scene — it is **not** the game; use **MainMenu** or **Level_Asylum**.

---

## Suggested playtest order

1. Confirm **patrol** between the four empty patrol points.
2. **Walk** — footsteps emit noise; monster **investigates** then **hunts** if it sees you.
3. **Circle** behind the monster to break **LOS**; **pause movement** briefly so **hearing** does not instantly re-aggro.
4. **Hide** at the locker; let it **discover** you once and watch **memory** bias later **spot checks**.
5. Layer **FMOD**, then **ML-Agents**, then **Whisper** when you are ready.
