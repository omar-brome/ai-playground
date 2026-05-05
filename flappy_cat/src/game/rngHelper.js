import Phaser from "phaser";

/**
 * When `_dailyRng` is set on the game registry (Daily Challenge), all gameplay
 * randomness goes through a deterministic seeded generator.
 */
export function rndBetween(scene, min, max) {
  const rng = scene?.game?.registry?.get("_dailyRng");
  if (rng) {
    return rng.between(min, max);
  }
  return Phaser.Math.Between(min, max);
}

export function rndFloat(scene, min, max) {
  const rng = scene?.game?.registry?.get("_dailyRng");
  if (rng) {
    return rng.realInRange(min, max);
  }
  return Phaser.Math.FloatBetween(min, max);
}

export function chance(scene, p) {
  return rndFloat(scene, 0, 1) < p;
}
