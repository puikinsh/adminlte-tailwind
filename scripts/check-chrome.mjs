#!/usr/bin/env node
/**
 * Chrome drift check.
 *
 * There is no templating system — every full-layout page duplicates the shared
 * chrome (header navbar, sidebar, footer). This script extracts those blocks
 * from each page and fails if any differ from the canonical copy in
 * index.html, so drift is caught in CI instead of shipping silently.
 *
 * Pages without a sidebar (auth screens, error pages) are standalone layouts
 * and are skipped.
 *
 * Usage: node scripts/check-chrome.mjs
 */
import { readdirSync, readFileSync, statSync } from 'fs'
import { resolve, relative } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const IGNORE = new Set(['node_modules', 'dist', '.git', 'src', 'public', '.claude', 'scripts'])
const CANONICAL = 'index.html'

function htmlFiles(dir = root, files = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE.has(name)) continue
    const full = resolve(dir, name)
    if (statSync(full).isDirectory()) htmlFiles(full, files)
    else if (name.endsWith('.html')) files.push(full)
  }
  return files
}

// Extract the chrome block for a tag: from its first opening tag to the
// matching close, depth-aware so nested tags of the same name don't truncate.
function extract(html, tag) {
  const open = new RegExp(`<${tag}[\\s>]`, 'g')
  const start = html.search(open)
  if (start === -1) return null
  const token = new RegExp(`<${tag}[\\s>]|</${tag}>`, 'g')
  token.lastIndex = start
  let depth = 0
  for (let m; (m = token.exec(html)); ) {
    depth += m[0].startsWith('</') ? -1 : 1
    if (depth === 0) return html.slice(start, token.lastIndex)
  }
  return null
}

// Comparison ignores comments and whitespace: Prettier may wrap lines
// differently per page and annotation comments vary — neither is drift.
const normalize = (s) =>
  s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()

// The blocks every full-layout page must share. The header is the first <nav>
// in the document (the navbar); the sidebar's own <nav> sits inside <aside>.
const BLOCKS = ['nav', 'aside', 'footer']

const canonicalHtml = readFileSync(resolve(root, CANONICAL), 'utf8')
const canonical = Object.fromEntries(BLOCKS.map((t) => [t, extract(canonicalHtml, t)]))

for (const tag of BLOCKS) {
  if (!canonical[tag]) {
    console.error(`Could not extract <${tag}> from canonical ${CANONICAL}`)
    process.exit(2)
  }
}

let drifted = 0
let checked = 0

for (const file of htmlFiles()) {
  const page = relative(root, file)
  const html = readFileSync(file, 'utf8')
  if (!extract(html, 'aside')) continue // standalone layout (auth/error pages)
  checked++
  for (const tag of BLOCKS) {
    const block = extract(html, tag)
    if (block === null) {
      console.error(`✗ ${page}: missing <${tag}>`)
      drifted++
    } else if (normalize(block) !== normalize(canonical[tag])) {
      console.error(`✗ ${page}: <${tag}> differs from ${CANONICAL}`)
      drifted++
    }
  }
}

if (drifted) {
  console.error(
    `\n${drifted} drifted chrome block(s) across ${checked} pages.` +
      `\nShared chrome (navbar, sidebar, footer) must be identical on every page —` +
      `\ncopy the canonical block from ${CANONICAL} to the pages listed above.`
  )
  process.exit(1)
}

console.log(`Chrome in sync: navbar, sidebar and footer match ${CANONICAL} on ${checked} pages.`)
