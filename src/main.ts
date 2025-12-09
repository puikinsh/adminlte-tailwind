/**
 * AdminLTE Tailwind - Main Entry Point
 */

import {
  createLayout,
  createPushMenu,
  createTreeview,
  createFullScreen,
  CardWidget,
  Dropdown,
  createModal,
  createToastManager
} from '@adminlte/headless'

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('AdminLTE Tailwind initializing...')

  // Initialize Layout
  const layout = createLayout(document.body, {
    classNames: {
      holdTransition: 'hold-transition',
      appLoaded: 'app-loaded'
    }
  })
  layout?.init()

  // Initialize PushMenu (Sidebar)
  const sidebar = createPushMenu('.app-sidebar', {
    sidebarBreakpoint: 991, // Match Tailwind's lg breakpoint
    enablePersistence: true,
    storageKey: 'adminlte.sidebar.state',
    classNames: {
      sidebarCollapse: 'sidebar-collapse',
      sidebarOpen: 'sidebar-open',
      sidebarOverlay: 'sidebar-overlay',
      menuOpen: 'menu-open'
    },
    selectors: {
      toggle: '[data-lte-toggle="sidebar"]',
      appWrapper: '.app-wrapper'
    }
  })

  if (sidebar) {
    sidebar.init()
    sidebar.createOverlay()

    // Log sidebar events for debugging
    sidebar.on('toggle', ({ isOpen }) => {
      console.log('Sidebar toggled:', isOpen ? 'open' : 'closed')
    })

    sidebar.on('breakpointChange', ({ isMobile }) => {
      console.log('Breakpoint changed:', isMobile ? 'mobile' : 'desktop')
    })
  }

  // Initialize Treeview (sidebar menu)
  // First, hide all submenus with display:none (headless lib expects this, not Tailwind's hidden class)
  document.querySelectorAll('.nav-treeview').forEach(el => {
    (el as HTMLElement).style.display = 'none'
    el.classList.remove('hidden')
  })

  const treeview = createTreeview('.sidebar-menu', {
    accordion: true,
    animationSpeed: 300,
    classNames: {
      menuOpen: 'menu-open'
    },
    selectors: {
      navItem: '.nav-item',
      navLink: '.nav-link',
      treeviewMenu: '.nav-treeview'
    }
  })

  if (treeview) {
    treeview.init()

    // Handle treeview icon rotation on expand/collapse
    treeview.on('expanded', ({ item }) => {
      const icon = item.querySelector('.treeview-icon')
      icon?.classList.add('rotate-90')
    })

    treeview.on('collapsed', ({ item }) => {
      const icon = item.querySelector('.treeview-icon')
      icon?.classList.remove('rotate-90')
    })
  }

  // Initialize Card Widgets
  const cards = CardWidget.initAll()
  console.log(`Initialized ${cards.length} card widget(s)`)

  // Initialize Fullscreen
  const fullscreen = createFullScreen('[data-lte-toggle="fullscreen"]')
  if (fullscreen) {
    fullscreen.init()

    fullscreen.on('toggle', ({ isFullscreen }) => {
      // Toggle icon visibility
      const expandIcon = document.querySelector('.fullscreen-icon-expand')
      const collapseIcon = document.querySelector('.fullscreen-icon-collapse')

      if (isFullscreen) {
        expandIcon?.classList.add('hidden')
        collapseIcon?.classList.remove('hidden')
      } else {
        expandIcon?.classList.remove('hidden')
        collapseIcon?.classList.add('hidden')
      }
    })
  }

  // Initialize Dropdowns
  const dropdowns = Dropdown.initAll({
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
  console.log(`Initialized ${dropdowns.length} dropdown(s)`)

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

  console.log('AdminLTE Tailwind initialized!')
})
