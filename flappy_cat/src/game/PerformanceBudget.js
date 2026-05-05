import { getGraphicsQuality } from "./GameSettings";

/**
 * Hardware-only tier (used when graphics quality is "auto").
 */
function detectHardwareTier() {
  const cores = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 4;
  const mem =
    typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : null;

  if (cores <= 2 || mem === 1 || mem === 2) {
    return "low";
  }
  if (cores <= 4 || mem === 4) {
    return "medium";
  }
  return "high";
}

/**
 * Effective tier for milestone / firework intensity (respects Options → Graphics).
 */
export function getEffectsTier() {
  const pref = getGraphicsQuality();
  if (pref === "low" || pref === "medium" || pref === "high") {
    return pref;
  }
  return detectHardwareTier();
}

/** Confetti pieces, firework burst count, particles per burst, tween timing scale */
export function getMilestoneBudget(tier) {
  switch (tier) {
    case "low":
      return { confetti: 22, bursts: 3, fireworkQty: 16, stagger: 165 };
    case "medium":
      return { confetti: 44, bursts: 5, fireworkQty: 28, stagger: 130 };
    default:
      return { confetti: 72, bursts: 8, fireworkQty: 48, stagger: 100 };
  }
}
