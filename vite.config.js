import { defineConfig } from 'vite'
import { resolve, relative, sep } from 'path'
import { readdirSync, readFileSync, statSync } from 'fs'
import tailwindcss from '@tailwindcss/vite'

const root = import.meta.dirname
const IGNORE = new Set(['node_modules', 'dist', '.git', 'src', 'public', '.claude', 'partials'])

// Where the site will be served from. Both default to a plain root deployment,
// which is what someone cloning this template should get: `npm run build`
// produces a site that works when dropped at the root of any host, and bakes in
// no URLs belonging to somebody else.
//
//   BASE_PATH  path the site is served under, e.g. /themes/tailwind/
//   SITE_URL   public origin+path, used for canonical tags, og:url, absolute
//              social-image URLs and sitemap.xml
//
// SITE_URL has no default on purpose: a canonical tag pointing at a domain you
// do not own is worse than no canonical tag, so when it is unset those tags and
// the sitemap are simply not emitted. Set it to your own domain to turn them on:
//
//   SITE_URL=https://example.com/ npm run build
//
// The adminlte.io demo is served from a subpath and is the one deployment that
// needs both; `npm run build:demo` sets them.
const BASE_PATH = (process.env.BASE_PATH || '/').replace(/\/*$/, '/')
const SITE_URL = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/*$/, '/') : null

// Pages that should not be advertised to search engines: error and maintenance
// screens, and the auth demos (which are duplicate-ish content, not destinations).
const NOINDEX = /^\/(pages\/(404|500|maintenance)|examples\/)/

/** '/index.html' -> site root; '/pages/x.html' -> absolute URL for that page. */
const pageUrl = (path) => SITE_URL + (path === '/index.html' ? '' : path.replace(/^\//, ''))

/** Prefix a root-absolute path with the deployment's base. */
const withBase = (path) => BASE_PATH + path.replace(/^\//, '')

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
 * Prefix the root-absolute links Vite leaves alone.
 *
 * Vite rewrites references that resolve to a real asset, but an <a href> to
 * another page is just a string to it — so under a base path every internal
 * link would 404. This rewrites those (and the brand's href="/") to sit under
 * the base. It is a no-op for the default root deployment.
 */
function basePaths() {
  if (BASE_PATH === '/') return { name: 'base-paths' }
  return {
    name: 'base-paths',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(/(href=")(\/(?:[^"]*\.html)?)"/g, (whole, attr, path) =>
          path.startsWith(BASE_PATH) ? whole : attr + withBase(path) + '"'
        )
      }
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
      const tags = [`<link rel="manifest" href="${withBase('/site.webmanifest')}" />`]

      // Absolute URLs need a known origin. Without SITE_URL the page still gets
      // its manifest and robots directives, just no canonical or og:url.
      if (SITE_URL) {
        const url = pageUrl(path)
        tags.push(`<link rel="canonical" href="${url}" />`)
        tags.push(`<meta property="og:url" content="${url}" />`)
        html = html.replace(
          /(content=")(\/(?:og-image\.png|assets\/[^"]*))"/g,
          (_, a, p) => a + SITE_URL.slice(0, -1) + p + '"'
        )
      }
      if (NOINDEX.test(path)) tags.push('<meta name="robots" content="noindex, follow" />')
      return html.replace('</head>', '  ' + tags.join('\n    ') + '\n  </head>')
    }
  }
}

/**
 * Emit sitemap.xml and robots.txt from the same page discovery as the build.
 * Both name absolute URLs, so they are only emitted when SITE_URL says what the
 * site's origin is.
 */
function sitemap() {
  return {
    name: 'sitemap',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source:
          'User-agent: *\nAllow: /\n' + (SITE_URL ? `\nSitemap: ${SITE_URL}sitemap.xml\n` : '')
      })
      if (!SITE_URL) return
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
  base: BASE_PATH,
  plugins: [
    tailwindcss(),
    htmlIncludes(),
    pagesIndex(),
    seoTags(),
    basePaths(),
    sitemap(),
    themeNoFlash()
  ],
  build: {
    rollupOptions: {
      input: htmlInputs()
    }
  }
})
