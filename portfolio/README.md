# Omar Brome Portfolio

A modern single-page portfolio and CV website for Omar Brome, built as a polished frontend project inside `ai-playground`.

The site presents Omar's professional software engineering profile, selected side projects, competitive programming background, and contact links in a dark, premium, developer-focused UI inspired by Linear and Vercel aesthetics.

## Highlights

- Full-screen animated hero with typewriter role titles
- Fixed blurred navbar with smooth-scroll links and active section highlighting
- Responsive mobile hamburger navigation
- About section with animated counters
- Grouped technical skills with hover-glow pills
- Vertical work experience timeline
- Glassmorphism project cards
- Linked LCPC/ICPC competitive programming achievement cards
- Contact cards for email, GitHub, LinkedIn, and phone
- Downloadable CV PDF
- Custom `OB` SVG favicon
- Subtle gradient, particle, and noise-style background effects

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 4 via `@tailwindcss/vite`
- Framer Motion
- React Icons
- Plain static assets, no backend

## Project Structure

```text
portfolio/
  public/
    favicon.svg
    Omar_Brome_CV.pdf
  src/
    components/
      Navbar.jsx
      Hero.jsx
      About.jsx
      Skills.jsx
      Experience.jsx
      Projects.jsx
      CompetitiveProgramming.jsx
      Contact.jsx
      Footer.jsx
    hooks/
      useScrollSpy.js
      useCounterAnimation.js
    App.jsx
    index.css
    main.jsx
  index.html
  package.json
  tailwind.config.js
  vite.config.js
```

## Site Sections

### Hero

Introduces Omar with a large animated greeting and a typewriter effect cycling through:

- `C++ Software Developer`
- `Qt & Linux Specialist`
- `Full-Stack Builder`
- `AI Tools Enthusiast`

Includes CTAs for viewing projects and downloading the CV, plus GitHub, LinkedIn, and email links.

### About

Summarizes Omar as a Saida-based Lebanese software developer with 9+ years of experience across C++/Qt desktop engineering, Linux build environments, full-stack web apps, and AI-assisted development.

Animated stats:

- `9+` years experience
- `4` companies
- `16+` side projects
- `2x` ACPC qualifier

### Skills

Skills are grouped into cards:

- Systems & Desktop
- Web & Frontend
- Backend & DB
- AI & Dev Tools
- Languages
- Workflow

### Work Experience

Timeline entries:

- SiliconCedars / Synopsys - C++ Software Developer
- Neumann - Software Developer
- Vanrise Solutions - Web Developer Intern
- IDS - Software Developer Intern

### Projects

Featured cards:

- AI Recruiting Assistant
- SyncRoom / Wavechat
- Portfolio Website

The project links point to the relevant `ai-playground` GitHub paths where available.

### Competitive Programming

Includes two linked achievement cards:

- LCPC 2015 -> ACPC 2015
- LCPC 2016 -> ACPC 2016

Each card links to the corresponding ICPC standings page.

### Contact

Contact methods:

- Email: `omar.brome@gmail.com`
- GitHub: `github.com/omar-brome`
- LinkedIn: `linkedin.com/in/omar-brome`
- Phone: `+961 81017575`

## Getting Started

```bash
cd /Users/omarbrome/Documents/Codes/ai-playground/portfolio
npm install
npm run dev
```

The dev server runs on:

```text
http://localhost:5173
```

If port `5173` is already in use, Vite may ask to use another port or you can run:

```bash
npm run dev -- --port 5174
```

## Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Assets

- `public/Omar_Brome_CV.pdf` powers the `Download CV` button.
- `public/favicon.svg` is the browser tab icon.

If the favicon does not update immediately in the browser, hard refresh or clear the favicon cache.

## Content Sources

The portfolio content is based on:

- Omar Brome's enhanced CV
- `ai-playground` project documentation
- GitHub portfolio repository: `https://github.com/omar-brome/ai-playground`
- LinkedIn profile: `https://www.linkedin.com/in/omar-brome`

## Notes

This is a static frontend app. It can be deployed to Vercel, Netlify, GitHub Pages, or any static host after running `npm run build`.
