/**
 * AdminLTE Tailwind - Command-K search palette
 *
 * A vanilla-JS command palette that indexes the template's pages. Open it with
 * Cmd/Ctrl+K or the header search trigger, filter as you type, navigate with the
 * arrow keys, and press Enter to jump to a page.
 */

// The page list (path + title) is generated at build time by the pagesIndex
// plugin in vite.config.js from the same HTML discovery as the build itself,
// so new pages appear here automatically.
import { pages } from 'virtual:pages'

interface SearchItem {
  title: string
  path: string
  category: string
  keywords?: string
}

// Optional curated metadata per page: a category override and extra match
// keywords. Pages not listed here still appear — they fall back to a
// category derived from their directory.
const META: Record<string, { category?: string; keywords?: string }> = {
  '/index.html': { keywords: 'home main analytics overview' },
  '/index2.html': { keywords: 'analytics visitors' },
  '/index3.html': { keywords: 'analytics ecommerce revenue' },
  '/widgets/small-box.html': { keywords: 'stat box number' },
  '/widgets/info-box.html': { keywords: 'stat icon' },
  '/widgets/cards.html': { keywords: 'panel box' },
  '/UI/general.html': { keywords: 'alerts badges callouts progress accordion tabs' },
  '/UI/timeline.html': { keywords: 'activity history' },
  '/UI/buttons.html': { keywords: 'btn actions' },
  '/UI/modals.html': { keywords: 'dialog popup overlay' },
  '/UI/icons.html': { keywords: 'svg glyphs symbols' },
  '/forms/elements.html': { keywords: 'input validation select checkbox' },
  '/tables/simple.html': { keywords: 'data grid rows' },
  '/pages/calendar.html': { category: 'Apps', keywords: 'events schedule dates' },
  '/pages/kanban.html': { category: 'Apps', keywords: 'tasks board drag' },
  '/pages/profile.html': { category: 'Apps', keywords: 'user account settings' },
  '/pages/contacts.html': { category: 'Apps', keywords: 'people directory' },
  '/pages/gallery.html': { category: 'Apps', keywords: 'images photos media' },
  '/pages/chat.html': { category: 'Apps', keywords: 'messages conversation' },
  '/pages/file-manager.html': { category: 'Apps', keywords: 'files folders storage' },
  '/mailbox/inbox.html': { keywords: 'email inbox messages' },
  '/mailbox/compose.html': { keywords: 'email write new message' },
  '/mailbox/read.html': { keywords: 'email message view' },
  '/pages/invoice.html': { keywords: 'bill payment receipt' },
  '/pages/pricing.html': { keywords: 'plans tiers subscription' },
  '/pages/projects.html': { keywords: 'tasks team progress' },
  '/pages/settings.html': { keywords: 'preferences account config' },
  '/pages/faq.html': { keywords: 'help questions support' },
  '/pages/maintenance.html': { keywords: 'down offline coming soon' },
  '/examples/login.html': { keywords: 'sign in authentication' },
  '/examples/register.html': { keywords: 'sign up create account' },
  '/examples/lockscreen.html': { keywords: 'lock password' },
  '/pages/blank.html': { category: 'Other', keywords: 'starter template empty' },
  '/pages/404.html': { category: 'Other', keywords: 'not found missing' },
  '/pages/500.html': { category: 'Other', keywords: 'server error' }
}

// Default category per top-level directory ('' = repo root).
const DIR_CATEGORIES: Record<string, string> = {
  '': 'Dashboards',
  widgets: 'Widgets',
  UI: 'UI Elements',
  forms: 'Forms & Tables',
  tables: 'Forms & Tables',
  pages: 'Pages',
  mailbox: 'Apps',
  examples: 'Auth'
}

const CATEGORY_ORDER = [
  'Dashboards',
  'Widgets',
  'UI Elements',
  'Forms & Tables',
  'Apps',
  'Pages',
  'Auth',
  'Other'
]

function categoryOf(path: string): string {
  const dir = path.split('/').slice(1, -1).join('/')
  return META[path]?.category ?? DIR_CATEGORIES[dir] ?? 'Other'
}

function categoryRank(category: string): number {
  const i = CATEGORY_ORDER.indexOf(category)
  return i === -1 ? CATEGORY_ORDER.length : i
}

const PAGES: SearchItem[] = pages
  .map((p) => ({ ...p, category: categoryOf(p.path), keywords: META[p.path]?.keywords }))
  .sort((a, b) => categoryRank(a.category) - categoryRank(b.category))

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
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  )
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
    header.className =
      'px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400'
    header.textContent = category
    resultsEl.appendChild(header)

    for (const item of list) {
      const el = document.createElement('a')
      el.href = item.path
      el.className =
        'search-item flex items-center gap-3 mx-2 px-2 py-2 rounded-lg cursor-pointer text-gray-700 no-underline'
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
      if (isOpen) close()
      else open()
    } else if (e.key === 'Escape' && isOpen) {
      close()
    }
  })

  // Header trigger button(s)
  document
    .querySelectorAll('[data-search-trigger]')
    .forEach((b) => b.addEventListener('click', open))

  // Show the right modifier hint for the platform
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
  document.querySelectorAll<HTMLElement>('[data-search-kbd]').forEach((el) => {
    el.textContent = isMac ? '⌘K' : 'Ctrl K'
  })
}
