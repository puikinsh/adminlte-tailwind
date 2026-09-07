# AdminLTE Tailwind

> An AdminLTE admin dashboard template, rebuilt on Tailwind CSS v4

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

35 ready-made pages, a light/dark/auto theme, RTL support, and no runtime
dependency on jQuery or Bootstrap. Component behaviour comes from
[@adminlte/headless](https://github.com/puikinsh/adminlte-headless); this
project is the styling layer plus the page-specific features.

## Getting started

This is a template to clone and build on, not a package to install.

```bash
git clone https://github.com/puikinsh/adminlte-tailwind.git
cd adminlte-tailwind
npm install
npm run dev
```

Node 22 or newer is required.

## Scripts

| Command               | What it does                                               |
| --------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Vite dev server with HMR                                   |
| `npm run build`       | Production build of every page                             |
| `npm run preview`     | Serve the production build                                 |
| `npm test`            | Playwright end-to-end suite (builds, then drives Chromium) |
| `npm run lint`        | ESLint                                                     |
| `npm run format`      | Prettier (also sorts Tailwind classes)                     |
| `npm run typecheck`   | TypeScript, browser and Node projects                      |
| `npm run gen:avatars` | Regenerate the local avatar SVGs                           |

First run of the test suite needs the browser: `npx playwright install chromium`.

## What's included

**Dashboards** — three variants (`index.html`, `index2.html`, `index3.html`)
with ApexCharts area, bar and donut charts and a jsVectorMap world map.

**Applications** — calendar with drag-to-create events, drag-and-drop kanban
board, mailbox (inbox / compose / read), chat, file manager, contacts, gallery,
projects, invoice, pricing, profile, settings, FAQ.

**UI** — buttons, icons, modals, timeline, general elements, three widget
pages, form elements with validation and a wizard, and sortable/searchable
data tables.

**Standalone** — login, register, lock screen, 404, 500, maintenance.

Everything is served from the template itself: there are no third-party image,
font or script requests on any page, and the test suite enforces that.

## How it works

**Multi-page Vite build.** Every `.html` file outside the ignored directories is
discovered automatically and registered as a build input — adding a page needs
no config change, and it appears in the ⌘K palette and `sitemap.xml` on its own.

**Shared chrome lives in `partials/`.** The navbar, sidebar and footer exist
once each; pages reference them with `<!-- @include navbar -->`, expanded at
build time. Edit the partial, not the pages.

**Dark mode** is class-based (`.dark` on `<html>`) with a light/dark/auto cycle
persisted to `localStorage`. An inline script applies the stored mode — and RTL
direction — before first paint, so there is no flash.

**Styling** is a single Tailwind v4 stylesheet (`src/styles.css`) configured in
CSS via `@theme`; there is no `tailwind.config.js`.

**Avatars** are generated SVGs. `scripts/generate-avatars.mjs` derives the set
from the pages that reference them, so one file per person-and-colour scales to
every size the pages need.

## Customising

Colours and theme variables are defined in `src/styles.css`:

```css
@import 'tailwindcss';

@theme {
  --color-sidebar-dark: #1a1d21;
  --color-primary-500: #3b82f6;
  /* ... */
}
```

Reusable component classes (`.btn-*`, `.card`, `.badge-*`, …) live in the same
file under `@layer components`.

## Deploying

`npm run build` produces a site that works when dropped at the root of any
host, with no URLs baked in that belong to anyone else.

Two environment variables adjust that:

| Variable    | Default | Effect                                                                          |
| ----------- | ------- | ------------------------------------------------------------------------------- |
| `SITE_URL`  | unset   | Turns on canonical tags, `og:url`, absolute social-image URLs and `sitemap.xml` |
| `BASE_PATH` | `/`     | Serves the site from a subdirectory                                             |

`SITE_URL` has no default on purpose — a canonical tag pointing at a domain you
do not own is worse than none at all, so those tags are simply omitted until you
say what your domain is:

```bash
SITE_URL=https://example.com/ npm run build
```

To serve from a subdirectory, set both:

```bash
SITE_URL=https://example.com/admin/ BASE_PATH=/admin/ npm run build
```

`node scripts/check-base.mjs` (with the same `BASE_PATH`) verifies no link
escapes the subdirectory.

## Project structure

```
adminlte-tailwind/
├── index.html, index2.html, index3.html   # dashboards
├── pages/ UI/ forms/ tables/ widgets/     # the rest of the pages
├── mailbox/ examples/
├── partials/          # navbar, sidebar, footer — the single copy of each
├── public/assets/img/ # avatars (generated SVG) and photos (AVIF + JPG)
├── scripts/           # avatar generator
├── src/
│   ├── main.ts        # entry point
│   ├── styles.css     # the whole stylesheet
│   ├── lib/components.ts   # Dropdown, Modal, Toast
│   └── theme.ts search.ts a11y.ts calendar.ts kanban.ts charts.ts …
├── tests/             # Playwright end-to-end suite
└── vite.config.js     # multi-page build, includes, SEO, sitemap, no-flash
```

## Related

- [@adminlte/headless](https://github.com/puikinsh/adminlte-headless) — the framework-agnostic component logic
- [AdminLTE](https://github.com/ColorlibHQ/AdminLTE) — the original Bootstrap template

## License

MIT — see [LICENSE](LICENSE).

The bundled photographs come from Unsplash under the Unsplash License, and
`simple-datatables` is LGPL-3.0. [CREDITS.md](CREDITS.md) has the details.
