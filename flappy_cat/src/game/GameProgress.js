const PROGRESS_KEY = "flappy_cat_progress";
const SKIN_KEY = "flappy_cat_skin";

/** @typedef {{ id: string, tint: number, label: string, check: (p: object) => boolean }} SkinDef */

/** @type {SkinDef[]} */
export const CAT_SKINS = [
  { id: "default", tint: 0xffffff, label: "Classic", check: () => true },
  {
    id: "gray",
    tint: 0xc5d0d8,
    label: "Ash",
    check: (p) => (p.totalRuns ?? 0) >= 3 || effectiveBestScore() >= 8
  },
  {
    id: "mint",
    tint: 0x8ae8c8,
    label: "Mint",
    check: (p) => (p.totalRuns ?? 0) >= 12 || effectiveBestScore() >= 20
  },
  {
    id: "sunset",
    tint: 0xffb58a,
    label: "Sunset",
    check: (p) => (p.totalRuns ?? 0) >= 25 || effectiveBestScore() >= 35
  }
];

export function loadProgress() {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    const p = raw ? JSON.parse(raw) : {};
    return typeof p === "object" && p ? p : {};
  } catch {
    return {};
  }
}

/** Best score from both progress blob and legacy `flappy_cat_best` key (ScoreSystem). */
export function effectiveBestScore() {
  const p = loadProgress();
  const fromProgress = Number(p.bestScore ?? 0) || 0;
  const fromLs = Number(window.localStorage.getItem("flappy_cat_best") ?? 0) || 0;
  return Math.max(fromProgress, fromLs);
}

export function saveProgress(data) {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function recordRunEnd({ score, mode, laundryPassesThisRun = 0, fishCollectedThisRun = 0 }) {
  const p = loadProgress();
  p.totalRuns = (p.totalRuns ?? 0) + 1;
  if (mode === "normal" || mode === "daily") {
    const lsBest = Number(window.localStorage.getItem("flappy_cat_best") ?? 0) || 0;
    p.bestScore = Math.max(score, lsBest, Number(p.bestScore ?? 0) || 0);
  }
  // Missions
  p.missions = p.missions ?? {};
  const laundry = p.missions.passLaundry ?? { current: 0, target: 5, done: false };
  if (!laundry.done && laundryPassesThisRun > 0) {
    laundry.current = Math.min(laundry.target, laundry.current + laundryPassesThisRun);
    if (laundry.current >= laundry.target) {
      laundry.done = true;
    }
  }
  p.missions.passLaundry = laundry;

  const noFish = p.missions.reachNoFish ?? { current: 0, target: 1, done: false };
  const countNoFish =
    (mode === "normal" || mode === "daily") && !noFish.done && score >= 15 && fishCollectedThisRun === 0;
  if (countNoFish) {
    noFish.current = 1;
    noFish.done = true;
  }
  p.missions.reachNoFish = noFish;

  // Trail unlock: any run score ≥ 15 once
  if (score >= 15) {
    p.seenScore15 = true;
  }
  saveProgress(p);
}

export function isTrailUnlocked() {
  const p = loadProgress();
  return !!(p.seenScore15 || (p.totalRuns ?? 0) >= 6);
}

export function getUnlockedSkins() {
  const p = loadProgress();
  return CAT_SKINS.filter((s) => s.check(p)).map((s) => s.id);
}

export function getSelectedSkinId() {
  try {
    const id = window.localStorage.getItem(SKIN_KEY);
    return id && getUnlockedSkins().includes(id) ? id : "default";
  } catch {
    return "default";
  }
}

export function setSelectedSkinId(id) {
  if (!getUnlockedSkins().includes(id)) {
    return false;
  }
  try {
    window.localStorage.setItem(SKIN_KEY, id);
  } catch {
    /* ignore */
  }
  return true;
}

export function getSkinTint(id) {
  const s = CAT_SKINS.find((x) => x.id === id);
  return s ? s.tint : 0xffffff;
}

export function getMissionHudLines() {
  const p = loadProgress();
  const m = p.missions ?? {};
  const laundry = m.passLaundry ?? { current: 0, target: 5, done: false };
  const noFish = m.reachNoFish ?? { current: 0, target: 1, done: false };
  const lines = [];
  if (!laundry.done) {
    lines.push(`Laundry line: ${laundry.current}/${laundry.target} sets`);
  }
  if (!noFish.done) {
    lines.push(`No-fish run: reach 15 pts once`);
  }
  if (lines.length === 0) {
    lines.push(`Missions complete!`);
  }
  return lines;
}
