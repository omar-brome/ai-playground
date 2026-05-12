import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { hasDatabaseUrl, testConnection } from "./db.js";
import scoreRoutes from "./routes/scores.js";

dotenv.config();

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json({ limit: "32kb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "Swiftkeys API",
    status: "ok",
    database: hasDatabaseUrl ? "configured" : "missing DATABASE_URL",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    databaseConfigured: hasDatabaseUrl,
  });
});

app.use("/api", scoreRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Unexpected server error." });
});

async function start() {
  try {
    await testConnection();
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Swiftkeys server listening on http://localhost:${PORT}`);
  });
}

start();
