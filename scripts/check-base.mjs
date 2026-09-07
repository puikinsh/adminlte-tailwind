#!/usr/bin/env node
/**
 * Verifies a built site has no links that escape its base path.
 *
 * Vite rewrites references that resolve to a real asset, but an <a href> to
 * another page is only a string to it, so a subpath deployment can silently
 * ship internal links that 404. The `basePaths` plugin rewrites them; this
 * checks the plugin actually caught everything.
 *
 * Usage: BASE_PATH=/themes/tailwind/ node scripts/check-base.mjs
 * A root deployment (the default) has nothing to check.
 */
import { readdirSync, readFileSync, statSync } from 'fs'
import { resolve, relative, sep } from 'path'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
const BASE_PATH = (process.env.BASE_PATH || '/').replace(/\/*$/, '/')

if (BASE_PATH === '/') {
  console.log('Base is the site root — nothing to check.')
  process.exit(0)
}

function files(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name)
    if (statSync(full).isDirectory()) files(full, out)
    else if (/\.(html|css|js|xml|webmanifest)$/.test(name)) out.push(full)
  }
  return out
}

const REF = /(?:href|src|srcset|content)="(\/[^"]*)"/g
const problems = []

for (const file of files(dist)) {
  const text = readFileSync(file, 'utf8')
  for (const [, url] of text.matchAll(REF)) {
    // Protocol-relative URLs (//host/…) are absolute, not site-root paths.
    if (url.startsWith('//') || url.startsWith(BASE_PATH)) continue
    problems.push(`${relative(root, file).split(sep).join('/')}  ->  ${url}`)
  }
}

if (problems.length) {
  const unique = [...new Set(problems.map((p) => p.split('  ->  ')[1]))]
  console.error(
    `${problems.length} reference(s) escape the base ${BASE_PATH} ` +
      `(${unique.length} distinct):\n  ` +
      unique.slice(0, 20).join('\n  ')
  )
  process.exit(1)
}

console.log(`All references sit under ${BASE_PATH}.`)
