/**
 * AdminLTE Tailwind - Charts & Maps
 *
 * Real data visualisations powered by ApexCharts and jsVectorMap, mirroring the
 * libraries used by the original AdminLTE (Bootstrap) template.
 *
 * Every initializer is guarded by an element lookup, so a single import can be
 * dropped on any page and only the visualisations that actually exist render.
 */
import ApexCharts from 'apexcharts'
import 'jsvectormap/dist/jsvectormap.min.css'

// Template palette (Tailwind) so charts match the rest of the UI
const COLORS = {
  primary: '#3b82f6', // blue-500
  success: '#22c55e', // green-500
  warning: '#eab308', // yellow-500
  danger: '#ef4444', // red-500
  gray: '#9ca3af', // gray-400
}

const GRID = { borderColor: '#f1f5f9', strokeDashArray: 4 }
const AXIS_BORDER = { axisBorder: { show: false }, axisTicks: { show: false } }

const get = (sel: string) => document.querySelector<HTMLElement>(sel)

/** Dashboard v1 — Sales Overview (smooth area, this month vs last month) */
function initSalesAreaChart() {
  const target = get('#revenue-chart')
  if (!target) return
  const options: any = {
    series: [
      { name: 'This Month', data: [28, 48, 40, 19, 86, 27, 90] },
      { name: 'Last Month', data: [65, 59, 80, 81, 56, 55, 40] },
    ],
    chart: { height: 215, type: 'area', toolbar: { show: false }, fontFamily: 'inherit', foreColor: '#94a3b8' },
    colors: [COLORS.primary, COLORS.gray],
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { curve: 'smooth', width: 2 },
    grid: GRID,
    xaxis: {
      type: 'datetime',
      categories: ['2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01', '2024-05-01', '2024-06-01', '2024-07-01'],
      ...AXIS_BORDER,
    },
    yaxis: { labels: { formatter: (v: number) => '$' + v + 'k' } },
    tooltip: { x: { format: 'MMMM yyyy' } },
  }
  new ApexCharts(target, options).render()
}

/** Dashboard v2 — Visitors (area, this week vs last week) */
function initVisitorsAreaChart() {
  const target = get('#visitors-chart')
  if (!target) return
  const options: any = {
    series: [
      { name: 'This Week', data: [31, 40, 28, 51, 42, 85, 77] },
      { name: 'Last Week', data: [11, 32, 45, 32, 34, 52, 41] },
    ],
    chart: { height: 290, type: 'area', toolbar: { show: false }, fontFamily: 'inherit', foreColor: '#94a3b8' },
    colors: [COLORS.primary, COLORS.success],
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
    dataLabels: { enabled: false },
    legend: { position: 'top', horizontalAlign: 'right' },
    stroke: { curve: 'smooth', width: 2 },
    grid: GRID,
    xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], ...AXIS_BORDER },
  }
  new ApexCharts(target, options).render()
}

/** Dashboard v2 — Sales by Category (donut) */
function initSalesDonut() {
  const target = get('#sales-donut')
  if (!target) return
  const options: any = {
    series: [12500, 8200, 5300, 3100],
    labels: ['Electronics', 'Clothing', 'Home & Garden', 'Sports'],
    chart: { type: 'donut', height: 250, fontFamily: 'inherit', foreColor: '#94a3b8' },
    colors: [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger],
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: { show: true, label: 'Total', formatter: () => '$29,100' },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v: number) => '$' + v.toLocaleString() } },
  }
  new ApexCharts(target, options).render()
}

/** Dashboard v3 — Revenue Overview (grouped columns) */
function initRevenueBarChart() {
  const target = get('#revenue-bar')
  if (!target) return
  const options: any = {
    series: [
      { name: 'Revenue', data: [44, 55, 57, 56, 61, 58, 63, 60] },
      { name: 'Expenses', data: [26, 34, 35, 30, 40, 36, 42, 38] },
    ],
    chart: { height: 260, type: 'bar', toolbar: { show: false }, fontFamily: 'inherit', foreColor: '#94a3b8' },
    colors: [COLORS.primary, COLORS.gray],
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    legend: { position: 'top', horizontalAlign: 'right' },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    grid: GRID,
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], ...AXIS_BORDER },
    yaxis: { labels: { formatter: (v: number) => '$' + v + 'k' } },
  }
  new ApexCharts(target, options).render()
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
  const map: any = new jsVectorMap({
    selector: '#world-map',
    map: 'world',
    zoomButtons: true,
    zoomOnScroll: false,
    regionStyle: {
      initial: { fill: '#e2e8f0', stroke: '#fff', strokeWidth: 0.4 },
      hover: { fill: COLORS.primary },
    },
    markers: [
      { name: 'United States', coords: [40.71, -74.0] },
      { name: 'United Kingdom', coords: [51.5, -0.12] },
      { name: 'Brazil', coords: [-15.78, -47.92] },
      { name: 'India', coords: [21.0, 78.0] },
      { name: 'Australia', coords: [-33.86, 151.2] },
    ],
    markerStyle: {
      initial: { fill: COLORS.danger, stroke: '#fff', strokeWidth: 1, r: 5 },
      hover: { fill: COLORS.warning },
    },
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
  initSalesAreaChart()
  initVisitorsAreaChart()
  initSalesDonut()
  initRevenueBarChart()
  initWorldMap()
}
