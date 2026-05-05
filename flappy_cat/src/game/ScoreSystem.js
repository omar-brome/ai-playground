const BEST_SCORE_KEY = "flappy_cat_best";

export class ScoreSystem {
  constructor() {
    this.score = 0;
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    this.best = Number(raw ?? 0) || 0;
  }

  increment() {
    this.score += 1;
    if (this.score > this.best) {
      this.best = this.score;
      window.localStorage.setItem(BEST_SCORE_KEY, String(this.best));
    }
    return this.score;
  }
}
