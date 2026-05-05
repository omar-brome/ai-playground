import { syncThemeMusicMute } from "./ThemeMusic.js";

const MUTE_KEY = "flappy_cat_muted";
const GRAPHICS_KEY = "flappy_cat_graphics_quality";
const MENU_TUTORIAL_KEY = "flappy_cat_menu_tutorial_seen";

/** @type {readonly ["auto","low","medium","high"]} */
export const GRAPHICS_MODES = ["auto", "low", "medium", "high"];

export function isMuted() {
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(value) {
  window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
}

export function toggleMuted() {
  const next = !isMuted();
  setMuted(next);
  syncThemeMusicMute();
  return next;
}

/**
 * Milestone VFX intensity: "auto" uses device heuristics; otherwise forces that tier.
 * @returns {"auto"|"low"|"medium"|"high"}
 */
export function getGraphicsQuality() {
  const v = window.localStorage.getItem(GRAPHICS_KEY);
  if (v === "auto" || v === "low" || v === "medium" || v === "high") {
    return v;
  }
  return "auto";
}

export function setGraphicsQuality(mode) {
  if (!GRAPHICS_MODES.includes(mode)) {
    return;
  }
  window.localStorage.setItem(GRAPHICS_KEY, mode);
}

export function cycleGraphicsQuality() {
  const cur = getGraphicsQuality();
  const i = GRAPHICS_MODES.indexOf(cur);
  const next = GRAPHICS_MODES[(i + 1) % GRAPHICS_MODES.length];
  setGraphicsQuality(next);
  return next;
}

export function hasSeenMenuTutorial() {
  return window.localStorage.getItem(MENU_TUTORIAL_KEY) === "1";
}

export function setMenuTutorialSeen() {
  window.localStorage.setItem(MENU_TUTORIAL_KEY, "1");
}
