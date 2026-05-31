/**
 * AdminLTE Tailwind - Color mode (light / dark / auto)
 *
 * Cycles light → dark → auto on click, persists the choice to localStorage,
 * follows the system preference while in "auto", and toggles the `.dark` class
 * on <html>. A no-flash inline script (injected via the Vite config) applies the
 * stored mode before first paint; this module keeps it in sync afterwards.
 */
type Mode = 'light' | 'dark' | 'auto'

const KEY = 'adminlte.theme'
const ORDER: Mode[] = ['light', 'dark', 'auto']
const media = window.matchMedia('(prefers-color-scheme: dark)')

function stored(): Mode {
  const v = localStorage.getItem(KEY)
  return v === 'light' || v === 'dark' || v === 'auto' ? v : 'auto'
}

function isDark(mode: Mode): boolean {
  return mode === 'dark' || (mode === 'auto' && media.matches)
}

function updateButtons(mode: Mode) {
  const label = mode.charAt(0).toUpperCase() + mode.slice(1)
  document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('title', `Theme: ${label} (click to change)`)
    btn.querySelectorAll<HTMLElement>('[data-theme-icon]').forEach((icon) => {
      icon.classList.toggle('hidden', icon.dataset.themeIcon !== mode)
    })
  })
}

function apply(mode: Mode) {
  document.documentElement.classList.toggle('dark', isDark(mode))
  updateButtons(mode)
}

function setMode(mode: Mode) {
  localStorage.setItem(KEY, mode)
  apply(mode)
}

// --- Text direction (LTR / RTL) ---
const DIR_KEY = 'adminlte.dir'

function storedDir(): 'ltr' | 'rtl' {
  return localStorage.getItem(DIR_KEY) === 'rtl' ? 'rtl' : 'ltr'
}

function applyDir(dir: 'ltr' | 'rtl') {
  document.documentElement.setAttribute('dir', dir)
  document.querySelectorAll<HTMLElement>('[data-dir-toggle]').forEach((btn) => {
    btn.setAttribute('title', `Direction: ${dir.toUpperCase()} (click to flip)`)
  })
}

export default function initTheme() {
  apply(stored())
  applyDir(storedDir())

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = ORDER[(ORDER.indexOf(stored()) + 1) % ORDER.length]
      setMode(next)
    })
  })

  document.querySelectorAll('[data-dir-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = storedDir() === 'rtl' ? 'ltr' : 'rtl'
      localStorage.setItem(DIR_KEY, next)
      applyDir(next)
    })
  })

  // Re-evaluate when the OS theme changes and we're following it.
  media.addEventListener('change', () => {
    if (stored() === 'auto') apply('auto')
  })
}
