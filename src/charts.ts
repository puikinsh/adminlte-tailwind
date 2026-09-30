/**
 * AdminLTE Tailwind - Charts & Maps
 *
 * Real data visualisations powered by Chart.js (MIT) and jsVectorMap. Chart
 * styling comes from the shared preset in `chart-theme.ts`, which also keeps
 * open charts in step with the colour mode and text direction.
 *
 * Every initializer is guarded by an element lookup, so a single import can be
 * dropped on any page and only the visualisations that actually exist render.
 */
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type Plugin,
  type ScriptableContext
} from 'chart.js'
import 'jsvectormap/dist/jsvectormap.min.css'
import { alpha, initChartTheme, themeChart, tokens } from './chart-theme'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Tooltip
)

const get = (sel: string) => document.querySelector<HTMLElement>(sel)
const canvas = (sel: string) => document.querySelector<HTMLCanvasElement>(`${sel} canvas`)

/** Series colour by index, read live so a theme change can swap palettes. */
const series = (i: number) => () => tokens.series[i]
const muted = () => tokens.muted

/** Vertical gradient area fill (40% → 5%), sized to the chart area. */
function areaFill(color: () => string) {
  return ({ chart }: ScriptableContext<'line'>) => {
    const area = chart.chartArea
    if (!area) return alpha(color(), 0.2)
    const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
    g.addColorStop(0, alpha(color(), 0.4))
    g.addColorStop(1, alpha(color(), 0.05))
    return g
  }
}

const money = (v: number | string) => '$' + v + 'k'

/** Dashboard v1 — Sales Overview (smooth area, this month vs last month) */
function initSalesAreaChart() {
  const el = canvas('#revenue-chart')
  if (!el) return
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July']
  themeChart(
    new Chart(el, {
      type: 'line',
      data: {
        labels: months.map((m) => m.slice(0, 3)),
        datasets: [
          {
            label: 'This Month',
            data: [28, 48, 40, 19, 86, 27, 90],
            borderColor: series(0),
            backgroundColor: areaFill(series(0)),
            pointBackgroundColor: series(0),
            fill: 'origin'
          },
          {
            label: 'Last Month',
            data: [65, 59, 80, 81, 56, 55, 40],
            borderColor: muted,
            backgroundColor: areaFill(muted),
            pointBackgroundColor: muted,
            fill: 'origin'
          }
        ]
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => `${months[items[0].dataIndex]} 2024`,
              label: (item) => `${item.dataset.label}: ${money(item.parsed.y ?? 0)}`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: money, maxTicksLimit: 6 } }
        }
      }
    })
  )
}

/** Dashboard v2 — Visitors (area, this week vs last week) */
function initVisitorsAreaChart() {
  const el = canvas('#visitors-chart')
  if (!el) return
  themeChart(
    new Chart(el, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'This Week',
            data: [31, 40, 28, 51, 42, 85, 77],
            borderColor: series(0),
            backgroundColor: areaFill(series(0)),
            pointBackgroundColor: series(0),
            fill: 'origin'
          },
          {
            label: 'Last Week',
            data: [11, 32, 45, 32, 34, 52, 41],
            borderColor: series(1),
            backgroundColor: areaFill(series(1)),
            pointBackgroundColor: series(1),
            fill: 'origin'
          }
        ]
      },
      options: {
        plugins: { legend: { position: 'top', align: 'end' } },
        scales: { y: { beginAtZero: true, ticks: { maxTicksLimit: 6 } } }
      }
    })
  )
}

/** Writes a two-line "Total / $29,100" label in the middle of a doughnut. */
const centreText = (label: string, value: string): Plugin<'doughnut'> => ({
  id: 'centreText',
  afterDatasetsDraw(chart) {
    const arc = chart.getDatasetMeta(0).data[0]
    if (!arc) return
    const { x, y } = arc
    const { ctx } = chart
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = tokens.text
    ctx.font = `400 14px ${tokens.font}`
    ctx.fillText(label, x, y - 13)
    ctx.fillStyle = tokens.strong
    ctx.font = `600 22px ${tokens.font}`
    ctx.fillText(value, x, y + 12)
    ctx.restore()
  }
})

/** Dashboard v2 — Sales by Category (donut) */
function initSalesDonut() {
  const el = canvas('#sales-donut')
  if (!el) return
  themeChart(
    new Chart(el, {
      type: 'doughnut',
      data: {
        labels: ['Electronics', 'Clothing', 'Home & Garden', 'Sports'],
        datasets: [
          {
            data: [12500, 8200, 5300, 3100],
            backgroundColor: ({ dataIndex }) => tokens.series[dataIndex % tokens.series.length],
            borderColor: () => tokens.surface,
            hoverBorderColor: () => tokens.surface,
            hoverOffset: 6
          }
        ]
      },
      options: {
        cutout: '65%',
        layout: { padding: 6 },
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => `${item.label}: $${item.parsed.toLocaleString()}`
            }
          }
        }
      },
      plugins: [centreText('Total', '$29,100')]
    })
  )
}

/** Dashboard v3 — Revenue Overview (grouped columns) */
function initRevenueBarChart() {
  const el = canvas('#revenue-bar')
  if (!el) return
  themeChart(
    new Chart(el, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [
          { label: 'Revenue', data: [44, 55, 57, 56, 61, 58, 63, 60], backgroundColor: series(0) },
          { label: 'Expenses', data: [26, 34, 35, 30, 40, 36, 42, 38], backgroundColor: muted }
        ]
      },
      options: {
        datasets: { bar: { categoryPercentage: 0.6, barPercentage: 0.8, maxBarThickness: 18 } },
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: {
            callbacks: { label: (item) => `${item.dataset.label}: ${money(item.parsed.y ?? 0)}` }
          }
        },
        scales: { y: { beginAtZero: true, ticks: { callback: money, maxTicksLimit: 6 } } }
      }
    })
  )
}

/**
 * Dashboard v1 — Visitors world map (jsVectorMap).
 * The map polygon data (world.js) calls `jsVectorMap.addMap(...)` against a
 * global, so it is loaded lazily only after the global is set — and only when
 * the map container is present.
 */
async function initWorldMap() {
  const target = get('#world-map')
  if (!target) return
  const { default: jsVectorMap } = await import('jsvectormap')
  ;(window as any).jsVectorMap = jsVectorMap
  await import('jsvectormap/dist/maps/world.js')
  // jsvectormap ships no type definitions, so its options and instance stay untyped.
  const map: any = new jsVectorMap({
    selector: '#world-map',
    map: 'world',
    zoomButtons: true,
    zoomOnScroll: false,
    regionStyle: {
      initial: { fill: '#e2e8f0', stroke: '#fff', strokeWidth: 0.4 },
      hover: { fill: tokens.series[0] }
    },
    markers: [
      { name: 'United States', coords: [40.71, -74.0] },
      { name: 'United Kingdom', coords: [51.5, -0.12] },
      { name: 'Brazil', coords: [-15.78, -47.92] },
      { name: 'India', coords: [21.0, 78.0] },
      { name: 'Australia', coords: [-33.86, 151.2] }
    ],
    markerStyle: {
      initial: { fill: tokens.series[3], stroke: '#fff', strokeWidth: 1, r: 5 },
      hover: { fill: tokens.series[2] }
    }
  })

  // jsVectorMap does not re-fit on its own. Redraw whenever the container
  // changes size — window resize, sidebar collapse/expand, etc. — coalescing
  // bursts into a single update per frame.
  let frame = 0
  const refit = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => map.updateSize())
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(refit).observe(target)
  } else {
    window.addEventListener('resize', refit)
  }
}

/** Render every visualisation that exists on the current page. */
export default function initCharts() {
  initChartTheme()
  initSalesAreaChart()
  initVisitorsAreaChart()
  initSalesDonut()
  initRevenueBarChart()
  initWorldMap()
}
