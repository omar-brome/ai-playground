CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  username VARCHAR(30) NOT NULL,
  wpm INTEGER NOT NULL,
  accuracy NUMERIC(5,2) NOT NULL,
  difficulty VARCHAR(10) NOT NULL,
  mode VARCHAR(10) NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_difficulty_mode
  ON scores(difficulty, mode, duration);
