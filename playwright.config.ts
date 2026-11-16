import { defineConfig, devices } from '@playwright/test'

/**
 * The suite drives the built site, not the dev server: it is the production
 * bundle — chunked, minified, with the build-time SEO and no-flash injections —
 * that ships to users, so that is what gets checked.
 */
// Set PORT to run on a different port (parallel runs, a busy 4173). A custom
// port never reuses a server that is already listening, so the suite always
// tests the build it just made.
const port = Number(process.env.PORT ?? 4173)
const url = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: url,
    trace: 'retain-on-failure'
  },
  // WebKit matters most here: the template leans on `display: contents` for the
  // <picture> wrappers and on scrollbar-color for the sidebar, both of which
  // behave differently in Safari.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url,
    reuseExistingServer: !process.env.CI && !process.env.PORT,
    timeout: 120_000
  }
})
