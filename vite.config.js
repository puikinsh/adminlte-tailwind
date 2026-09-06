import { defineConfig } from 'vite'
import { resolve, relative, sep } from 'path'
import { readdirSync, readFileSync, statSync } from 'fs'
import tailwindcss from '@tailwindcss/vite'

const root = resolve(__dirname)
const IGNORE = new Set(['node_modules', 'dist', '.git', 'src', 'public', '.claude', 'partials'])

// Public URL the template is served from. Canonical tags, og:url, absolute
// social-image URLs, sitemap.xml and robots.txt are all derived from this one
// value so they can never disagree with each other. Override for a fork or a
// staging deploy with `SITE_URL=https://example.com/ npm run build`.
const SITE_URL = (process.env.SITE_URL || 'https://adminlte.io/themes/tailwind/').replace(
  /\/*$/,
  '/'
)

// Pages that should not be advertised to search engines: error and maintenance
// screens, and the auth demos (which are duplicate-ish content, not destinations).
const NOINDEX = /^\/(pages\/(404|500|maintenance)|examples\/)/

/** '/index.html' -> site root; '/pages/x.html' -> absolute URL for that page. */
const pageUrl = (path) => SITE_URL + (path === '/index.html' ? '' : path.replace(/^\//, ''))

const PARTIALS = resolve(root, 'partials')
const INCLUDE = /^([ \t]*)<!--[ \t]*@include[ \t]+([\w-]+)[ \t]*-->[ \t]*$/gm

/**
 * Expands `<!-- @include name -->` with partials/name.html.
 *
 * The pages have no templating system, so the navbar, sidebar and footer used to
 * be copy-pasted into all 30 full-layout pages — a sidebar link meant a 30-file
 * edit, guarded by a drift check that caught divergence but could not prevent it.
 * There is now one copy of each block and the duplication happens at build time.
 *
 * The include's own indentation is re-applied to every line of the partial so the
 * emitted HTML stays readable.
 */
function htmlIncludes() {
  const read = (name) => readFileSync(resolve(PARTIALS, `${name}.html`), 'utf8').trimEnd()
  return {
    name: 'html-includes',
    configureServer(server) {
      // A partial is not an entry point, so Vite would not watch it on its own.
      server.watcher.add(PARTIALS)
      server.watcher.on('change', (file) => {
        if (!file.startsWith(PARTIALS)) return
        const hot = server.hot ?? server.ws
        hot?.send({ type: 'full-reload' })
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(INCLUDE, (_, indent, name) =>
          read(name)
            .split('\n')
            .map((line) => (line ? indent + line : line))
            .join('\n')
        )
      }
    }
  }
}

// Discover every .html page so the multi-page build emits all of them.
function htmlInputs(dir = root, inputs = {}) {
  for (const name of readdirSync(dir)) {
    if (IGNORE.has(name)) continue
    const full = resolve(dir, name)
    if (statSync(full).isDirectory()) {
      htmlInputs(full, inputs)
    } else if (name.endsWith('.html')) {
      const key = full.slice(root.length + 1).replace(/\.html$/, '') || 'index'
      inputs[key] = full
    }
  }
  return inputs
}

// Expose the discovered pages to the client as `virtual:pages` so the search
// palette's index is generated from the same file discovery as the build and
// can never drift from the actual pages. Titles come from each page's <title>.
function pagesIndex() {
  const VIRTUAL_ID = 'virtual:pages'
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  return {
    name: 'pages-index',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      const pages = Object.values(htmlInputs()).map((file) => {
        this.addWatchFile(file)
        const html = readFileSync(file, 'utf8')
        const title = (html.match(/<title>(.*?)<\/title>/s)?.[1] ?? file)
          .replace(/\s*\|[^|]*$/, '')
          .trim()
        const path =
          '/' +
          file
            .slice(root.length + 1)
            .split(/[\\/]/)
            .join('/')
        return { path, title }
      })
      return `export const pages = ${JSON.stringify(pages)}`
    }
  }
}

/**
 * Per-page SEO head tags.
 *
 * Canonical URLs and og:url are unique per page, so hand-maintaining them across
 * 35 duplicated <head> blocks would drift immediately. They are derived here from
 * the page's own path instead. Social images are rewritten from root-relative to
 * absolute because scrapers do not resolve relative og:image values.
 */
function seoTags() {
  return {
    name: 'seo-tags',
    transformIndexHtml(html, ctx) {
      const path = '/' + relative(root, ctx.filename).split(sep).join('/')
      const url = pageUrl(path)
      const tags = [
        `<link rel="canonical" href="${url}" />`,
        `<meta property="og:url" content="${url}" />`,
        '<link rel="manifest" href="/site.webmanifest" />'
      ]
      if (NOINDEX.test(path)) tags.push('<meta name="robots" content="noindex, follow" />')
      return html
        .replace(
          /(content=")(\/(?:og-image\.png|assets\/[^"]*))"/g,
          (_, a, p) => a + SITE_URL.slice(0, -1) + p + '"'
        )
        .replace('</head>', '  ' + tags.join('\n    ') + '\n  </head>')
    }
  }
}

/** Emit sitemap.xml and robots.txt from the same page discovery as the build. */
function sitemap() {
  return {
    name: 'sitemap',
    generateBundle() {
      const urls = Object.values(htmlInputs())
        .map((file) => '/' + relative(root, file).split(sep).join('/'))
        .filter((p) => !NOINDEX.test(p))
        .sort()
        .map((p) => `  <url><loc>${pageUrl(p)}</loc></url>`)
        .join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`
      })
    }
  }
}

// Apply the stored color mode before first paint to avoid a light flash.
const NO_FLASH =
  "<script>(function(){try{var k='adminlte.theme',v=localStorage.getItem(k)||'auto'," +
  "d=v==='dark'||(v==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);" +
  "document.documentElement.classList.toggle('dark',d);" +
  "document.documentElement.setAttribute('dir',localStorage.getItem('adminlte.dir')==='rtl'?'rtl':'ltr');" +
  '}catch(e){}})();</script>'

function themeNoFlash() {
  return {
    name: 'theme-no-flash',
    transformIndexHtml(html) {
      return html.replace('</head>', NO_FLASH + '\n</head>')
    }
  }
}

export default defineConfig({
  plugins: [tailwindcss(), htmlIncludes(), pagesIndex(), seoTags(), sitemap(), themeNoFlash()],
  build: {
    // ApexCharts + jsVectorMap form a large vendor chunk, but it's lazy-loaded
    // only on pages with a visualisation — so the size warning is benign here.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: htmlInputs()
    }
  }
})
