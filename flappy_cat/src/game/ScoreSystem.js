const BEST_SCORE_KEY = "flappy_cat_best";

export class ScoreSystem {
  constructor(options = {}) {
    this.ignoreBest = options.ignoreBest === true;
    this.score = 0;
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    this.best = Number(raw ?? 0) || 0;
  }

  increment() {
    return this.addPoints(1);
  }

  addPoints(amount) {
    const n = Math.max(0, Math.floor(amount));
    if (n === 0) {
      return this.score;
    }
    this.score += n;
    if (!this.ignoreBest && this.score > this.best) {
      this.best = this.score;
      window.localStorage.setItem(BEST_SCORE_KEY, String(this.best));
    }
    return this.score;
  }
}
