# Snack Nasab Web App

Mobile-first bilingual (Arabic/English) restaurant web application with:
- Public menu browsing (`/ar`, `/en`)
- RTL/LTR language switching
- Admin dashboard for category/item CRUD
- NextAuth credentials login
- Prisma + PostgreSQL backend

## Tech Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Framer Motion
- Prisma ORM + PostgreSQL
- next-intl for i18n
- NextAuth credentials for admin authentication

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Create env file:
```bash
cp .env.example .env
```

3. Set your PostgreSQL connection in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/snack_nasab?schema=public"
NEXTAUTH_SECRET="change-me-to-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run migrations:
```bash
npm run prisma:migrate -- --name init
```

6. Seed initial menu + admin account:
```bash
npm run prisma:seed
```

7. Start development server:
```bash
npm run dev
```

Open `http://localhost:3000` (redirects to `/ar`).

## Default Admin Credentials
- Email: `admin@snacknasab.com`
- Password: `admin12345`

Change these immediately in production.

## Main Routes
- Public Arabic menu: `/ar`
- Public English menu: `/en`
- Admin login: `/admin/login`
- Admin dashboard: `/admin`

## Notes
- Menu seed data is initialized from the provided menu image and can be edited from the admin dashboard.
- Image upload in admin is stored locally under `public/uploads` (dev-friendly). For production, replace with cloud storage adapter (S3/Cloudinary).
- Frontend fallback mode: if `DATABASE_URL` is not set (or DB is unreachable), public pages (`/ar`, `/en`) load menu/settings from `src/data/menu-fallback.json`.
- You can control data source explicitly with `MENU_SOURCE`:
  - `MENU_SOURCE=auto` (default): use DB when available, else JSON fallback
  - `MENU_SOURCE=json`: force JSON fallback even if DB is configured
  - `MENU_SOURCE=db`: force DB only
