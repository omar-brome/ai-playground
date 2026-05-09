Author your FMOD Studio project here (or keep it external) and import the FMOD Unity Integration from https://fmod.com/download

After import, add scripting define symbol HOLLOW_FMOD (Player Settings) and assign EventReferences on FMODManager.

Match parameters on Master bus / events: tension, monsterDist, sanity (all 0–1).

Design mapping (Unity placeholders → FMOD when ready)
-----------------------------------------------
• Menu / asylum bed: procedural 2D ambience (MainMenuAmbience, HollowGameplayAudio) → FMOD music/ambience events; duck or mute Unity sources when FMOD beds are wired.
• Footsteps / stings: Unity one-shots → FMOD footstep surface events + transition stingers.
• Creature body loop: MonsterPresenceAudio (3D AudioSource, distance-curved volume) → add a Studio **3D looping** event parented to the monster (e.g. breathing/rumble), driven by distance parameter if needed. Then on the MonsterPresenceAudio component set **Use Unity Fallback When Fmod** = false so only FMOD plays.

Keep a Unity AudioListener on the player camera for non-FMOD clips; add FMOD Studio Listener on the same camera when HOLLOW_FMOD is on.
