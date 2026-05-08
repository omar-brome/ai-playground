# Malaab (ملاعب)

Mobile-first **5v5 mini-football** booking app for Lebanon with **Player** and **Pitch Host** modes.

## What Is Implemented

### Core product
- Venue browsing + match discovery.
- Team + role booking (GK / MID / ATT quotas per team).
- Host session scheduling (90-minute window, `:00` / `:30` constraints).
- Payment flow with proof upload and host approval/rejection.
- Booking lifecycle statuses (`pending`, `awaiting_host_approval`, `confirmed`, `expired`, `cancelled`).

### Social growth
- Deep-link invites: `/match/:id?team=team1&role=attacker`.
- Share URL builder + share text with recruitment hints.
- Waitlist when a role is full (DB + RPC + client UI).
- Auto-generated “Need N more attackers/midfielders/goalkeepers” banner.
- Open Graph/Twitter metadata on `MatchPage`.
- Optional Supabase edge function (`supabase/functions/share-match`) for crawler-friendly link previews.

### Ops + quality
- Unit tests with Vitest.
- E2E smoke test with Playwright.
- Analytics event hooks (env-gated).
- Sentry browser init (env-gated).

---

## Persistence Modes

| Mode | When | Data source |
|------|------|-------------|
| **Local demo** | `VITE_USE_SUPABASE` unset or not `true` | Browser `localStorage` |
| **Supabase backend** | `VITE_USE_SUPABASE=true` + URL + anon key | Supabase Postgres + Auth + RLS + RPC + Storage |

---

## Quick Start

```bash
cd football_hajez_app
npm install
npm run dev
```

Other useful commands:

```bash
npm run lint
npm run build
npm run preview
npm run test
npm run test:e2e:install
npm run test:e2e
```

---

## Detailed Supabase Setup (Step-by-step)

You already created a Supabase account, so follow this exact sequence once per environment (dev/staging/prod).

### 1) Create a Supabase project
1. Open [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project**.
3. Choose organization, project name, strong DB password, and region close to your users.
4. Wait for provisioning to complete.

### 2) Get project API values
1. Go to **Project Settings -> API**.
2. Copy:
   - **Project URL** -> `VITE_SUPABASE_URL`
   - **anon public key** -> `VITE_SUPABASE_ANON_KEY`
3. Do **not** put the service role key in frontend env files.

### 3) Configure local env
From project root:

```bash
cp .env.example .env
```

Set:

```env
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ANALYTICS_ENABLED=false
VITE_ANALYTICS_ENDPOINT=
VITE_SENTRY_DSN=
```

### 4) Apply DB migrations (in order)

Run all SQL files in `supabase/migrations` in timestamp order:

1. `20250508120000_malaab_schema_rls_rpc.sql`
2. `20250508140000_booking_reliability_session.sql`
3. `20260508180000_host_matches_list_perf.sql`
4. `20260509120000_payment_proof_host_approval.sql`
5. `20260510100000_match_waitlist_social.sql`

You can do this in two ways:

#### Option A: SQL Editor (Dashboard)
- Open **SQL Editor** and execute each migration file manually in order.

#### Option B: Supabase CLI (recommended)

```bash
# one-time install/login
brew install supabase/tap/supabase
supabase login

# inside project
supabase link --project-ref <your-project-ref>
supabase db push
```

### 5) Enable Auth providers
Go to **Authentication -> Providers** and enable:
- **Email OTP** and/or
- **Phone OTP** (requires SMS provider setup in Supabase).

Then in app:
- open `/welcome`
- use **Account (Supabase)** to sign in.

### 6) Storage setup (payment proofs)
Payment proof uploads use bucket: `payment-proofs`.

- Migrations create/configure this for you.
- If your project predates these migrations, verify bucket exists under **Storage**.
- Keep it **private** and rely on signed URLs (already used by app service layer).

### 7) Realtime setup (waitlist)
The waitlist migration adds `match_waitlist` to `supabase_realtime` publication.

Verify in SQL:

```sql
select * from pg_publication_tables where pubname = 'supabase_realtime';
```

You should see `public.match_waitlist` included.

### 8) Optional edge function for OG unfurls
If you want rich unfurls for bots (Slack/iMessage/etc.), deploy:
- `supabase/functions/share-match/index.ts`

```bash
supabase functions deploy share-match --no-verify-jwt
```

Set `PUBLIC_SITE_URL` in Supabase function secrets and follow:
- `docs/og-share-edge.md`

### 9) Sanity checks after setup
1. Run app with `.env` above.
2. Create a host match.
3. Book as player and upload proof.
4. Approve/reject from host dashboard.
5. Open a full role and join waitlist.
6. Share `/match/:id?team=...&role=...`.

---

## Features by Area

### Player flow
1. Browse venues and matches.
2. Open match, choose team/role, book.
3. Submit Whish proof.
4. Track status in **My Bookings**.
5. Cancel confirmed booking (policy-based messaging).

### Host flow
1. Create 90-minute sessions (half-hour starts only).
2. Avoid overlaps (UI + backend constraints).
3. Manage hosted sessions.
4. Approve/reject payment proofs.

### Social + growth
- Invite links preselect team/role.
- Waitlist CTA when role is full.
- Auto recruitment banner and share text.

---

## Testing & Monitoring

### Unit tests
- `src/utils/conflictCheck.test.ts`
- `src/utils/matchRecruitment.test.ts`
- `src/utils/hostScheduling.test.ts`
- `src/components/CountdownTimer.test.tsx`

Run:

```bash
npm run test
npm run test:coverage
```

### E2E
- `e2e/smoke.spec.ts`

Run:

```bash
npm run test:e2e:install
npm run test:e2e
```

### Analytics (optional)
- `src/analytics/track.ts`
- Events: `venue_view`, `booking_start`, `payment_success`, `booking_cancel`, `host_match_cancel`
- Active only when `VITE_ANALYTICS_ENABLED=true`.

### Sentry (optional)
- Initialized in `src/main.tsx` when `VITE_SENTRY_DSN` is set.

---

## Local Storage Keys

| Key | Purpose |
|-----|---------|
| `malaab_matches` | local demo matches |
| `malaab_bookings` | local demo bookings |
| `malaab_timers` | local payment timers |
| `malaab_app_role` | selected role (`player` / `pitch_host`) |
| `malaab_host_reservations` | host reservation log (local) |
| `malaab_waitlist` | local-mode waitlist |
| `malaab_waitlist_device` | local device id for waitlist queue |

---

## Project Structure (High level)

```text
src/
  components/
  context/
  pages/
  services/
  utils/
  analytics/
supabase/
  migrations/
  functions/share-match/
docs/
  og-share-edge.md
  ops-env.md
```

---

## Notes
- Time handling is Beirut-aware in UI and RPC wall-time paths.
- Seat contention is protected server-side (locking + constraints + retries).
- Keep service-role keys server-side only.

## License
Private / playground.
