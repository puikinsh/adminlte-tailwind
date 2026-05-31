/**
 * AdminLTE Tailwind - Command-K search palette
 *
 * A vanilla-JS command palette that indexes the template's pages. Open it with
 * Cmd/Ctrl+K or the header search trigger, filter as you type, navigate with the
 * arrow keys, and press Enter to jump to a page.
 */

interface SearchItem {
  title: string
  path: string
  category: string
  keywords?: string
}

// In-memory index of every page in the template.
const PAGES: SearchItem[] = [
  { title: 'Dashboard v1', path: '/index.html', category: 'Dashboards', keywords: 'home main analytics overview' },
  { title: 'Dashboard v2', path: '/index2.html', category: 'Dashboards', keywords: 'analytics visitors' },
  { title: 'Dashboard v3', path: '/index3.html', category: 'Dashboards', keywords: 'analytics ecommerce revenue' },
  { title: 'Small Box', path: '/widgets/small-box.html', category: 'Widgets', keywords: 'stat box number' },
  { title: 'Info Box', path: '/widgets/info-box.html', category: 'Widgets', keywords: 'stat icon' },
  { title: 'Cards', path: '/widgets/cards.html', category: 'Widgets', keywords: 'panel box' },
  { title: 'General UI', path: '/UI/general.html', category: 'UI Elements', keywords: 'alerts badges callouts progress accordion tabs' },
  { title: 'Timeline', path: '/UI/timeline.html', category: 'UI Elements', keywords: 'activity history' },
  { title: 'Buttons', path: '/UI/buttons.html', category: 'UI Elements', keywords: 'btn actions' },
  { title: 'Modals', path: '/UI/modals.html', category: 'UI Elements', keywords: 'dialog popup overlay' },
  { title: 'Form Elements', path: '/forms/elements.html', category: 'Forms & Tables', keywords: 'input validation select checkbox' },
  { title: 'Tables', path: '/tables/simple.html', category: 'Forms & Tables', keywords: 'data grid rows' },
  { title: 'Calendar', path: '/pages/calendar.html', category: 'Apps', keywords: 'events schedule dates' },
  { title: 'Kanban Board', path: '/pages/kanban.html', category: 'Apps', keywords: 'tasks board drag' },
  { title: 'Profile', path: '/pages/profile.html', category: 'Apps', keywords: 'user account settings' },
  { title: 'Contacts', path: '/pages/contacts.html', category: 'Apps', keywords: 'people directory' },
  { title: 'Gallery', path: '/pages/gallery.html', category: 'Apps', keywords: 'images photos media' },
  { title: 'Mailbox', path: '/mailbox/inbox.html', category: 'Apps', keywords: 'email inbox messages' },
  { title: 'Compose Mail', path: '/mailbox/compose.html', category: 'Apps', keywords: 'email write new message' },
  { title: 'Read Mail', path: '/mailbox/read.html', category: 'Apps', keywords: 'email message view' },
  { title: 'Chat', path: '/pages/chat.html', category: 'Apps', keywords: 'messages conversation' },
  { title: 'File Manager', path: '/pages/file-manager.html', category: 'Apps', keywords: 'files folders storage' },
  { title: 'Invoice', path: '/pages/invoice.html', category: 'Pages', keywords: 'bill payment receipt' },
  { title: 'Pricing', path: '/pages/pricing.html', category: 'Pages', keywords: 'plans tiers subscription' },
  { title: 'Projects', path: '/pages/projects.html', category: 'Pages', keywords: 'tasks team progress' },
  { title: 'Settings', path: '/pages/settings.html', category: 'Pages', keywords: 'preferences account config' },
  { title: 'FAQ', path: '/pages/faq.html', category: 'Pages', keywords: 'help questions support' },
  { title: 'Maintenance', path: '/pages/maintenance.html', category: 'Pages', keywords: 'down offline coming soon' },
  { title: 'Icons', path: '/UI/icons.html', category: 'UI Elements', keywords: 'svg glyphs symbols' },
  { title: 'Login', path: '/examples/login.html', category: 'Auth', keywords: 'sign in authentication' },
  { title: 'Register', path: '/examples/register.html', category: 'Auth', keywords: 'sign up create account' },
  { title: 'Lock Screen', path: '/examples/lockscreen.html', category: 'Auth', keywords: 'lock password' },
  { title: 'Blank Page', path: '/pages/blank.html', category: 'Other', keywords: 'starter template empty' },
  { title: 'Error 404', path: '/pages/404.html', category: 'Other', keywords: 'not found missing' },
  { title: 'Error 500', path: '/pages/500.html', category: 'Other', keywords: 'server error' },
]

const ICON_SEARCH =
  '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>'
const ICON_PAGE =
  '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'

let overlay: HTMLElement
let input: HTMLInputElement
let resultsEl: HTMLElement
let items: HTMLAnchorElement[] = []
let selected = 0
let isOpen = false

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function navigate(path: string) {
  close()
  window.location.href = path
}

function setSelected(i: number) {
  if (!items.length) return
  selected = (i + items.length) % items.length
  items.forEach((el, idx) => {
    const on = idx === selected
    el.classList.toggle('bg-blue-50', on)
    el.classList.toggle('text-blue-700', on)
    const hint = el.querySelector<HTMLElement>('.enter-hint')
    hint?.classList.toggle('hidden', !on)
    hint?.classList.toggle('flex', on)
  })
  items[selected].scrollIntoView({ block: 'nearest' })
}

function render(query: string) {
  const q = query.trim().toLowerCase()
  const terms = q.split(/\s+/).filter(Boolean)
  const matches = PAGES.filter((p) => {
    if (!terms.length) return true
    const hay = `${p.title} ${p.category} ${p.keywords ?? ''}`.toLowerCase()
    return terms.every((t) => hay.includes(t))
  })

  resultsEl.innerHTML = ''
  items = []

  if (!matches.length) {
    resultsEl.innerHTML = `<div class="px-4 py-12 text-center text-sm text-gray-400">No results for "<span class="text-gray-600 font-medium">${escapeHtml(query)}</span>"</div>`
    return
  }

  const groups = new Map<string, SearchItem[]>()
  for (const m of matches) {
    if (!groups.has(m.category)) groups.set(m.category, [])
    groups.get(m.category)!.push(m)
  }

  for (const [category, list] of groups) {
    const header = document.createElement('div')
    header.className = 'px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400'
    header.textContent = category
    resultsEl.appendChild(header)

    for (const item of list) {
      const el = document.createElement('a')
      el.href = item.path
      el.className = 'search-item flex items-center gap-3 mx-2 px-2 py-2 rounded-lg cursor-pointer text-gray-700 no-underline'
      el.innerHTML =
        `<span class="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 shrink-0">${ICON_PAGE}</span>` +
        `<span class="flex-1 min-w-0"><span class="block text-sm font-medium truncate">${escapeHtml(item.title)}</span>` +
        `<span class="block text-xs text-gray-400 truncate">${escapeHtml(item.category)}</span></span>` +
        `<span class="enter-hint hidden items-center text-[11px] text-blue-500">Jump <span class="ml-1">↵</span></span>`
      const idx = items.length
      el.addEventListener('click', (e) => {
        e.preventDefault()
        navigate(item.path)
      })
      el.addEventListener('mousemove', () => setSelected(idx))
      items.push(el)
      resultsEl.appendChild(el)
    }
  }
  setSelected(0)
}

function open() {
  if (isOpen) return
  isOpen = true
  overlay.classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  input.value = ''
  render('')
  requestAnimationFrame(() => input.focus())
}

function close() {
  if (!isOpen) return
  isOpen = false
  overlay.classList.add('hidden')
  document.body.style.overflow = ''
}

function buildOverlay() {
  overlay = document.createElement('div')
  overlay.id = 'search-overlay'
  overlay.className = 'fixed inset-0 z-[100] hidden'
  overlay.innerHTML =
    '<div class="search-backdrop absolute inset-0 bg-gray-900/50 backdrop-blur-sm"></div>' +
    '<div class="search-panel absolute left-1/2 top-[14vh] -translate-x-1/2 w-[92%] max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">' +
    '<div class="flex items-center gap-3 px-4 border-b border-gray-100">' +
    `<span class="text-gray-400 shrink-0">${ICON_SEARCH}</span>` +
    '<input type="text" class="search-input flex-1 py-3.5 text-sm text-gray-800 outline-none placeholder-gray-400 bg-transparent" placeholder="Search pages…" autocomplete="off" spellcheck="false">' +
    '<kbd class="text-[11px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 shrink-0">esc</kbd>' +
    '</div>' +
    '<div class="search-results max-h-[58vh] overflow-y-auto py-2"></div>' +
    '<div class="flex items-center gap-4 px-4 py-2 border-t border-gray-100 text-[11px] text-gray-400">' +
    '<span class="flex items-center gap-1"><kbd class="border border-gray-200 rounded px-1">↑</kbd><kbd class="border border-gray-200 rounded px-1">↓</kbd> navigate</span>' +
    '<span class="flex items-center gap-1"><kbd class="border border-gray-200 rounded px-1">↵</kbd> open</span>' +
    '<span class="flex items-center gap-1"><kbd class="border border-gray-200 rounded px-1">esc</kbd> close</span>' +
    '</div></div>'
  document.body.appendChild(overlay)

  input = overlay.querySelector<HTMLInputElement>('.search-input')!
  resultsEl = overlay.querySelector<HTMLElement>('.search-results')!

  overlay.querySelector('.search-backdrop')!.addEventListener('click', close)
  input.addEventListener('input', () => render(input.value))
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(selected + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(selected - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const el = items[selected]
      if (el) navigate(el.getAttribute('href')!)
    }
  })
}

/** Initialise the palette: build the overlay, wire the shortcut and triggers. */
export default function initSearch() {
  buildOverlay()

  // Global shortcut: Cmd/Ctrl + K toggles, Esc closes.
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      isOpen ? close() : open()
    } else if (e.key === 'Escape' && isOpen) {
      close()
    }
  })

  // Header trigger button(s)
  document.querySelectorAll('[data-search-trigger]').forEach((b) => b.addEventListener('click', open))

  // Show the right modifier hint for the platform
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
  document.querySelectorAll<HTMLElement>('[data-search-kbd]').forEach((el) => {
    el.textContent = isMac ? '⌘K' : 'Ctrl K'
  })
}
