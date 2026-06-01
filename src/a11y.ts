/**
 * AdminLTE Tailwind - Accessibility helpers
 *
 *  - Injects a "Skip to main content" link as the first focusable element.
 *  - Makes <main> focusable so the skip link can land on it.
 *  - Derives aria-labels for icon-only buttons from their `title`.
 */
export default function initA11y() {
  const main = document.querySelector('main')
  if (main) {
    if (!main.id) main.id = 'main-content'
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')

    if (!document.querySelector('.skip-link')) {
      const skip = document.createElement('a')
      skip.href = `#${main.id}`
      skip.className = 'skip-link'
      skip.textContent = 'Skip to main content'
      document.body.prepend(skip)
    }
  }

  // Give icon-only buttons an accessible name from their tooltip text.
  document.querySelectorAll<HTMLElement>('button[title]:not([aria-label])').forEach((btn) => {
    if (!btn.textContent?.trim()) btn.setAttribute('aria-label', btn.getAttribute('title')!)
  })

  // Label icon-only toggles that have no tooltip to derive a name from.
  const TOGGLE_LABELS: Record<string, string> = {
    sidebar: 'Toggle sidebar',
    fullscreen: 'Toggle fullscreen'
  }
  document.querySelectorAll<HTMLElement>('[data-lte-toggle]').forEach((btn) => {
    if (btn.getAttribute('aria-label') || btn.getAttribute('title') || btn.textContent?.trim()) return
    const type = btn.getAttribute('data-lte-toggle') || ''
    if (TOGGLE_LABELS[type]) btn.setAttribute('aria-label', TOGGLE_LABELS[type])
    else if (type === 'dropdown' && btn.querySelector('img')) btn.setAttribute('aria-label', 'Open user menu')
  })
}
