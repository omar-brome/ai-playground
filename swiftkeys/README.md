# Swiftkeys

Swiftkeys is a full-stack typing speed test web app inspired by Monkeytype. It has a polished dark UI, a precise React typing engine, live WPM/accuracy stats, results charts, and an optional PostgreSQL-backed leaderboard.

The app is designed to work in two modes:

- **Frontend demo mode:** typing tests, results, charts, username storage, and local/demo leaderboard work without a backend or database.
- **Full-stack mode:** Express + PostgreSQL stores global leaderboard scores when `DATABASE_URL` is configured.

## Tech Stack

### Client

- React
- Vite
- Tailwind CSS
- Framer Motion
- Recharts

### Server

- Node.js
- Express
- PostgreSQL via `pg`
- Raw SQL, no ORM

## Project Structure

```text
swiftkeys/
  client/
    src/
      components/
        Navbar.jsx
        SettingsBar.jsx
        TestArea.jsx
        WordDisplay.jsx
        Cursor.jsx
        LiveStats.jsx
        Timer.jsx
        ResultsCard.jsx
        WpmChart.jsx
        Leaderboard.jsx
        UsernameModal.jsx
      hooks/
        useTypingEngine.js
        useTimer.js
        useLeaderboard.js
      data/
        words.js
      utils/
        text.js
  server/
    db.js
    server.js
    schema.sql
    routes/
      scores.js
```

## Features

- Random word passages by difficulty: easy, medium, hard
- Timed modes: `15s`, `30s`, `60s`, `120s`
- Word-count modes: `10`, `25`, `50`, `100`
- Timer starts on the first valid keystroke
- Escape resets the test instantly
- Correct characters render lime green
- Incorrect characters render red with a subtle shake
- Current word is highlighted
- Blinking cursor at the current character
- Live raw WPM, net WPM, accuracy, and character count
- Final results card with WPM-over-time chart
- Username-only local auth via `localStorage`
- Score saving when a username is set
- Demo/local leaderboard fallback if the backend is unavailable
- PostgreSQL leaderboard when the server and database are configured

## Client Setup

```bash
cd /Users/omarbrome/Documents/Codes/ai-playground/swiftkeys/client
npm install
npm run dev
```

The client runs on:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:3001`.

## Server Setup

```bash
cd /Users/omarbrome/Documents/Codes/ai-playground/swiftkeys/server
npm install
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/typingtest
PORT=3001
```

Start the server:

```bash
node server.js
```

The server runs on:

```text
http://localhost:3001
```

If `DATABASE_URL` is missing, the API starts but leaderboard persistence returns `503`. The frontend still works in demo mode.

## Database Setup

Create the database, then run:

```bash
psql "$DATABASE_URL" -f schema.sql
```

Schema:

```sql
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
```

When the DB connection succeeds, the server logs:

```text
DB connected
```

## API

### `POST /api/scores`

Body:

```json
{
  "username": "omar",
  "wpm": 92,
  "accuracy": 97.5,
  "difficulty": "medium",
  "mode": "timed",
  "duration": 60
}
```

Returns:

```json
{
  "success": true,
  "rank": 1
}
```

### `GET /api/leaderboard`

Example:

```text
/api/leaderboard?difficulty=medium&mode=timed&duration=60
```

Returns the top 20 scores matching the filters.

### `GET /api/leaderboard/user/:username`

Returns recent scores for a single username.

## Demo Mode

If the backend or database is not available, `useLeaderboard.js` falls back to local/demo scores. Submitted scores are stored in browser `localStorage` under:

```text
swiftkeys.demoScores
```

This keeps the app fully usable while PostgreSQL is not configured.

## Build

```bash
cd /Users/omarbrome/Documents/Codes/ai-playground/swiftkeys/client
npm run build
```

## Notes

- All typing logic lives in `client/src/hooks/useTypingEngine.js`.
- Timer lifecycle and cleanup live in `client/src/hooks/useTimer.js`.
- Leaderboard API/fallback behavior lives in `client/src/hooks/useLeaderboard.js`.
- Word lists and passage generation live in `client/src/data/words.js` and `client/src/utils/text.js`.
