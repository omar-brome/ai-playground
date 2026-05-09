# Hollow

**Hollow** is a first-person psychological horror prototype made in **Unity 6**. The tagline: *the hollow adapts to you* — a creature that patrols, listens for sound, learns where you hide, and leans on **`PatternTracker`** / **`MonsterMemory`** so investigations and spot checks reflect how you move. **ML-Agents** can modulate aggression and spot-check priority only (NavMesh stays authoritative). The asylum is presented as a **stylized night** level (**`HollowRuntimeVisuals`**: skybox, moon light, materials, creature silhouette). The **main menu** is a runtime-built **Halloween / spooky** UI with a developer credit line.

Unity does not keep the game files in this folder root. The actual project Unity Hub opens is:

**[`My project/`](./My%20project/)** — open **`My project`** in Unity Hub (full path: `ai-playground/hollow/My project`).

All setup, controls, systems, and optional FMOD / ML-Agents / Whisper notes live here:

**[→ Full documentation: `My project/README.md`](./My%20project/README.md)**

Quick pointer: after cloning, add the **`My project`** folder to Unity Hub, open it with **Unity 6000.x**, press **Play** (or start from **`MainMenu`** scene), then use **Enter the asylum** to load **`Level_Asylum`**. The **level layout is procedurally generated** with a new seed each time you start from the menu or restart the asylum; **Grimoire (controls)** on the main menu lists inputs. **Pause** in-level exposes a **mic sensitivity** slider (**`HollowSettings`**).
