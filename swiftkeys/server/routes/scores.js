import { Router } from "express";
import { pool, requireDatabase } from "../db.js";

const router = Router();
const difficulties = new Set(["easy", "medium", "hard"]);
const modes = new Set(["timed", "words"]);
const timedDurations = new Set([15, 30, 60, 120]);
const wordDurations = new Set([10, 25, 50, 100]);

function isValidDuration(mode, duration) {
  return mode === "timed" ? timedDurations.has(duration) : wordDurations.has(duration);
}

function validateScorePayload(payload) {
  const username = String(payload.username ?? "").trim();
  const wpm = Number(payload.wpm);
  const accuracy = Number(payload.accuracy);
  const difficulty = String(payload.difficulty ?? "");
  const mode = String(payload.mode ?? "");
  const duration = Number(payload.duration);

  if (!username || username.length > 30) {
    return { error: "Username is required and must be 30 characters or less." };
  }

  if (!Number.isInteger(wpm) || wpm < 0 || wpm > 400) {
    return { error: "WPM must be an integer between 0 and 400." };
  }

  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) {
    return { error: "Accuracy must be between 0 and 100." };
  }

  if (!difficulties.has(difficulty)) {
    return { error: "Difficulty must be easy, medium, or hard." };
  }

  if (!modes.has(mode)) {
    return { error: "Mode must be timed or words." };
  }

  if (!Number.isInteger(duration) || !isValidDuration(mode, duration)) {
    return { error: "Duration is not valid for the selected mode." };
  }

  return {
    value: {
      username,
      wpm,
      accuracy,
      difficulty,
      mode,
      duration,
    },
  };
}

function buildLeaderboardFilters(query) {
  const filters = [];
  const values = [];

  if (difficulties.has(query.difficulty)) {
    values.push(query.difficulty);
    filters.push(`difficulty = $${values.length}`);
  }

  if (modes.has(query.mode)) {
    values.push(query.mode);
    filters.push(`mode = $${values.length}`);
  }

  const duration = Number(query.duration);

  if (Number.isInteger(duration)) {
    values.push(duration);
    filters.push(`duration = $${values.length}`);
  }

  return {
    whereClause: filters.length ? `WHERE ${filters.join(" AND ")}` : "",
    values,
  };
}

router.post("/scores", requireDatabase, async (req, res, next) => {
  try {
    const validation = validateScorePayload(req.body);

    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const { username, wpm, accuracy, difficulty, mode, duration } = validation.value;

    const insertResult = await pool.query(
      `INSERT INTO scores (username, wpm, accuracy, difficulty, mode, duration)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [username, wpm, accuracy, difficulty, mode, duration],
    );

    const rankResult = await pool.query(
      `SELECT COUNT(*)::int + 1 AS rank
       FROM scores
       WHERE difficulty = $1
         AND mode = $2
         AND duration = $3
         AND (wpm > $4 OR (wpm = $4 AND accuracy > $5))`,
      [difficulty, mode, duration, wpm, accuracy],
    );

    return res.status(201).json({
      success: true,
      id: insertResult.rows[0].id,
      rank: rankResult.rows[0].rank,
      created_at: insertResult.rows[0].created_at,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/leaderboard", requireDatabase, async (req, res, next) => {
  try {
    const { whereClause, values } = buildLeaderboardFilters(req.query);

    const result = await pool.query(
      `SELECT
         ROW_NUMBER() OVER (ORDER BY wpm DESC, accuracy DESC, created_at ASC)::int AS rank,
         username,
         wpm,
         accuracy::float,
         difficulty,
         mode,
         duration,
         created_at
       FROM scores
       ${whereClause}
       ORDER BY wpm DESC, accuracy DESC, created_at ASC
       LIMIT 20`,
      values,
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.get("/leaderboard/user/:username", requireDatabase, async (req, res, next) => {
  try {
    const username = String(req.params.username ?? "").trim();

    if (!username || username.length > 30) {
      return res.status(400).json({ error: "Username is required and must be 30 characters or less." });
    }

    const result = await pool.query(
      `SELECT id, username, wpm, accuracy::float, difficulty, mode, duration, created_at
       FROM scores
       WHERE username = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [username],
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

export default router;
