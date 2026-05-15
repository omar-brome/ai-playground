# PeoplePulse (web_app1)

Static employee directory with company filters, search, sort, and optional nav sections.

## Run locally

`employees.json` is loaded with `fetch()`, which **blocked or unreliable with `file://`**. Use any static HTTP server from this folder, for example:

```bash
cd web_app1
npx --yes serve .
```

Then open the URL shown (often `http://localhost:3000`).

## Stack

- [Bootstrap 5.3.3](https://getbootstrap.com/) CSS from jsDelivr (with **Subresource Integrity**)
- Plain JavaScript (no jQuery)
- Data: [employees.json](employees.json) — array of `{ name, address, company, phone, image }`

## Features

- **Company filters** with stable checkbox `id`s (slugified); selection persisted in **`localStorage`**
- **Search** across name, phone, company, address
- **Sort** by name or company (A–Z / Z–A)
- **Nav tabs**: Home (dashboard) vs placeholder panels (Settings, Help, …)
- **Skip link**, landmark labels, **`aria-live`** on result count, lazy-loaded avatars with SVG fallback on image error
- **Reduced motion**: card hover lift and staggered reveal animations are toned down via CSS and JS

## Avatars

Images use `i.pravatar.cc` placeholders; they require network access.
