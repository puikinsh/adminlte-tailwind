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
}
