# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AdminLTE Tailwind is a Tailwind CSS v4 implementation of the AdminLTE admin dashboard template — a multi-page static site built with Vite. Component behaviors come from the published [@adminlte/headless](https://github.com/puikinsh/adminlte-headless) package; this project provides the CSS styling layer plus page-specific feature modules.

## Commands

```bash
npm run dev           # Vite dev server with HMR
npm run build         # Production build (all HTML pages)
npm run preview       # Preview production build
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint (flat config)
npm run format        # Prettier (writes)
npm run format:check  # Prettier (check only, used in CI)
npm run check:chrome  # Fails if shared chrome (navbar/sidebar/footer) drifts between pages
```

Node >= 22 required (`.nvmrc` says 22). There is no test suite. CI (`.github/workflows/ci.yml`) runs lint, format:check, typecheck, check:chrome, and build on Node 22/24/26.

## Architecture

### Multi-page Vite build

`vite.config.js` recursively discovers every `.html` file (excluding `node_modules`, `dist`, `src`, `public`, etc.) and registers it as a Rollup input. Pages live at the root (`index.html`, `index2.html`, `index3.html`) and under `pages/`, `UI/`, `examples/`, `forms/`, `tables/`, `widgets/`, `mailbox/`. Adding a new `.html` file anywhere outside the ignored dirs automatically includes it in the build — no config change needed.

**There is no templating system.** Every page duplicates the full layout markup (sidebar, header, footer). A change to shared chrome (e.g. a new sidebar link) must be replicated across all HTML pages — `npm run check:chrome` (also in CI) extracts the navbar/sidebar/footer from each full-layout page and fails if any differ from `index.html`, so drift can't ship silently.

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
- Active menu highlighting is URL-based at runtime (`initActiveMenuItem` in `main.ts`) — don't hardcode active classes on sidebar links.
