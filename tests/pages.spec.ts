import { test, expect, type Page } from '@playwright/test'
import { readdirSync, statSync } from 'fs'
import { resolve, relative, sep } from 'path'

const root = resolve(import.meta.dirname, '..')
const IGNORE = new Set(['node_modules', 'dist', '.git', 'src', 'public', '.claude', 'tests'])

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

test.describe('interactive features render', () => {
  const CASES: Array<[string, string, string]> = [
    ['/index.html', 'sales area chart', '#revenue-chart .apexcharts-area-series'],
    ['/index.html', 'world map', '#world-map.jvm-container svg [id^="jvm-"]'],
    ['/index2.html', 'visitors chart', '#visitors-chart .apexcharts-area-series'],
    ['/index2.html', 'sales donut', '#sales-donut .apexcharts-pie-series'],
    ['/index3.html', 'revenue bars', '#revenue-bar .apexcharts-bar-series'],
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

  test('a skip link is the first thing keyboard focus reaches', async ({ page }) => {
    await page.goto('/index.html')
    await page.keyboard.press('Tab')
    await expect(page.locator('.skip-link')).toBeFocused()
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
