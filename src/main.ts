/**
 * AdminLTE Tailwind - Main Entry Point
 */

// Core component behaviours come from the published @adminlte/headless package.
// Dropdown, Modal and Toast aren't in that package yet, so they stay local.
import { initAll } from '@adminlte/headless'
import { Dropdown, createModal, createToastManager } from './lib/headless-stub'

// Always-on modules are imported statically so they ship in the main chunk —
// a dynamic import() here would cost an extra network round trip on every page.
import initA11y from './a11y'
import initTheme from './theme'
import initSearch from './search'

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Submenus start hidden via display:none (the treeview animates display,
  // not Tailwind's `hidden` class).
  document.querySelectorAll('.nav-treeview').forEach((el) => {
    ;(el as HTMLElement).style.display = 'none'
    el.classList.remove('hidden')
  })

  // Initialise core AdminLTE behaviours via the headless package:
  // Layout, PushMenu, Treeview, CardWidget, DirectChat, FullScreen.
  // Accessibility is handled by our own a11y module, so it's disabled here.
  initAll({ accessibility: false })

  // Auto-detect and highlight the active menu item (opens its parent treeview)
  initActiveMenuItem()

  // Swap the fullscreen icon when the browser fullscreen state changes
  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement
    document.querySelector('.fullscreen-icon-expand')?.classList.toggle('hidden', isFs)
    document.querySelector('.fullscreen-icon-collapse')?.classList.toggle('hidden', !isFs)
  })

  // Initialize Dropdowns
  Dropdown.initAll({
    classNames: {
      dropdown: 'dropdown',
      open: 'dropdown-open',
      menu: 'dropdown-menu',
      item: 'dropdown-item',
      itemActive: 'dropdown-item-active'
    },
    selectors: {
      dropdown: '.dropdown',
      toggle: '[data-lte-toggle="dropdown"]',
      menu: '.dropdown-menu',
      item: '.dropdown-item'
    }
  })

  // Initialize Modal
  const demoModal = createModal('#demo-modal', {
    closeOnBackdropClick: true,
    closeOnEscape: true,
    trapFocus: true,
    lockBodyScroll: true,
    animationDuration: 150,
    classNames: {
      modal: 'modal',
      open: 'modal-open',
      backdrop: 'modal-backdrop',
      dialog: 'modal-dialog'
    }
  })

  if (demoModal) {
    demoModal.init()

    // Connect the open modal button
    const openModalBtn = document.getElementById('open-modal-btn')
    openModalBtn?.addEventListener('click', () => {
      demoModal.open(openModalBtn)
    })
  }

  // Initialize Toast Manager
  const toasts = createToastManager({
    position: 'top-right',
    defaultDuration: 5000,
    maxToasts: 5,
    pauseOnHover: true
  })

  // Connect toast buttons
  document.getElementById('toast-success-btn')?.addEventListener('click', () => {
    toasts.success('Operation completed successfully!', {
      title: 'Success'
    })
  })

  document.getElementById('toast-error-btn')?.addEventListener('click', () => {
    toasts.error('Something went wrong. Please try again.', {
      title: 'Error'
    })
  })

  document.getElementById('toast-info-btn')?.addEventListener('click', () => {
    toasts.info('This is an informational message.', {
      title: 'Info'
    })
  })

  // Card refresh: show a spinner overlay for a moment, then clear it
  document.querySelectorAll('[data-lte-toggle="card-refresh"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.card') as HTMLElement | null
      if (!card || card.querySelector('.card-refresh-overlay')) return
      card.style.position = 'relative'
      const overlay = document.createElement('div')
      overlay.className = 'card-refresh-overlay'
      overlay.innerHTML =
        '<svg class="w-8 h-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">' +
        '<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>' +
        '<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"></path></svg>'
      card.appendChild(overlay)
      setTimeout(() => overlay.remove(), 1500)
    })
  })

  // Accessibility helpers (skip link, aria-labels)
  initA11y()

  // Color mode (light / dark / auto)
  initTheme()

  // Command-K search palette (lightweight, available on every page)
  initSearch()

  // Data tables (sortable / searchable / paginated) — only where present
  if (document.querySelector('table[data-datatable]')) {
    import('./tables').then(({ default: initTables }) => initTables())
  }

  // Form validation & wizard — only where present
  if (document.querySelector('form[data-validate], [data-wizard]')) {
    import('./forms').then(({ default: initForms }) => initForms())
  }

  // Interactive calendar — only on the calendar page
  if (document.querySelector('#calendar-grid')) {
    import('./calendar').then(({ default: initCalendar }) => initCalendar())
  }

  // Kanban drag-and-drop — only on the kanban page
  if (document.querySelector('#kanban-board')) {
    import('./kanban').then(({ default: initKanban }) => initKanban())
  }

  // Lazy-load charts/maps only on pages that contain a visualisation container.
  // Keeps ApexCharts/jsVectorMap out of the bundle for pages that don't need them.
  if (
    document.querySelector(
      '#revenue-chart, #visitors-chart, #sales-donut, #revenue-bar, #world-map'
    )
  ) {
    import('./charts').then(({ default: initCharts }) => initCharts())
  }
})

/**
 * Automatically detect and highlight the active menu item based on current URL.
 * Opens parent treeview menus and applies active styling to the current page link.
 */
function initActiveMenuItem() {
  // Treat the site root as /index.html so the dashboard link highlights correctly
  const currentPath = window.location.pathname === '/' ? '/index.html' : window.location.pathname
  const sidebarMenu = document.querySelector('.sidebar-menu')

  if (!sidebarMenu) return

  // Find all nav links in the sidebar
  const navLinks = sidebarMenu.querySelectorAll('.nav-link[href]')

  navLinks.forEach((link) => {
    const href = link.getAttribute('href')
    if (!href || href === '#') return

    // Check if this link matches the current page
    // Handle both exact matches and path matches (ignoring query strings)
    const linkPath = new URL(href, window.location.origin).pathname
    const isActive = currentPath === linkPath || currentPath.endsWith(linkPath)

    if (isActive) {
      // Check if this is a submenu item (inside a treeview)
      const parentTreeview = link.closest('.nav-treeview')

      if (parentTreeview) {
        // This is a submenu item - style it as active
        link.classList.remove('hover:bg-sidebar-light', 'text-gray-400')
        link.classList.add('text-white', 'bg-blue-600/20')

        // Change the bullet point to blue
        const bullet = link.querySelector('span.rounded-full')
        if (bullet) {
          bullet.classList.remove('bg-gray-500')
          bullet.classList.add('bg-blue-500')
        }

        // Find and open the parent treeview menu
        const parentNavItem = parentTreeview.closest('.nav-item.has-treeview')
        if (parentNavItem) {
          // Add menu-open class to parent
          parentNavItem.classList.add('menu-open')

          // Show the submenu
          ;(parentTreeview as HTMLElement).style.display = 'block'

          // Style the parent nav-link
          const parentLink = parentNavItem.querySelector(':scope > .nav-link')
          if (parentLink) {
            parentLink.classList.remove('hover:bg-sidebar-light', 'text-gray-300')
            parentLink.classList.add('bg-sidebar-light', 'text-white')

            // Rotate the treeview icon
            const icon = parentLink.querySelector('.treeview-icon')
            icon?.classList.add('rotate-90')
          }
        }
      } else {
        // This is a top-level menu item (no parent treeview)
        link.classList.remove('hover:bg-sidebar-light', 'text-gray-300')
        link.classList.add('bg-sidebar-light', 'text-white')
      }
    }
  })
}
