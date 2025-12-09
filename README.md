# AdminLTE Tailwind

> AdminLTE dashboard template built with Tailwind CSS

[![npm version](https://img.shields.io/npm/v/@adminlte/tailwind.svg)](https://www.npmjs.com/package/@adminlte/tailwind)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

AdminLTE Tailwind is a modern admin dashboard template that combines the powerful [@adminlte/headless](https://github.com/ColorlibHQ/adminlte-headless) component library with Tailwind CSS v4 for styling.

This provides:
- All AdminLTE component behaviors (sidebar, treeview, cards, modals, etc.)
- Modern Tailwind CSS v4 styling
- Fully responsive design
- Dark mode support (coming soon)
- Customizable via Tailwind's `@theme` directive

## Installation

```bash
npm install @adminlte/tailwind
```

Or clone and run locally:

```bash
git clone https://github.com/ColorlibHQ/adminlte-tailwind.git
cd adminlte-tailwind
npm install
npm run dev
```

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Components

This template includes styled implementations of all [@adminlte/headless](https://github.com/ColorlibHQ/adminlte-headless) components:

- **Layout** - Responsive admin layout with sidebar
- **PushMenu** - Collapsible sidebar with mobile overlay
- **Treeview** - Nested navigation menus
- **CardWidget** - Cards with collapse/maximize/remove actions
- **Dropdown** - Notification and user dropdowns
- **Modal** - Dialog windows with animations
- **Toasts** - Toast notifications
- **Tabs** - Tabbed content panels
- **FullScreen** - Fullscreen toggle

## Customization

Customize colors and theme variables in `src/styles.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  /* ... more custom colors */
}
```

## Project Structure

```
adminlte-tailwind/
├── index.html          # Main HTML template
├── src/
│   ├── main.ts         # JavaScript entry point
│   └── styles.css      # Tailwind CSS styles
├── vite.config.js      # Vite configuration
└── package.json
```

## Related Projects

- [@adminlte/headless](https://github.com/ColorlibHQ/adminlte-headless) - Framework-agnostic component logic
- [AdminLTE](https://github.com/ColorlibHQ/AdminLTE) - Original Bootstrap-based admin dashboard

## License

MIT
