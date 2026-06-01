import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readdirSync, statSync } from 'fs'
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

// Apply the stored color mode before first paint to avoid a light flash.
const NO_FLASH =
  "<script>(function(){try{var k='adminlte.theme',v=localStorage.getItem(k)||'auto'," +
  "d=v==='dark'||(v==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);" +
  "document.documentElement.classList.toggle('dark',d);" +
  "document.documentElement.setAttribute('dir',localStorage.getItem('adminlte.dir')==='rtl'?'rtl':'ltr');" +
  "}catch(e){}})();</script>"

function themeNoFlash() {
  return {
    name: 'theme-no-flash',
    transformIndexHtml(html) {
      return html.replace('</head>', NO_FLASH + '\n</head>')
    },
  }
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    themeNoFlash()
  ],
  build: {
    // ApexCharts + jsVectorMap form a large vendor chunk, but it's lazy-loaded
    // only on pages with a visualisation — so the size warning is benign here.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: htmlInputs()
    }
  }
})
