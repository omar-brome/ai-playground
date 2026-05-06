# Lumière — demo candle shop (PayPal + DHL sandbox)

Luxury-themed **React + Vite + TypeScript** storefront with Tailwind CSS, PayPal Sandbox checkout, and DHL Tracking API (EU endpoint) wired for local development behind a **Vite proxy** to avoid browser CORS.

## Setup

```bash
cd ai-playground/paypal_dhl
cp .env.example .env
# Fill VITE_PAYPAL_CLIENT_ID and VITE_DHL_API_KEY with sandbox credentials.
npm install
npm run dev
```

## Demo mode

- Navbar shows **Demo Mode**. No real charges; PayPal sandbox only.
- If the **PayPal SDK fails to load** (region block, network, bad client ID), a dialog offers **Yes** to **simulate** a successful payment; the app then continues to order confirmation and DHL tracking like a real checkout. **No** dismisses the dialog and keeps the error. If `VITE_PAYPAL_CLIENT_ID` is unset, use **Simulate successful checkout (demo)** instead of the PayPal button.
- After payment, orders are saved under `lumiere_orders_v1` in `localStorage` with mock tracking **`JD014600006251903756`**.
- DHL responses may be empty or error in sandbox: the tracking page falls back to a scripted timeline automatically.

## DHL + CORS

Browser calls to `https://api-eu.dhl.com` are blocked by CORS for static sites. **`npm run dev`** proxies `/api/dhl` → `https://api-eu.dhl.com` (see `vite.config.ts`). A static production deployment would need your own lightweight proxy unless you rely on the built-in mock timeline only.

## Stack

React 19, Vite 8, Tailwind CSS 4, React Router v6, Axios.
