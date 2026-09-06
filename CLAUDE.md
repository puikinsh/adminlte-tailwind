# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AdminLTE Tailwind is a Tailwind CSS v4 implementation of the AdminLTE admin dashboard template — a multi-page static site built with Vite. Component behaviors come from the published [@adminlte/headless](https://github.com/puikinsh/adminlte-headless) package; this project provides the CSS styling layer plus page-specific feature modules.

## Commands

```bash
npm run dev           # Vite dev server with HMR
npm run build         # Production build (all HTML pages)
npm run preview       # Preview production build
npm run typecheck     # tsc --noEmit (browser project + tsconfig.node.json for tests)
npm run lint          # ESLint (flat config)
npm run format        # Prettier (writes)
npm run format:check  # Prettier (check only, used in CI)
npm test              # Playwright end-to-end suite (builds, previews, drives Chromium)
npm run test:ui       # Playwright UI mode
npm run gen:avatars   # Regenerate public/assets/img/avatars/*.svg from page references
npm run check:avatars # Fails if a page references an avatar that has not been generated
```

Node >= 22 required (`.nvmrc` says 22). CI (`.github/workflows/ci.yml`) runs lint, format:check, typecheck, check:avatars and build on Node 22/24/26, plus a separate `e2e` job running `npm test` on Node 22.

## Architecture

### Multi-page Vite build

`vite.config.js` recursively discovers every `.html` file (excluding `node_modules`, `dist`, `src`, `public`, etc.) and registers it as a Rollup input. Pages live at the root (`index.html`, `index2.html`, `index3.html`) and under `pages/`, `UI/`, `examples/`, `forms/`, `tables/`, `widgets/`, `mailbox/`. Adding a new `.html` file anywhere outside the ignored dirs automatically includes it in the build — no config change needed.

**Shared chrome lives in `partials/`.** The navbar, sidebar and footer exist once each in `partials/navbar.html`, `partials/sidebar.html` and `partials/footer.html`. The 30 full-layout pages reference them with `<!-- @include navbar -->`, which the `htmlIncludes` plugin in `vite.config.js` expands at build time (and in dev, where editing a partial triggers a full reload). A sidebar link is now a one-file edit.

`partials/` is excluded from page discovery, so its files never become pages. The 5 standalone pages — the three auth screens and the two error pages — deliberately have no chrome; the e2e suite asserts every other page renders a sidebar, which catches a dropped or misspelled include.

Every page loads the single entry point `<script type="module" src="/src/main.ts">`.

### Behavior split: headless package vs. local stub

- **`@adminlte/headless`** (npm dependency): `initAll({ accessibility: false })` in `main.ts` wires up Layout, PushMenu (sidebar toggle), Treeview, CardWidget (collapse/maximize/remove), DirectChat, and FullScreen. Accessibility is disabled because the local `src/a11y.ts` handles it.
- **`src/lib/headless-stub.ts`** (local): Dropdown, Modal, and Toast implementations — these aren't in the published headless package yet. When the package gains them, the stub should be retired.

Components auto-initialize from `data-lte-toggle` attributes in markup: `sidebar`, `dropdown`, `fullscreen`, `treeview`, `card-collapse`, `card-maximize`, `card-remove`, `card-refresh`.

### Feature modules

Always-on modules are statically imported in `src/main.ts` (ship in the main chunk — keep them static so every page doesn't pay an extra request):

| Module | Purpose |
| --- | --- |
| `theme.ts` | Light/dark/auto color mode, persisted to `localStorage('adminlte.theme')` |
| `search.ts` | Cmd/Ctrl+K command palette; its page index is generated at build time from `virtual:pages` (see below) |
| `a11y.ts` | Skip link, aria-labels |

Page-specific modules are dynamically imported only when their DOM hook exists:

| Module | Loaded when | Purpose |
| --- | --- | --- |
| `tables.ts` | `table[data-datatable]` | simple-datatables |
| `forms.ts` | `form[data-validate]`, `[data-wizard]` | Validation & wizard |
| `calendar.ts` | `#calendar-grid` | Interactive calendar |
| `kanban.ts` | `#kanban-board` | Drag-and-drop board |
| `charts.ts` | chart/map container IDs | ApexCharts + jsVectorMap (kept out of the base bundle deliberately) |

The sidebar scrollbar is pure CSS (`scrollbar-width`/`scrollbar-color` on `.sidebar-menu` in `styles.css`) — no JS library.

### Build-time generation in `vite.config.js`

Besides the multi-page input discovery, the config owns four small plugins:

| Plugin | What it does |
| --- | --- |
| `htmlIncludes` | Expands `<!-- @include name -->` from `partials/` |
| `pagesIndex` | Exposes discovered pages as the `virtual:pages` module for ⌘K search |
| `seoTags` | Injects per-page `<link rel="canonical">`, `og:url` and the manifest link, and rewrites social images to absolute URLs |
| `sitemap` | Emits `sitemap.xml` and `robots.txt` |
| `themeNoFlash` | Applies the stored color mode and direction before first paint |

`seoTags` and `sitemap` both derive from the single `SITE_URL` constant, so they cannot disagree. Override it with `SITE_URL=https://example.com/ npm run build`. Error, maintenance and auth pages are marked `noindex` and kept out of the sitemap.

### Images

All images are local — the template makes no third-party requests, and the e2e suite asserts that.

Avatars are generated SVGs in `public/assets/img/avatars/`, named `<person-slug>-<hex>.svg`. `scripts/generate-avatars.mjs` derives the set from the pages themselves, so adding an avatar means referencing the path and running `npm run gen:avatars`. Because SVG scales, one file serves every size the page needs.

Photographs live in `public/assets/img/gallery/` as AVIF with a mozjpeg fallback, wired up with `<picture class="contents">` — the `contents` class stops the wrapper generating a box so the `<img>`'s sizing classes still resolve against the original parent.

### Testing

`tests/pages.spec.ts` runs against the production build (Playwright starts `npm run build && npm run preview`). It discovers pages with the same rule as the build, so new pages are covered automatically, and asserts: no console errors or failed requests, no third-party requests, shared chrome present, charts/map/calendar/kanban/datatable rendering, and the sidebar, treeview, theme cycle, RTL toggle, ⌘K palette and skip link behaviours.

Tests are Node code and are type-checked through `tsconfig.node.json`; the root `tsconfig.json` keeps `types: []` so Node globals stay out of the browser source.

### Search page index (`virtual:pages`)

The `pagesIndex` plugin in `vite.config.js` exposes the build's HTML discovery as a `virtual:pages` module (path + `<title>`-derived name per page), so new pages appear in the ⌘K palette automatically. `search.ts` keeps only optional curated metadata (category overrides + extra keywords in its `META` map); pages without an entry fall back to a directory-derived category.

### Dark mode & no-flash

Class-based dark mode: `.dark` on `<html>`, defined via `@custom-variant dark` in `styles.css`. The `themeNoFlash` plugin in `vite.config.js` injects an inline script into every page's `<head>` that applies the stored mode (and RTL `dir` from `localStorage('adminlte.dir')`) before first paint. `src/theme.ts` keeps it in sync afterwards (cycles light → dark → auto).

### Styling (`src/styles.css`, single stylesheet ~2300 lines)

- Tailwind CSS v4 with CSS-based config — no `tailwind.config.js`; custom colors via `@theme` (e.g. `--color-sidebar-dark`)
- `@layer components` for reusable classes (`.btn-*`, `.alert-*`, `.badge-*`, etc.)
- State classes toggled by the headless library, styled here: `.sidebar-collapse` (mini rail), `.menu-open`, `.collapsed-card` / `.maximized-card`, `.dropdown-open`, `.modal-open`
- Prettier runs `prettier-plugin-tailwindcss`, so utility classes in HTML are auto-sorted — run `npm run format` after editing markup

### Gotchas

- Sidebar submenus (`.nav-treeview`) animate via inline `display`, not Tailwind's `hidden` class — `main.ts` strips `hidden` and sets `display: none` on load. Don't add `hidden` to treeview markup.
- Edit shared chrome in `partials/`, never in a page — a page only carries the `<!-- @include ... -->` comment.
- TypeScript is pinned to 6.x on purpose. TypeScript 7 is the native port and ships without the JS compiler API typescript-eslint reads types through (it peers on `typescript <6.1.0`), so upgrading breaks linting. Revisit when TS 7.1 ships its stable API.
- Active menu highlighting is URL-based at runtime (`initActiveMenuItem` in `main.ts`) — don't hardcode active classes on sidebar links.
