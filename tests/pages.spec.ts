import { test, expect, type Page } from '@playwright/test'
import { readdirSync, statSync } from 'fs'
import { resolve, relative, sep } from 'path'

const root = resolve(import.meta.dirname, '..')
const IGNORE = new Set([
  'node_modules',
  'dist',
  '.git',
  'src',
  'public',
  '.claude',
  'tests',
  'partials'
])

/** Same discovery rule as the Vite build, so a new page is covered automatically. */
function pages(dir = root, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE.has(name) || name.startsWith('.')) continue
    const full = resolve(dir, name)
    if (statSync(full).isDirectory()) pages(full, out)
    else if (name.endsWith('.html')) out.push('/' + relative(root, full).split(sep).join('/'))
  }
  return out.sort()
}

/**
 * Collects everything that would show up as red in a browser console: uncaught
 * exceptions, console.error calls, and requests that never loaded. Chrome's own
 * advisory "[DOM] ..." notices are informational, not page faults.
 */
function watchForFailures(page: Page) {
  const problems: string[] = []
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().startsWith('[DOM]')) problems.push(`console: ${m.text()}`)
  })
  page.on('requestfailed', (r) => problems.push(`failed request: ${r.url()}`))
  page.on('response', (r) => {
    if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`)
  })
  return problems
}

const ALL = pages()

test('the build produces every page', () => {
  expect(ALL.length).toBeGreaterThan(30)
})

for (const path of ALL) {
  test(`${path} loads cleanly`, async ({ page }) => {
    const problems = watchForFailures(page)
    await page.goto(path, { waitUntil: 'networkidle' })

    await expect(page).toHaveTitle(/\S/)
    expect(problems, `${path} reported browser errors`).toEqual([])
  })
}

test.describe('images are served from this origin', () => {
  for (const path of ALL) {
    test(`${path} makes no third-party requests`, async ({ page }) => {
      const external: string[] = []
      page.on('request', (r) => {
        const url = new URL(r.url())
        if (url.hostname !== 'localhost' && url.protocol !== 'data:') external.push(r.url())
      })
      await page.goto(path, { waitUntil: 'networkidle' })
      expect(external, `${path} loaded a third-party resource`).toEqual([])
    })
  }
})

/** Pages that intentionally stand alone: auth screens and error pages. */
const STANDALONE = new Set([
  '/examples/lockscreen.html',
  '/examples/login.html',
  '/examples/register.html',
  '/pages/404.html',
  '/pages/500.html'
])

test.describe('shared chrome is present', () => {
  for (const path of ALL) {
    if (STANDALONE.has(path)) continue
    test(`${path} renders the navbar, sidebar and footer`, async ({ page }) => {
      await page.goto(path)
      // Catches a page that lost or misspelled one of its @include comments.
      await expect(page.locator('.app-sidebar')).toBeVisible()
      await expect(page.locator('[data-lte-toggle="sidebar"]').first()).toBeVisible()
      await expect(page.locator('footer').first()).toBeAttached()
    })
  }
})

test.describe('everything interactive has an accessible name', () => {
  for (const path of ALL) {
    test(`${path} names every control`, async ({ page }) => {
      await page.goto(path)
      const nameless = await page.evaluate(() => {
        const described = (el: Element) =>
          (el.getAttribute('aria-label') || '').trim() ||
          el.getAttribute('aria-labelledby') ||
          el.getAttribute('title')

        const out: string[] = []

        // Buttons and links: a name can also come from visible text or an
        // <img alt>, which is how most of them are named.
        for (const el of document.querySelectorAll('button, [role="button"], a[href]')) {
          if (described(el)) continue
          if ((el.textContent || '').replace(/\s+/g, ' ').trim()) continue
          if (el.querySelector('img[alt]:not([alt=""])')) continue
          out.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().slice(0, 40)}`)
        }

        // Form controls: a <label for> or a wrapping <label> also names them.
        for (const el of document.querySelectorAll('input, select, textarea')) {
          const type = el.getAttribute('type') || 'text'
          if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) continue
          if (described(el)) continue
          if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) continue
          if (el.closest('label')) continue
          out.push(`${el.tagName.toLowerCase()}[type=${type}]`)
        }
        return out
      })
      expect(nameless, `${path} has controls a screen reader cannot announce`).toEqual([])
    })
  }
})

test.describe('nothing overflows a phone screen', () => {
  test.use({ viewport: { width: 375, height: 812 } })
  for (const path of ALL) {
    test(`${path} fits 375px`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' })
      const { over, navPast } = await page.evaluate(() => {
        const de = document.documentElement
        // The navbar is fixed, so its own overflow never grows the document —
        // it just puts the right-hand icons past the edge of the screen.
        const cluster = [...document.querySelectorAll('nav div')].find(
          (d) => d.className.includes('items-center') && d.className.includes('gap-1')
        )
        return {
          over: de.scrollWidth - de.clientWidth,
          navPast: cluster ? Math.round(cluster.getBoundingClientRect().right) - de.clientWidth : 0
        }
      })
      expect(over, `${path} scrolls sideways on a phone`).toBeLessThanOrEqual(1)
      expect(navPast, `${path} pushes the navbar past the screen edge`).toBeLessThanOrEqual(1)
    })
  }
})

test.describe('interactive features render', () => {
  const CASES: Array<[string, string, string]> = [
    ['/index.html', 'world map', '#world-map.jvm-container svg [id^="jvm-"]'],
    ['/pages/calendar.html', 'calendar grid', '#calendar-grid [data-date]'],
    ['/pages/kanban.html', 'kanban cards', '#kanban-board [draggable="true"]'],
    ['/tables/simple.html', 'datatable', '.datatable-wrapper .datatable-pagination']
  ]
  for (const [path, what, selector] of CASES) {
    test(`${path} renders its ${what}`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator(selector).first()).toBeVisible({ timeout: 15_000 })
    })
  }
})

/** Number of non-transparent pixels on a canvas — 0 until Chart.js has drawn. */
const paintedPixels = (page: Page, selector: string) =>
  page.$eval(selector, (canvas: HTMLCanvasElement) => {
    const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
    let n = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++
    return n
  })

/** Canvas contents once the entry animation has settled. */
async function settledCanvas(page: Page, selector: string) {
  const read = () => page.$eval(selector, (c: HTMLCanvasElement) => c.toDataURL())
  let prev = ''
  await expect
    .poll(async () => {
      const next = await read()
      const same = next === prev
      prev = next
      return same
    })
    .toBe(true)
  return prev
}

test.describe('charts', () => {
  const CHARTS: Array<[string, string]> = [
    ['/index.html', '#revenue-chart'],
    ['/index2.html', '#visitors-chart'],
    ['/index2.html', '#sales-donut'],
    ['/index3.html', '#revenue-bar']
  ]
  for (const [path, id] of CHARTS) {
    test(`${path} draws ${id}`, async ({ page }) => {
      await page.goto(path)
      await expect
        .poll(() => paintedPixels(page, `${id} canvas`), { timeout: 15_000 })
        .toBeGreaterThan(1000)
    })
  }

  test('open charts re-theme when the colour mode changes', async ({ page }) => {
    await page.goto('/index3.html')
    const canvas = '#revenue-bar canvas'
    await expect.poll(() => paintedPixels(page, canvas)).toBeGreaterThan(1000)
    const light = await settledCanvas(page, canvas)

    const toggle = page.locator('[data-theme-toggle]').first()
    await toggle.click() // auto -> light
    await toggle.click() // light -> dark
    await expect(page.locator('html')).toHaveClass(/dark/)
    expect(await settledCanvas(page, canvas)).not.toBe(light)
  })
})

test.describe('core interactions work', () => {
  test('the sidebar collapses and expands', async ({ page }) => {
    await page.goto('/index.html')
    // The headless PushMenu toggles `sidebar-collapse` on <body>.
    const body = page.locator('body')
    await expect(body).not.toHaveClass(/sidebar-collapse/)
    await page.locator('[data-lte-toggle="sidebar"]').first().click()
    await expect(body).toHaveClass(/sidebar-collapse/)
    await page.locator('[data-lte-toggle="sidebar"]').first().click()
    await expect(body).not.toHaveClass(/sidebar-collapse/)
  })

  test('the theme toggle cycles light -> dark -> auto and survives a reload', async ({ page }) => {
    await page.goto('/index.html')
    const html = page.locator('html')
    const toggle = page.locator('[data-theme-toggle]').first()
    const mode = () => page.evaluate(() => localStorage.getItem('adminlte.theme'))

    // Pages start in `auto`, and the test browser reports a light OS preference.
    await expect(html).not.toHaveClass(/dark/)

    await toggle.click()
    expect(await mode()).toBe('light')
    await expect(html).not.toHaveClass(/dark/)

    await toggle.click()
    expect(await mode()).toBe('dark')
    await expect(html).toHaveClass(/dark/)

    // The no-flash script must re-apply it before first paint.
    await page.reload()
    await expect(html).toHaveClass(/dark/)

    await toggle.click()
    expect(await mode()).toBe('auto')
  })

  test('the direction toggle switches the document to RTL', async ({ page }) => {
    await page.goto('/index.html')
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
    await page.locator('[data-dir-toggle]').first().click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  })

  test('cmd+k opens the search palette and finds a page', async ({ page }) => {
    await page.goto('/index.html')
    await page.keyboard.press('ControlOrMeta+k')
    const input = page.locator('.search-input')
    await expect(input).toBeVisible()
    await input.fill('kanban')
    const hit = page.locator('.search-results a').first()
    await expect(hit).toContainText(/kanban/i)
    await hit.click()
    await expect(page).toHaveURL(/kanban\.html/)
  })

  test('a skip link is the first thing keyboard focus reaches', async ({ page, browserName }) => {
    await page.goto('/index.html')
    const skip = page.locator('.skip-link')

    if (browserName === 'webkit') {
      // Safari only moves Tab focus to links when Full Keyboard Access is on, so
      // the Tab order is not assertable there. Check the link is focusable and
      // reveals itself, which is the part the template is responsible for.
      await skip.focus()
    } else {
      await page.keyboard.press('Tab')
    }

    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
  })

  test('a sidebar treeview opens on click', async ({ page }) => {
    await page.goto('/index.html')
    // Skip the one the active-page highlighter has already opened.
    const parent = page.locator('.nav-item.has-treeview:not(.menu-open)').first()
    const submenu = parent.locator('.nav-treeview').first()
    await expect(submenu).toBeHidden()
    await parent.locator(':scope > .nav-link').click()
    await expect(submenu).toBeVisible()
  })
})
