# Hollow

**Hollow** is a first-person **psychological horror** prototype built in **Unity 6** with the **Universal Render Pipeline (URP)**. You explore a minimal asylum blockout while an AI creature hunts you. The design goal is that *the hollow adapts to you*: it reacts to **noise** (footsteps and your **microphone**), remembers **hiding spots** it has caught you in, and can be extended with **ML-Agents**, **FMOD**, and an optional **Whisper** voice sidecar.

**Unity Hub path:** open the folder **`ai-playground/hollow/My project`** (this directory).

---

## What you’re playing

- **Genre:** First-person horror / stealth prototype (not a shipped game — a vertical slice for systems).
- **Setting:** A **stylized night asylum** (floor, perimeter walls, **procedural starry skybox**, **trilight + moon** fill, lighter fog for readability, **procedurally placed interior walls** with guaranteed central doorways, **random cover pillars**, **three south-wall lockers**, and a **jittered exit / patrol / spawn layout**) built at runtime by **`HollowLevelBootstrap`** on scene `Level_Asylum`. Each run uses a new **layout seed** (`HollowLevelSession`): press **Play** from the main menu or **restart the level (T)** to regenerate geometry. The current seed is shown in the **bottom-right** of the HUD for debugging or sharing layouts.
- **Threat:** A **monster** with **NavMesh** locomotion, a **composite “creature” silhouette** (runtime primitives + emissive eyes; gameplay collider unchanged), a **state machine** (`MonsterBrain`), **sight** (cone + range + obstacle raycasts), **hearing** (via the global **`NoiseSystem`**), and **memory** (`MonsterMemory`) for suspicious hiding spots.
- **You:** Move, look, **hide** in any south-wall locker (green strip markers), manage **noise**; the creature turns with a **capped yaw rate** so you can break line-of-sight by circling, and **hearing** uses a **strength threshold** so it does not snap back to a full chase on every residual footstep blip.

### Win / lose

- **Win (either):** reach the **cyan exit gate** at the **north** wall, **or** survive until the **timer** in the top-left hits zero (default **150 s**).
- **Lose:** the creature **catches** you while **Hunting** (close planar distance, not while hidden in a locker).
- End screen: **Restart** / **Main menu**. Hiding uses **vignette + low-pass audio** + quieter ambience; the monster **telegraphs** Investigating / Hunting with a **local light pulse** and **procedural sting**, and has a short **wind-up** at chase start before full run speed.

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
| **PatternTracker** | Samples **player routes** and **patrol legs**, biases **investigation** targets toward movement hotspots, and feeds **MonsterMemory** locker suspicion while **Searching** (HUD shows running counters). |
| **PlayerPatternEmitter** | Periodically records player position into **PatternTracker** and **MonsterMemory** path history. |
| **HollowGameplayAudio** | **Procedural** ambience + footstep thuds; **muffles** while hiding. |
| **MainMenuAmbience** | **2D** procedural drone on **MainMenu** (requires **AudioListener** — created at runtime if missing). |
| **MonsterPresenceAudio** | **3D** procedural breathing/rumble on the creature; volume/pitch shaped by **distance** to the player. Disable when FMOD body-loop is ready (see **`Assets/FMODProject/README.txt`**). |
| **HidingScreenFeedback** | Full-screen dim + edge vignette + **HIDDEN** prompt; **AudioLowPassFilter** on camera. |
| **HollowLevelObjective** / **ExitTrigger** | Timer survival win + **exit** trigger win. |
| **MonsterTelegraph** | Point light + sting SFX on **Investigating** / **Hunting** / **Searching** transitions. |
| **GameStateManager** | **HollowLevelOutcome**: Ongoing / ReachedExit / SurvivedTimer / CaughtByMonster. |
| **MonsterMLAgent** | Optional **ML-Agents** policy: only biases **aggression / intelligence / spot-check** on `MonsterBrain` when **`BehaviorParameters`** match the built-in spec (see **Optional: ML-Agents**). **NavMesh** stays on **`MonsterNavigation`**. |
| **HollowRuntimeVisuals** | Runtime **night atmosphere** (panoramic skybox, moon directional tuning, shared **URP Lit** materials for floor/walls/pillars/lockers/exit), **monster** layered mesh, **player** body tint. |
| **HollowSettings** | **`PlayerPrefs`** bridge (e.g. **mic sensitivity** 0.05–2, default 1) consumed by **`MicrophoneNoiseListener`** and the **pause** HUD slider. |
| **HUDController** | In-level HUD + **pause** menu (mic slider); **adaptation** line (**`PatternTracker`** counters). |

---

## Look and atmosphere

- **`HollowRuntimeVisuals`** runs early from **`HollowLevelBootstrap`**: seeds a **procedural night panorama** for **`RenderSettings.skybox`**, sets **ambient** to **Trilight** (readable fill in shadow), tunes the scene’s **directional** moon light, and applies **shared materials** so greybox geometry reads as cool concrete / metal at night.
- **Fog** density and color are chosen so distance still reads without crushing mid-range visibility (tweak in bootstrap if you want heavier horror haze).
- The **creature** replaces the single capsule mesh with a small visual hierarchy; **collider**, **NavMeshAgent**, and scripts remain on the root.

---

## Main menu

- **`MainMenu`** builds a **Halloween / spooky** themed overlay at runtime: layered purple–orange mist, vignette, **HOLLOW** title treatment, seasonal subtitle and tag line, outlined **Enter the asylum** / **Grimoire (controls)** buttons, and faint corner “rune” text. A subtle **title pulse** runs in **`Update`**.
- **Developer credit** appears at the bottom: **Omar Brome** and contact email.
- **Controls** overlay uses the same palette (wine / pumpkin accents). If the scene already has a **Canvas**, this UI is skipped (author your own UI in that case).

---

## Controls

| Input | Action |
|-------|--------|
| **WASD** | Move |
| **Mouse** | Look (click Game view to lock cursor) |
| **Left Ctrl** | Crouch (quieter footsteps / lower noise) |
| **Left Shift** | Sprint while moving (louder footsteps) |
| **E** | Hide / exit hide when inside locker range |
| **F** | Toggle flashlight (drains battery while on) |
| **Esc** | Toggle pause |
| **R** | Resume (when paused) |
| **T** | Restart **current** scene — on **`Level_Asylum`** this **rolls a new layout seed** |
| Pause UI | **Resume**, **Restart level**, **Main menu**, **Mic sensitivity** slider (applies to **`MicrophoneNoiseListener`** via **`HollowSettings`**) |
| Main menu | **Controls** opens the overlay; **Back** or **Esc** closes it (UI uses **Input System** module, not legacy standalone). Themed **Enter the asylum** / **Grimoire** buttons and bottom **developer credit**. |

---

## Unity 6 API notes (this repo)

- **`RenderSettings.ambientMode`** uses **`AmbientMode`** from **`UnityEngine.Rendering`** (add `using UnityEngine.Rendering;` where needed).
- Prefer **`Object.FindObjectsByType<T>(FindObjectsInactive.…)`** without the obsolete **`FindObjectsSortMode`** argument (Unity 6 deprecation).

---

## How to run

1. Install **Unity 6000.x** (project authored against **6000.4.6f1**).
2. **Unity Hub → Add →** select **`My project`** (this folder).
3. Open the project; wait for **Package Manager** (URP, **AI Navigation**, **Input System**, **ML-Agents**).
4. Press **Play**. The editor script **`HollowPlayModeStartScene`** aims to start from **`MainMenu`**. If you still see the empty **SampleScene**, open **`Assets/Scenes/MainMenu.unity`** or use **Hollow → Use MainMenu as Play Mode Start Scene**.
5. In the Game window, click **Enter the asylum** to load **`Level_Asylum`** (build order: **MainMenu** → **Level_Asylum**). Use **Grimoire (controls)** on the main menu for an in-game summary of inputs. The asylum layout is **different every run** (new seed on Play and on in-level **Restart**).

**Audio:** Ensure the Game view is **not muted**, macOS volume is up, and **Project Settings → Audio** is sensible (global mute off). **Unity only hears sound if an `AudioListener` exists** — the main menu script adds one to **`Camera.main`** when needed, and asylum play spawns a listener on the **player camera**. Mood layers: **menu** = soft 2D drone; **level** = tension ambience + footsteps on the camera; **monster** = full **3D** presence loop (breathing/rumble) with distance falloff. When **FMOD** is wired, use it for beds/stingers/body-loop per **`Assets/FMODProject/README.txt`** and turn off **`MonsterPresenceAudio` → Use Unity Fallback When Fmod** when your Studio 3D loop is ready.

**FMOD vs Unity audio:** On the **main menu**, **FMOD Studio audio** is **off by default** (saved in PlayerPrefs). Leave it off to use **Unity procedural** audio only; turn it on only after banks and `FMODManager` events are wired. **`HollowAudioPreferences`** controls this at runtime.

**FMOD not playing (common):** (1) This repo has **no `.bank` files** until you export from FMOD Studio into the Unity project and refresh banks. (2) **`HollowLevelBootstrap` creates an empty `FMODManager`** at runtime unless you assign **`Fmod Manager Prefab`** — **EventReferences are blank**, so FMOD stays silent until fixed. (3) The editor may open **FMOD Setup Wizard** after integration updates; **`HideSetupWizard`** is set in `FMODStudioSettings` to reduce nagging — complete the wizard once (Studio path, bank output) or use **FMOD → Setup Wizard** manually when needed.

**Microphone (macOS):** Allow microphone access for the editor/player, or mic-driven noise stays at zero.

---

## Project layout (high level)

```
My project/
├── Assets/
│   ├── Scripts/
│   │   ├── Monster/     # Brain, Navigation, Senses, Memory, ML agent, Animator
│   │   ├── Player/      # FPS controller, noise, hiding, mic, inventory
│   │   ├── Systems/     # Noise, game state, bootstrap, level session seed, PatternTracker, HollowSettings, HollowRuntimeVisuals, Whisper client, WAV helper
│   │   ├── Audio/       # FMOD wrapper, ProceduralAudio, HollowGameplayAudio, menu + monster 3D presence
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
3. Wire **`FMODManager`** events and parameters (`tension`, `monsterDist`, `sanity`). See **`Assets/FMODProject/README.txt`** for how Unity **menu / ambience / `MonsterPresenceAudio`** map to Studio when you replace stubs.

Without FMOD, **`FMODManager`** is a **stub** (optional debug logs). **`MonsterPresenceAudio`** keeps providing a **3D** creature loop until you add a Studio body event and uncheck **Use Unity Fallback When Fmod**.

---

## Optional: ML-Agents

- Config: **`Assets/ML-Agents/config/monster_ppo.yaml`**. The runtime bootstrap sets **Behavior Name** to **`MonsterPPO`** and **Behavior Type** to **Heuristic Only** until you assign a trained model; match the YAML **behavior name** to that string (or change both sides).
- **`MonsterMLAgent`** only turns **on** when **`BehaviorParameters`** match the code: **vector observation size 8**, **stacked vectors 1**, **no continuous actions**, **one discrete branch** with size **≥ 25** (encoding for aggression / intelligence / spot-check bias in **`OnActionReceived`**). It does **not** drive NavMesh movement — **`MonsterNavigation`** stays authoritative.
- A **`DecisionRequester`** is added only when validation passes so the policy actually steps.
- Train with **`mlagents-learn`** and assign the exported model on the monster’s **`Behavior Parameters`** (switch behavior type to **Inference** or **Default** as appropriate).

---

## Production: authored scenes vs runtime bootstrap

- **`HollowLevelBootstrap` → `generateOnAwake`:** turn **off** when your **layout is stable** and you want an editor-authored level: place **player**, **monster**, **Systems** prefabs (with **`NoiseSystem`**, **`GameStateManager`**, **`PatternTracker`**, etc.), **bake NavMesh** in-scene, and wire references in the Inspector instead of spawning geometry in **`Awake`**.
- **`removeSceneMainCameraWhenGenerating`:** disable if the scene already contains your **FPS camera rig** (bootstrap normally destroys **`MainCamera`** so the runtime player camera can own the tag).
- Until then, runtime generation keeps iteration fast; swap to prefabs + baked NavMesh when you lock art and navigation.

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
4. **Hide** in a locker; let it **discover** you once and watch **memory** bias later **spot checks**.
5. Watch the **adaptation** line on the HUD as **`PatternTracker`** counts noise, spots, investigations, and patrol legs.
6. Layer **FMOD**, then **ML-Agents**, then **Whisper** when you are ready.
