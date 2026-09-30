/**
 * AdminLTE Tailwind - Chart.js theme preset
 *
 * The one place chart styling lives. Colours come from the `--chart-*` CSS
 * variables in `styles.css` (remapped under `.dark`) and the font from <body>,
 * so charts follow the template instead of carrying their own palette.
 *
 * `themeChart()` registers a chart so it is re-themed live: when the colour
 * mode (`.dark` on <html>) or text direction (`dir`) changes, the tokens are
 * re-read into `Chart.defaults` and every open chart is updated.
 */
import { Chart, type CartesianScaleOptions } from 'chart.js'

export interface ChartTokens {
  series: string[]
  muted: string
  text: string
  strong: string
  grid: string
  surface: string
  tooltipBg: string
  tooltipText: string
  tooltipBorder: string
  font: string
  rtl: boolean
}

/** Live token values; scriptable chart options read from this object. */
export const tokens: ChartTokens = readTokens()

function readTokens(): ChartTokens {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return {
    series: [
      v('--chart-1', '#3b82f6'),
      v('--chart-2', '#22c55e'),
      v('--chart-3', '#eab308'),
      v('--chart-4', '#ef4444')
    ],
    muted: v('--chart-muted', '#9ca3af'),
    text: v('--chart-text', '#94a3b8'),
    strong: v('--chart-strong', '#1f2937'),
    grid: v('--chart-grid', '#f1f5f9'),
    surface: v('--chart-surface', '#ffffff'),
    tooltipBg: v('--chart-tooltip-bg', '#111827'),
    tooltipText: v('--chart-tooltip-text', '#ffffff'),
    tooltipBorder: v('--chart-tooltip-border', '#111827'),
    font: getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif',
    rtl: document.documentElement.getAttribute('dir') === 'rtl'
  }
}

/** Colour with alpha, from a `#rrggbb` token. */
export function alpha(hex: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

/** Push the current tokens into Chart.defaults. */
function applyDefaults() {
  const d = Chart.defaults
  d.font.family = tokens.font
  d.font.size = 12
  d.color = tokens.text
  d.borderColor = tokens.grid
  d.maintainAspectRatio = false

  // Lines: smooth, thin, points only on hover
  d.elements.line.tension = 0.4
  d.elements.line.borderWidth = 2
  d.elements.point.radius = 0
  d.elements.point.hoverRadius = 5
  d.elements.point.hitRadius = 12
  d.elements.point.hoverBorderWidth = 2
  // Bars: rounded, no outline
  d.elements.bar.borderRadius = 4
  d.elements.bar.borderSkipped = false
  // Arcs: separated by the card surface colour
  d.elements.arc.borderColor = tokens.surface
  d.elements.arc.borderWidth = 2

  // Subtle dashed value gridlines; no axis border, tick marks or category grid
  // (`scale` is shared by every axis; `scales.<type>` layers on top of it)
  const scale = d.scale as CartesianScaleOptions
  scale.grid.color = tokens.grid
  scale.grid.drawTicks = false
  scale.border.display = false
  scale.border.dash = [4, 4]
  scale.ticks.padding = 8
  if (d.scales.category) d.scales.category.grid = { display: false }

  d.interaction.mode = 'index'
  d.interaction.intersect = false

  const legend = d.plugins.legend
  legend.rtl = tokens.rtl
  legend.textDirection = tokens.rtl ? 'rtl' : 'ltr'
  legend.labels.usePointStyle = true
  legend.labels.pointStyle = 'circle'
  legend.labels.boxWidth = 8
  legend.labels.boxHeight = 8
  legend.labels.padding = 16
  legend.labels.color = tokens.text

  const tip = d.plugins.tooltip
  tip.rtl = tokens.rtl
  tip.textDirection = tokens.rtl ? 'rtl' : 'ltr'
  tip.backgroundColor = tokens.tooltipBg
  tip.titleColor = tokens.tooltipText
  tip.bodyColor = tokens.tooltipText
  tip.borderColor = tokens.tooltipBorder
  tip.borderWidth = 1
  tip.cornerRadius = 6
  tip.padding = 10
  tip.boxPadding = 4
  tip.usePointStyle = true
  tip.titleFont = { weight: 600 }
}

const charts = new Set<Chart>()

/** Re-read the tokens and redraw every registered chart. */
function refresh() {
  Object.assign(tokens, readTokens())
  applyDefaults()
  charts.forEach((chart) => chart.update('none'))
}

let observing = false

/** Apply the preset once and start watching <html> for mode/direction changes. */
export function initChartTheme() {
  applyDefaults()
  if (observing) return
  observing = true
  let frame = 0
  new MutationObserver(() => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(refresh)
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'dir'] })
}

/** Register a chart for live re-theming; returns it for chaining. */
export function themeChart<T extends Chart>(chart: T): T {
  charts.add(chart)
  return chart
}
