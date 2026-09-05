# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
