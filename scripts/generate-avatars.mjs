#!/usr/bin/env node
/**
 * Generates the local initials avatars used across the template.
 *
 * The pages used to point at ui-avatars.com, which meant ~230 third-party
 * requests per full browse, no offline preview, and a hard dependency on a
 * service we don't control. These SVGs are the local replacement: they scale
 * to any size, so one file serves every place a person appears.
 *
 * The avatar set is derived from the pages themselves — every
 * `/assets/img/avatars/<name-slug>-<hex>.svg` reference in an HTML file is
 * (re)generated here, so adding an avatar means referencing it and re-running
 * this script. Run with `npm run gen:avatars`; `--check` fails instead of
 * writing, which is what CI uses to catch a referenced-but-missing avatar.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = resolve(root, 'public/assets/img/avatars')
const IGNORE = new Set(['node_modules', 'dist', '.git', 'src', 'public', '.claude', '.github'])
const REF = /\/assets\/img\/avatars\/([a-z0-9-]+)-([0-9a-f]{3,6})\.svg/g

function htmlFiles(dir = root, out = []) {
  for (const name of readdirSync(dir)) {
    if (IGNORE.has(name)) continue
    const full = resolve(dir, name)
    if (statSync(full).isDirectory()) htmlFiles(full, out)
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

/** "john-doe" -> "John Doe" (used for the SVG's accessible name). */
const titleCase = (slug) =>
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

/** "John Doe" -> "JD"; a single word yields its first two letters. */
function initials(name) {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

const expand = (hex) => (hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex)

/** Mix a hex colour toward white by `amount` (0-1) for the gradient's top stop. */
function lighten(hex, amount) {
  const n = parseInt(expand(hex), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return (
    '#' +
    ch
      .map((c) => Math.round(c + (255 - c) * amount))
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
  )
}

/**
 * A square avatar: the callers clip it to a circle with `rounded-full`, and the
 * few square usages (timeline, general UI) want the full bleed.
 *
 * Text is centred with `dy=".35em"` rather than `dominant-baseline`, which is
 * the portable spelling when an SVG is rendered through an <img> tag.
 */
function avatarSvg(name, hex) {
  const base = '#' + expand(hex)
  const top = lighten(hex, 0.22)
  const id = `g${expand(hex)}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="1" stop-color="${base}"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" fill="url(#${id})"/>
  <text x="64" y="64" dy=".35em" fill="#fff" text-anchor="middle" font-size="52" font-weight="600" font-family="system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">${initials(name)}</text>
</svg>
`
}

const check = process.argv.includes('--check')
const wanted = new Map()
for (const file of htmlFiles()) {
  const html = readFileSync(file, 'utf8')
  for (const [, slug, hex] of html.matchAll(REF)) {
    wanted.set(`${slug}-${hex}`, { name: titleCase(slug), hex })
  }
}

if (!check) mkdirSync(OUT_DIR, { recursive: true })

let written = 0
const missing = []
for (const [key, { name, hex }] of wanted) {
  const path = resolve(OUT_DIR, `${key}.svg`)
  const svg = avatarSvg(name, hex)
  if (check) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== svg) missing.push(`${key}.svg`)
    continue
  }
  if (!existsSync(path) || readFileSync(path, 'utf8') !== svg) {
    writeFileSync(path, svg)
    written++
  }
}

if (check) {
  if (missing.length) {
    console.error(
      `Avatars out of date (${missing.length}). Run \`npm run gen:avatars\`:\n  ` +
        missing.join('\n  ')
    )
    process.exit(1)
  }
  console.log(`Avatars up to date: ${wanted.size} referenced by the pages.`)
} else {
  console.log(
    `Avatars: ${wanted.size} referenced, ${written} written to public/assets/img/avatars/`
  )
}
