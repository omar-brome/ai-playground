# Malaab (ملاعب)

Mobile-first **5v5 mini-football** match booking web app for players in Lebanon, with a **Pitch Host** mode to schedule field sessions. No backend — everything persists in the browser via `localStorage`.

## Tech stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **React Router v6**
- **Inter** font (Google Fonts)

## Quick start

```bash
cd football_hajez_app
npm install
npm run dev
```

```bash
npm run build    # production build
npm run preview  # preview production build
npm run lint     # ESLint
```

## Roles

On first visit (or via **Switch Role** in the bottom nav), users choose:

| Role | Description |
|------|-------------|
| **Player** | Books a team + role (GK / Midfielder / Attacker) on upcoming matches, pays via demo Whish flow. |
| **Pitch Host** | Books a **90-minute** field slot at a venue; only **:00** and **:30** start minutes; creates a real **match** players can join. Host home hero image differs from Player. |

Role is stored as `malaab_app_role`: `player` | `pitch_host`.

## Player flow

1. **Home** — venue cards with images, location (Saida), upcoming match counts; role strip at top (`App.tsx`).
2. **Venue** — hero image, embedded map (Google Maps embed + “Open in Google Maps” link), venue info.
3. **Match** — 5v5 field: **Team 1 (blue)** vs **Team 2 (red)**; tap formation circles to pick role; role quotas (1 GK, 2 MID, 2 ATT per team); share link; conflict check by phone (±2h overlap, no double book same match).
4. **Booking** — bottom sheet for name + phone; **Payment** — Whish instructions, 15-minute countdown, demo “Mark as Paid”.
5. **My Bookings** — list, statuses, cancel confirmed (no-refund warning), empty state CTA.

## Pitch Host flow

- **Home** (host only): pick venue, **date** + **time** (half-hour steps enforced), book **1h30**; overlap blocked vs existing matches **and** legacy host reservation list.
- New session **appends a match** to `malaab_matches` — venue match count and venue page update immediately.

## Design

- Dark athletic UI: navy `#0a0e1a`, accent green `#00d96d`, Whish pink `#e91e8c` for payment block.
- Bottom navigation: Home | My Bookings | Switch Role.
- Static assets: `public/images/` (`home-hero.png`, `home-host-hero.png`, `switch-role-hero.png`), `public/venues/*.png`.

## localStorage keys

| Key | Purpose |
|-----|---------|
| `malaab_matches` | Match list (spots, teams, bookings on spots) |
| `malaab_bookings` | Player booking records |
| `malaab_timers` | Payment expiry timestamps by booking id |
| `malaab_app_role` | `player` \| `pitch_host` |
| `malaab_host_reservations` | Legacy host slot log (overlap still checked; new matches drive player UX) |

Seed data shape is validated in code; old shapes may re-seed mock matches.

## Project structure (high level)

```
src/
  App.tsx                 # Routes, role gate, top role bar
  components/             # BottomNav, VenueCard, MatchCard, SoccerField, BookingForm, ...
  context/                # RoleContext, BookingContext
  pages/                  # Welcome, Home, VenuePage, MatchPage, PaymentPage, MyBookings, ...
  data/mockData.ts       # Venues (Saida, maps URLs), initial matches
  types/domain.ts
  utils/                  # localStorage, format, conflictCheck, roleQuotas
public/
  images/                 # Hero / switch-role images
  venues/                 # Venue card images
```

## Payment (demo)

Whish Money is **manual** (no public API): instructions + reference = booking id + **Mark as Paid (Demo)** confirms booking. Mirrors common Lebanon app patterns until a real PSP is integrated.

## Replacing with a real backend

Keep UI calling **context methods** (`BookingProvider`); swap reads/writes from `utils/localStorage.ts` to HTTP calls and keep the same domain types where possible.

## License

Private / playground — use as you like within your repo policy.
