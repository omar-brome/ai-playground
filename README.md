# 🧪 AI Playground

A collection of AI-powered app experiments built with various tools and frameworks.

## 📁 Projects

### [`orion`](./orion)
**Orion** — Desktop AI chat app that talks **only to your machine**: inference runs through **[Ollama](https://ollama.com)** locally. No cloud APIs, no keys.

- **Stack:** Python 3.11+, Tkinter (default UI on macOS), optional CustomTkinter on Linux/Windows or with `ORION_UI=ctk`
- **Features:** Streaming replies, multiple chats, model picker, system prompt + temperature, persistent history under `~/.orion/`, delete chats, settings JSON
- **macOS note:** Use **[Python from python.org](https://www.python.org/downloads/)** (not only Xcode Command Line Tools Python) for a reliable Tcl/Tk GUI; the Orion README explains PATH, venv, and troubleshooting white/blank windows

**Quick start:**

```bash
cd orion
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
python -m pip install -r requirements.txt
python main.py
```

**Documentation:** [`orion/README.md`](./orion/README.md)

---

### [`pitch`](./pitch)
**Pitch** — **AI-powered** desktop **football (soccer) video analysis**: deep-learning **YOLOv8** detects players and the ball on match video or **webcam**; overlays include boxes, trails, **heatmap**, rough **team colors** (ML clustering), a simplified **offside** hint, **possession** + stats, and **JSON export**. Inference runs locally via **PyTorch** (**MPS** on Apple Silicon when available).

- **AI / ML:** Convolutional object detection (YOLOv8) + unsupervised jersey grouping (K-means); all on-device, no cloud APIs.
- **Stack:** Python 3.11+ (3.14 OK), CustomTkinter + Tk root (macOS-friendly), OpenCV, Ultralytics YOLOv8, PyTorch, NumPy, Pillow, scikit-learn
- **UX:** The UI opens right away; **weights load on first “Open Video” / Webcam** (first run may download `yolov8*.pt` — terminal shows progress).
- **CLI:** `python main.py --model yolov8n.pt` · `python main.py --source /path/to/match.mp4`
- **macOS:** Prefer **[Python from python.org](https://www.python.org/downloads/)** for a solid Tcl/Tk + GUI stack (same idea as Orion).

**Quick start:**

```bash
cd pitch
python3 -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Documentation:** [`pitch/README.md`](./pitch/README.md)

---

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

- 💬 **Orion** (`./orion`) — Local Ollama desktop chat (Python, Tkinter / CustomTkinter)
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

### Orion (local Ollama desktop chat)

See **[`orion/README.md`](./orion/README.md)** — includes prerequisites (Ollama + models), venv setup, `ORION_UI`, and macOS Tk notes.

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
