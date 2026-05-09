# 🧪 AI Playground

A collection of AI-powered app experiments built with various tools and frameworks.

## 📁 Projects

### [`vscode_copilot_app_job_recruiter`](./vscode_copilot_app_job_recruiter)
A job recruiter web application built with GitHub Copilot assistance.

- **`client/`** — React + Vite frontend with Tailwind CSS
- **`server/`** — Node.js backend with REST API routes (auth, chat, LinkedIn, profiles)
- **`job_recruiter/`** — Project documentation, setup guides, and reference material

**Stack:** React, Vite, Tailwind CSS, Node.js, Express

---

### [`flappy_cat`](./flappy_cat)
A browser-based **Flappy Bird**–style game built with **Phaser 3** and **Vite**. Guide a cat through scrolling obstacles (laundry lines, furniture, dogs, yarn, lasers), collect fish and power-ups, and chase a high score—with Normal, Zen, and Daily modes, local persistence, and procedural audio.

**Stack:** Phaser 3, Vite, JavaScript (ES modules)

**Quick start:**
```bash
cd flappy_cat
npm install
npm run dev
```

---

### [`snack_nasab`](./snack_nasab)
**Snack Nasab** — a mobile-first, bilingual (**Arabic / English**) fast-food menu web app with public browsing (`/ar`, `/en`), RTL/LTR switching, and an **admin dashboard** for categories and items (CRUD). Uses NextAuth for admin login and Prisma + PostgreSQL for data.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, Prisma, PostgreSQL, next-intl, NextAuth

**Quick start:** See [`snack_nasab/README.md`](./snack_nasab/README.md) for `.env`, migrations, seed, and default admin credentials.

---

### [`paypal_dhl`](./paypal_dhl)
**Lumière** — a luxury-themed **React + Vite + TypeScript** candle-shop demo with **PayPal Sandbox** checkout and **DHL Tracking API** (EU) behind a Vite dev proxy for CORS. Includes demo-mode payment simulation when the SDK is unavailable or misconfigured.

**Stack:** React, Vite, TypeScript, Tailwind CSS, React Router, Axios

**Quick start:**
```bash
cd paypal_dhl
cp .env.example .env
# Set VITE_PAYPAL_CLIENT_ID and VITE_DHL_API_KEY for sandbox.
npm install
npm run dev
```

---

### [`football_hajez_app`](./football_hajez_app)
**Malaab (ملاعب)** — mobile-first **5v5 mini-football** booking app for Lebanon.

- **Player**: pick team + role, deep-link invites (`/match/:id?team=&role=`), role waitlist when full, Whish payment proof flow, host approval lifecycle.
- **Pitch Host**: schedule 90-minute sessions (`:00` / `:30`), manage hosted matches, verify/reject payment proofs.
- **Preview sharing**: OG/Twitter tags in-app, optional Supabase Edge function for bot unfurls.
- **Ops**: unit tests (Vitest), E2E smoke (Playwright), optional analytics events, optional Sentry monitoring.

Supports dual persistence:
- local demo mode (`localStorage`)
- Supabase backend mode (Postgres + Auth + RLS + RPC + Storage)

**Stack:** React, Vite, TypeScript, Tailwind CSS v4, React Router v6, Supabase

**Quick start:**
```bash
cd football_hajez_app
npm install
npm run dev
```

**Quality commands:**
```bash
npm run test
npm run test:e2e:install
npm run test:e2e
npm run lint
npm run build
```

Full setup and architecture docs:
- [`football_hajez_app/README.md`](./football_hajez_app/README.md)
- [`football_hajez_app/docs/ops-env.md`](./football_hajez_app/docs/ops-env.md)

---

### [`prayer_ios_app`](./prayer_ios_app)
**أوقات الصلاة (Awqat Al-Salah)** — native **SwiftUI** iOS app for Lebanese prayer times: [AlAdhan](https://aladhan.com/prayer-times-api) (no API key), Qibla, monthly calendar, local notifications, adhan assets, offline cache. Open `PrayerTimesApp.xcodeproj` and run on iOS 17+.

**Stack:** Swift 5.9+, SwiftUI, URLSession, UserNotifications, CoreLocation, AVFoundation

**Docs:** [`prayer_ios_app/README.md`](./prayer_ios_app/README.md) · [`prayer_ios_app/XCODEPROJ_SETUP.md`](./prayer_ios_app/XCODEPROJ_SETUP.md)

---

### `cursor_work` Projects
A collection of various apps and games built with Cursor AI assistance. These live at the repository root in separate folders, including:

- 🐱 **Flappy Cat** (`./flappy_cat`) — Phaser 3 arcade game
- 🍔 **Snack Nasab** (`./snack_nasab`) — bilingual fast-food menu + admin
- 💳 **Lumière / PayPal + DHL** (`./paypal_dhl`) — storefront + sandbox checkout + tracking
- ⚽ **Malaab / football_hajez_app** (`./football_hajez_app`) — 5v5 match booking + pitch host scheduler (localStorage)
- 🕌 **Awqat Al-Salah / prayer_ios_app** (`./prayer_ios_app`) — Lebanese prayer times (SwiftUI, AlAdhan API)
- 📘 Facebook-style social media app (`./facebook`)
- ♟️ Chess game (`./chess`)
- ❌ Tic Tac Toe game (`./games`)
- 🎱 Pool game (`./pool`)
- _...and more (`./calculator`, `./web_app1`, etc.)_

---

## 🚀 Getting Started

### Job Recruiter App

**Frontend:**
```bash
cd vscode_copilot_app_job_recruiter/client
npm install
cp .env.example .env
npm run dev
```

**Backend:**
```bash
cd vscode_copilot_app_job_recruiter/server
npm install
cp .env.example .env
node index.js
```

### Flappy Cat, Snack Nasab, PayPal + DHL, Malaab, Prayer iOS

Use the **Quick start** blocks under each project above, or open that folder’s `README.md` for full setup (especially Snack Nasab’s database and auth). For the iOS prayer app, use Xcode with `prayer_ios_app/PrayerTimesApp.xcodeproj` — see [`prayer_ios_app/README.md`](./prayer_ios_app/README.md).

---

## 🛠️ Built With
- [React](https://react.dev/)
- [Next.js](https://nextjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Phaser](https://phaser.io/)
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Prisma](https://www.prisma.io/)
- GitHub Copilot & Cursor AI
- Swift / SwiftUI (iOS)
