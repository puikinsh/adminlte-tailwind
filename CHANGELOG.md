# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

## [0.1.0]

- Initial AdminLTE Tailwind implementation: Vite multi-page build, Tailwind CSS v4 styling layer,
  `@adminlte/headless` for component behavior, light/dark/auto theme, RTL, charts (ApexCharts) and
  maps (jsVectorMap), command-K search palette, and the core dashboard/UI/widgets/forms/tables pages.
