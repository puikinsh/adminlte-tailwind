import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readdirSync, readFileSync, statSync } from 'fs'
import tailwindcss from '@tailwindcss/vite'

const root = resolve(__dirname)
const IGNORE = new Set(['node_modules', 'dist', '.git', 'src', 'public', '.claude'])

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
  plugins: [tailwindcss(), pagesIndex(), themeNoFlash()],
  build: {
    // ApexCharts + jsVectorMap form a large vendor chunk, but it's lazy-loaded
    // only on pages with a visualisation — so the size warning is benign here.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: htmlInputs()
    }
  }
})
