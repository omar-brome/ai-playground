# Ops: tests, E2E, analytics, Sentry

## Commands

- `npm run test` — Vitest unit tests (`src/**/*.test.ts(x)`).
- `npm run test:coverage` — Vitest with coverage (see `vite.config.ts` `test.coverage.include`).
- `npm run test:e2e:install` — Download Playwright Chromium into `.pw-browsers` (first time / CI).
- `npm run test:e2e` — Playwright smoke spec (starts Vite on `127.0.0.1:5173`).

## Environment variables

See [`.env.example`](../.env.example): `VITE_ANALYTICS_ENABLED`, `VITE_ANALYTICS_ENDPOINT`, `VITE_SENTRY_DSN`. When unset or disabled, analytics and Sentry stay inert (no third-party traffic).
