# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AdminLTE Tailwind is a Tailwind CSS v4 implementation of the AdminLTE admin dashboard template. It uses [@adminlte/headless](https://github.com/ColorlibHQ/adminlte-headless) for all component behaviors (JavaScript logic) and provides only the CSS styling layer.

## Build Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
```

## Architecture

### Dependency on @adminlte/headless

This project uses `@adminlte/headless` as a dependency for all component behavior:
- Sidebar toggle (PushMenu)
- Treeview menus
- Card widgets (collapse/maximize/remove)
- Dropdowns
- Modals
- Toasts
- Tabs
- Fullscreen toggle

The headless library handles all JavaScript logic, event handling, and state management. This project only provides Tailwind CSS styling.

### Key Files

- `index.html` - Main HTML template with all component markup
- `src/main.ts` - JavaScript entry point, initializes headless components
- `src/styles.css` - Tailwind CSS styles including:
  - `@theme` directive for custom colors
  - Component-specific styles (dropdown, modal, toast)
  - Animation keyframes

### Tailwind CSS v4

This project uses Tailwind CSS v4 with the new CSS-based configuration:
- No `tailwind.config.js` needed
- Theme customization via `@theme` directive in CSS
- Uses `@tailwindcss/vite` plugin for Vite integration

### Data Attributes

Components use `data-lte-toggle` attributes for auto-initialization (from @adminlte/headless):
- `data-lte-toggle="sidebar"` - Sidebar toggle buttons
- `data-lte-toggle="dropdown"` - Dropdown triggers
- `data-lte-toggle="fullscreen"` - Fullscreen toggle
- `data-lte-toggle="card-collapse"` / `card-maximize` / `card-remove` - Card actions

## Styling Conventions

- Use Tailwind utility classes for most styling
- Custom CSS for complex animations (modal fade, toast slide)
- Component states handled via CSS classes toggled by headless library:
  - `.dropdown-open` - Dropdown is open
  - `.sidebar-mini` - Sidebar is collapsed
  - `.modal-open` - Modal is visible
