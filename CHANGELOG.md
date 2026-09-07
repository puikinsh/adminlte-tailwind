# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`CREDITS.md`**: provenance and licence terms for the bundled photographs, and a note that
  `simple-datatables` is LGPL-3.0 rather than MIT.
- **Cross-browser tests**: the suite runs on Chromium, Firefox and WebKit (555 tests).
- **`npm run build:demo` / `preview:demo`**: the adminlte.io demo deployment, which is served from
  a subpath, is now an explicit workflow rather than the default. `scripts/check-base.mjs` fails
  the demo build if any reference escapes the base path.

### Changed

- **`npm run build` now produces a plain root deployment.** `SITE_URL` previously defaulted to
  `https://adminlte.io/themes/tailwind/`, so anyone cloning the template got canonical tags and a
  sitemap pointing at a domain they do not own. It now has no default: canonical, `og:url` and
  `sitemap.xml` are simply not emitted until you name your own domain. `BASE_PATH` serves the site
  from a subdirectory.

### Fixed

- **Every button and link now has an accessible name.** 112 icon-only buttons had none — card
  controls, the contacts and gallery action rows, mailbox toolbar and stars, kanban menus, the
  social sign-in buttons — so a screen reader announced them all as just "button". The ⌘K palette
  was unnamed on every page and is now a labelled dialog with a labelled input.
- **Heading hierarchy**: only 6 of 35 pages had a valid outline; card titles were `<h3>` directly
  under the page `<h1>`, and some titles dropped to `<h5>`/`<h6>`. All 35 are now clean. No CSS
  targets heading tags, so this is purely semantic.
- **Horizontal overflow on phones**: the data table had no scroll container of its own (127px of
  page overflow) and the contacts action row could not wrap (21px). Separately, the navbar brand
  reserved the full 250px sidebar width below 992px — where the sidebar is an off-canvas overlay —
  pushing the navbar icons 15px off the right edge of a 375px screen on _every_ page. Because the
  navbar is fixed, that never showed up as document overflow.
- `import.meta.dirname` replaces `__dirname` in the Vite config, clearing a deprecation warning on
  every dev and preview start.

### Added

- **End-to-end test suite** (`npm test`): 115 Playwright tests against the production build.
  Pages are discovered with the same rule the Vite build uses, so new pages are covered
  automatically. Every page must load with no console error, no failed request and no
  third-party request; the charts, map, calendar, kanban and datatable must render; and the
  sidebar, treeview, theme cycle, RTL toggle, ⌘K palette and skip link must work. CI gains an
  `e2e` job.
- **Local images.** All avatars are generated SVGs (`scripts/generate-avatars.mjs`,
  `npm run gen:avatars`) and all photographs are bundled AVIF with a mozjpeg fallback behind
  `<picture>`. The template now makes zero third-party requests.
- **`partials/`**: the navbar, sidebar and footer exist once each and are pulled into pages with
  `<!-- @include name -->`, expanded at build time.
- **SEO**: per-page canonical URLs and `og:url`, absolute social-image URLs, `sitemap.xml`,
  `robots.txt` and a web manifest — all generated from one `SITE_URL` constant.

### Changed

- **`src/lib/headless-stub.ts` is now `src/lib/components.ts`.** Dropdown, Modal and Toast were
  written as a temporary stand-in pending `@adminlte/headless`, which has published nothing since
  0.1.0 in December 2025. They are treated as owned code rather than a stub in waiting.
- `package.json` is marked `private` — this is a template to clone, not a package to install, and
  it has no library entry point. The `repository` and `bugs` URLs pointed at a repository that
  does not exist; they now point at the real one.
- README rewritten: it advertised an `npm install` for an unpublished package, described dark
  mode as "coming soon" when it has shipped, and documented a two-file project structure.

### Fixed

- **Every form control now has an accessible name.** 91 of 123 had none — no `<label for>`, no
  wrapping label, no `aria-label` — so screen readers announced them as bare "edit text". Visible
  labels are now associated with their controls, placeholder-only fields take their name from the
  placeholder, and the rest got names written from their surroundings.
- 33 `<img>` tags had no `alt` attribute. All were avatars followed by the person's name in the
  markup, so they take `alt=""` rather than announcing the name twice.
- Credential fields gained `autocomplete` attributes and the invalid-state demo's password inputs
  were moved inside a form, clearing every console warning on `forms/elements.html`.
- Photographs carry intrinsic `width`/`height` to prevent layout shift.

### Removed

- **`scripts/check-chrome.mjs`** and its CI step. It detected chrome drift across the 30 duplicated
  layouts; with a single copy in `partials/`, drift is impossible rather than merely detectable.
  The one failure it could not catch — a page missing its chrome entirely — is now an e2e
  assertion.

### Changed

- **ApexCharts 5 → 7** (major upgrade across two majors). The v7 headline change is that nine
  features (trellis, storyboard, perspectives, ink, canvas renderer, linked views, measure,
  rewind, context menu) became opt-in imports — this template uses none of them, and neither
  of the other two v7 breaking changes applies (`plotOptions.bar.borderRadiusWhenStacked` is
  unused, and `dataLabels` are disabled on every chart, so the new animate-by-default has no
  effect). v6's two default behavior changes (coherent variable-length data transitions and
  mobile pinch/pan gestures) are additive for these static demo charts.
- **Charts bundle is 31% smaller** (264.5 kB → 180.9 kB gzip; 925 kB → 641 kB raw). ApexCharts 7
  ships per-chart-type entry points, so `src/charts.ts` now imports `apexcharts/core` plus only
  the `area`, `bar` and `donut` types and the `legend` feature instead of the full default
  bundle. The chunk is lazy-loaded, so this is a saving on the three dashboard pages.

### Dependencies

- Updated every runtime and dev dependency to its latest stable release: apexcharts 5.15.0 → 7.1.0,
  Vite 8.0.16 → 8.2.2, ESLint 10.5.0 → 10.10.0, typescript-eslint 8.61.1 → 8.69.0, Prettier
  3.8.4 → 3.9.6, prettier-plugin-tailwindcss 0.8.0 → 0.8.1, Tailwind CSS and `@tailwindcss/vite`
  4.3.1 → 4.3.3, simple-datatables 10.2.0 → 10.3.0, lightningcss 1.32.0 → 1.33.0, globals
  17.6.0 → 17.12.0.
- **TypeScript stays on 6.0.3** (latest 6.x) rather than 7.0.2. TypeScript 7 is the native port
  and ships without the JavaScript compiler API that typescript-eslint reads type information
  through; typescript-eslint 8.69.0 still declares `typescript: >=4.8.4 <6.1.0`, so installing
  TS 7 alongside it fails to resolve. Revisit once TypeScript 7.1 ships its stable API.
- Reformatted two files for Prettier 3.9's HTML/`for`-loop output changes.

### Security

- `npm audit` reports 0 vulnerabilities (three high-severity advisories in transitive
  dependencies — `brace-expansion`, `nanoid`, `postcss` — cleared by the refresh).

## [0.2.0] - 2026-07-01

### Added

- **Interactive calendar** (`/pages/calendar.html`): month grid + agenda list, add/edit/delete
  events via modal, drag-to-create from the side panel, category filters and an upcoming list.
- **Kanban drag-and-drop** (`/pages/kanban.html`): reorder cards, move between columns, live
  column counts and a working "Add Task".
- **Recent Activity** card beside Direct Chat on the dashboard.
- **Demo pages**: invoice, pricing, projects, settings, chat, file manager, FAQ, maintenance,
  mailbox compose/read, and a UI icons reference — all wired into the sidebar and ⌘K search.
- **Favicon**, meta descriptions, `theme-color`, and Open Graph / Twitter card tags (with a
  generated social preview image) across all pages.
- **Developer tooling**: TypeScript type-checking (`tsconfig.json` + `npm run typecheck`),
  ESLint + Prettier (`npm run lint` / `format`), and a GitHub Actions CI pipeline.
- **Chrome drift check** (`npm run check:chrome`, runs in CI): with no templating system the
  navbar/sidebar/footer are duplicated on every page — the check fails if any page's chrome
  differs from `index.html`.

### Changed

- **Comprehensive dark mode**: extended coverage to info boxes, tables, alerts, badges, callouts,
  pagination, nav tabs/pills, timeline, progress tracks, breadcrumbs, soft color tints and more,
  so `@apply`-based component classes render correctly in dark mode.
- Refined the navbar brand bottom border and slightly reduced the hamburger icon size.
- Replaced the Twitter logo with the X logo in the Traffic Sources widget.
- **Faster first paint on every page**: the always-on theme, accessibility and search modules
  are now statically imported instead of lazy-loaded, removing a request waterfall (three extra
  round trips after `main.js`). Debug `console.log` calls no longer ship in production.
- **Dropped OverlayScrollbars** (~42KB JS+CSS per page): the thin auto-hiding sidebar scrollbar
  is now pure CSS (`scrollbar-width` + `scrollbar-color` with hover/focus reveal).
- **⌘K search index is generated at build time** from the same HTML discovery as the build
  (a `virtual:pages` Vite module parsing each page's `<title>`), so new pages can no longer be
  missing from search.
- Compressed the social preview image (`og-image.png`) from 197KB to 23KB.

### Fixed

- Numerous dark-mode contrast issues where light surfaces/text leaked through (white info-box
  cards, unreadable highlighted rows, bright table headers, low-contrast breadcrumbs, etc.).
- Accessible names for icon-only navbar toggles (sidebar, fullscreen, user menu).
- Restored the full navbar (search trigger, theme toggle, notifications, fullscreen,
  Home/Contact links) on six pages that had drifted: Inbox, Calendar, Contacts, Gallery,
  Kanban and Profile.

### Dependencies

- Updated all runtime and dev dependencies to their latest stable releases. Notable bumps:
  apexcharts 5.13.0 → 5.15.0, Vite 8.0.14 → 8.0.16, ESLint 10.4.1 → 10.5.0, Tailwind CSS and
  `@tailwindcss/vite` 4.3.0 → 4.3.1, typescript-eslint 8.60.0 → 8.61.1, and Prettier 3.8.3 → 3.8.4.
  No breaking changes were required — every package was already on its current major (Vite 8,
  ESLint 10, TypeScript 6, Tailwind 4). Lint, type-check, format, chrome-drift and build all pass.

### Security

- Cleared a high-severity advisory in a transitive dependency as part of the dependency refresh
  (`npm audit` now reports 0 vulnerabilities).

## [0.1.0]

- Initial AdminLTE Tailwind implementation: Vite multi-page build, Tailwind CSS v4 styling layer,
  `@adminlte/headless` for component behavior, light/dark/auto theme, RTL, charts (ApexCharts) and
  maps (jsVectorMap), command-K search palette, and the core dashboard/UI/widgets/forms/tables pages.
