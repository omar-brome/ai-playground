import pg from "pg";

const { Pool } = pg;

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export const pool = hasDatabaseUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : null;

export async function testConnection() {
  if (!pool) {
    console.warn("DATABASE_URL is not set. Leaderboard API will run in unavailable mode.");
    return false;
  }

  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("DB connected");
    return true;
  } finally {
    client.release();
  }
}

export function requireDatabase(_req, res, next) {
  if (!pool) {
    return res.status(503).json({
      error: "Database is not configured. Create server/.env with DATABASE_URL to enable persistence.",
    });
  }

  return next();
}
