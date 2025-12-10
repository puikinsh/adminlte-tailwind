/**
 * Stub implementation of @adminlte/headless
 * This provides minimal implementations until the real package is available
 */

type EventCallback = (data: any) => void

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map()

  on(event: string, callback: EventCallback): this {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
    return this
  }

  emit(event: string, data?: any): void {
    this.events.get(event)?.forEach(cb => cb(data))
  }
}

// Layout
export function createLayout(_element: HTMLElement, _options?: any) {
  return {
    init() {
      document.body.classList.remove('hold-transition')
      document.body.classList.add('app-loaded')
    }
  }
}

// PushMenu (Sidebar)
export function createPushMenu(selector: string, options?: any) {
  const sidebar = document.querySelector(selector)
  if (!sidebar) return null

  const emitter = new EventEmitter()
  const appWrapper = document.querySelector(options?.selectors?.appWrapper || '.app-wrapper')
  let isOpen = true
  let overlay: HTMLElement | null = null

  const isMobile = () => window.innerWidth <= (options?.sidebarBreakpoint || 991)

  return {
    init() {
      // Load saved state
      if (options?.enablePersistence) {
        const saved = localStorage.getItem(options.storageKey || 'adminlte.sidebar.state')
        if (saved === 'collapsed' && !isMobile()) {
          isOpen = false
          appWrapper?.classList.add(options?.classNames?.sidebarCollapse || 'sidebar-collapse')
        }
      }

      // Set up toggle buttons
      document.querySelectorAll(options?.selectors?.toggle || '[data-lte-toggle="sidebar"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault()
          this.toggle()
        })
      })

      // Handle resize
      window.addEventListener('resize', () => {
        emitter.emit('breakpointChange', { isMobile: isMobile() })
      })
    },

    toggle() {
      isOpen = !isOpen
      const collapseClass = options?.classNames?.sidebarCollapse || 'sidebar-collapse'
      const openClass = options?.classNames?.sidebarOpen || 'sidebar-open'

      if (isMobile()) {
        if (isOpen) {
          appWrapper?.classList.add(openClass)
          overlay?.classList.add('active')
        } else {
          appWrapper?.classList.remove(openClass)
          overlay?.classList.remove('active')
        }
      } else {
        appWrapper?.classList.toggle(collapseClass, !isOpen)
        if (options?.enablePersistence) {
          localStorage.setItem(options.storageKey, isOpen ? 'open' : 'collapsed')
        }
      }

      emitter.emit('toggle', { isOpen })
    },

    createOverlay() {
      overlay = document.createElement('div')
      overlay.className = options?.classNames?.sidebarOverlay || 'sidebar-overlay'
      overlay.addEventListener('click', () => this.toggle())
      appWrapper?.appendChild(overlay)
    },

    on: emitter.on.bind(emitter)
  }
}

// Treeview
export function createTreeview(selector: string, options?: any) {
  const menu = document.querySelector(selector)
  if (!menu) return null

  const emitter = new EventEmitter()

  return {
    init() {
      menu.querySelectorAll(options?.selectors?.navLink || '.nav-link').forEach(link => {
        const item = link.closest(options?.selectors?.navItem || '.nav-item')
        const submenu = item?.querySelector(options?.selectors?.treeviewMenu || '.nav-treeview') as HTMLElement

        if (submenu) {
          link.addEventListener('click', (e) => {
            e.preventDefault()

            const isOpen = item?.classList.contains(options?.classNames?.menuOpen || 'menu-open')

            // Accordion: close siblings
            if (options?.accordion) {
              const parent = item?.parentElement
              parent?.querySelectorAll(`.${options?.classNames?.menuOpen || 'menu-open'}`).forEach(openItem => {
                if (openItem !== item) {
                  openItem.classList.remove(options?.classNames?.menuOpen || 'menu-open')
                  const openSubmenu = openItem.querySelector(options?.selectors?.treeviewMenu || '.nav-treeview') as HTMLElement
                  if (openSubmenu) openSubmenu.style.display = 'none'
                  emitter.emit('collapsed', { item: openItem })
                }
              })
            }

            if (isOpen) {
              item?.classList.remove(options?.classNames?.menuOpen || 'menu-open')
              submenu.style.display = 'none'
              emitter.emit('collapsed', { item })
            } else {
              item?.classList.add(options?.classNames?.menuOpen || 'menu-open')
              submenu.style.display = 'block'
              emitter.emit('expanded', { item })
            }
          })
        }
      })
    },

    on: emitter.on.bind(emitter)
  }
}

// Fullscreen
export function createFullScreen(selector: string) {
  const btn = document.querySelector(selector)
  if (!btn) return null

  const emitter = new EventEmitter()

  return {
    init() {
      btn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
          emitter.emit('toggle', { isFullscreen: true })
        } else {
          document.exitFullscreen()
          emitter.emit('toggle', { isFullscreen: false })
        }
      })

      document.addEventListener('fullscreenchange', () => {
        emitter.emit('toggle', { isFullscreen: !!document.fullscreenElement })
      })
    },

    on: emitter.on.bind(emitter)
  }
}

// Card Widget
export class CardWidget {
  static initAll() {
    const cards: CardWidget[] = []

    // Collapse buttons
    document.querySelectorAll('[data-lte-toggle="card-collapse"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.card')
        const body = card?.querySelector('.card-body')
        const footer = card?.querySelector('.card-footer')
        const icon = btn.querySelector('i')

        if (body) {
          const isCollapsed = (body as HTMLElement).style.display === 'none'
          ;(body as HTMLElement).style.display = isCollapsed ? '' : 'none'
          if (footer) (footer as HTMLElement).style.display = isCollapsed ? '' : 'none'
          icon?.classList.toggle('bi-dash-lg', isCollapsed)
          icon?.classList.toggle('bi-plus-lg', !isCollapsed)
        }
      })
      cards.push(new CardWidget())
    })

    // Maximize buttons
    document.querySelectorAll('[data-lte-toggle="card-maximize"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.card')
        const icon = btn.querySelector('i')

        card?.classList.toggle('card-maximized')
        document.body.classList.toggle('card-maximized-body')
        icon?.classList.toggle('bi-arrows-fullscreen')
        icon?.classList.toggle('bi-fullscreen-exit')
      })
    })

    // Remove buttons
    document.querySelectorAll('[data-lte-toggle="card-remove"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.card')
        card?.remove()
      })
    })

    return cards
  }
}

// Dropdown
export class Dropdown {
  static initAll(options?: any) {
    const dropdowns: Dropdown[] = []

    document.querySelectorAll(options?.selectors?.dropdown || '.dropdown').forEach(dropdown => {
      const toggle = dropdown.querySelector(options?.selectors?.toggle || '[data-lte-toggle="dropdown"]')
      const menu = dropdown.querySelector(options?.selectors?.menu || '.dropdown-menu')

      if (toggle && menu) {
        toggle.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          dropdown.classList.toggle(options?.classNames?.open || 'dropdown-open')
        })

        // Close on outside click
        document.addEventListener('click', (e) => {
          if (!dropdown.contains(e.target as Node)) {
            dropdown.classList.remove(options?.classNames?.open || 'dropdown-open')
          }
        })

        dropdowns.push(new Dropdown())
      }
    })

    return dropdowns
  }
}

// Modal
export function createModal(selector: string, options?: any) {
  const modal = document.querySelector(selector) as HTMLElement
  if (!modal) return null

  const emitter = new EventEmitter()
  let backdrop: HTMLElement | null = null

  return {
    init() {
      // Close button
      modal.querySelectorAll('[data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', () => this.close())
      })

      // Close on escape
      if (options?.closeOnEscape) {
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.classList.contains(options?.classNames?.open || 'modal-open')) {
            this.close()
          }
        })
      }
    },

    open(_trigger?: HTMLElement) {
      modal.classList.add(options?.classNames?.open || 'modal-open')
      modal.style.display = 'flex'

      if (options?.lockBodyScroll) {
        document.body.style.overflow = 'hidden'
      }

      // Create backdrop
      if (options?.closeOnBackdropClick) {
        backdrop = document.createElement('div')
        backdrop.className = options?.classNames?.backdrop || 'modal-backdrop'
        backdrop.addEventListener('click', () => this.close())
        document.body.appendChild(backdrop)
      }

      emitter.emit('open')
    },

    close() {
      modal.classList.remove(options?.classNames?.open || 'modal-open')
      modal.style.display = 'none'

      if (options?.lockBodyScroll) {
        document.body.style.overflow = ''
      }

      backdrop?.remove()
      backdrop = null

      emitter.emit('close')
    },

    on: emitter.on.bind(emitter)
  }
}

// Toast Manager
export function createToastManager(options?: any) {
  let container: HTMLElement | null = null

  const getContainer = () => {
    if (!container) {
      container = document.createElement('div')
      container.className = `toast-container toast-${options?.position || 'top-right'}`
      document.body.appendChild(container)
    }
    return container
  }

  const show = (message: string, type: string, toastOptions?: any) => {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.innerHTML = `
      ${toastOptions?.title ? `<div class="toast-header">${toastOptions.title}</div>` : ''}
      <div class="toast-body">${message}</div>
    `

    getContainer().appendChild(toast)

    // Auto dismiss
    setTimeout(() => {
      toast.classList.add('toast-hiding')
      setTimeout(() => toast.remove(), 300)
    }, options?.defaultDuration || 5000)

    // Pause on hover
    if (options?.pauseOnHover) {
      let timeout: number
      toast.addEventListener('mouseenter', () => clearTimeout(timeout))
      toast.addEventListener('mouseleave', () => {
        timeout = window.setTimeout(() => {
          toast.classList.add('toast-hiding')
          setTimeout(() => toast.remove(), 300)
        }, 1000)
      })
    }
  }

  return {
    success: (msg: string, opts?: any) => show(msg, 'success', opts),
    error: (msg: string, opts?: any) => show(msg, 'error', opts),
    info: (msg: string, opts?: any) => show(msg, 'info', opts),
    warning: (msg: string, opts?: any) => show(msg, 'warning', opts)
  }
}
