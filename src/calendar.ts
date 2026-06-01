/**
 * AdminLTE Tailwind — interactive Calendar (preview only, no persistence).
 *
 * Renders a month grid + agenda list, with add/view/edit/delete via a modal,
 * drag-to-create from the side panel, category filtering and an upcoming list.
 * Events live in memory and reset on reload — this is a template demo.
 */

type ColorKey = 'blue' | 'green' | 'amber' | 'red' | 'purple'

interface CalEvent {
  id: string
  title: string
  start: string // YYYY-MM-DD
  end?: string // YYYY-MM-DD (inclusive); defaults to start
  time?: string // HH:MM
  allDay: boolean
  color: ColorKey
  description?: string
}

const COLORS: Record<ColorKey, { hex: string; label: string }> = {
  blue: { hex: '#3b82f6', label: 'Meeting' },
  green: { hex: '#22c55e', label: 'Personal' },
  amber: { hex: '#f59e0b', label: 'Reminder' },
  red: { hex: '#ef4444', label: 'Important' },
  purple: { hex: '#a855f7', label: 'Other' }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

// --- date helpers (local, no timezone surprises) ---
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const todayISO = () => {
  const n = new Date()
  return iso(n.getFullYear(), n.getMonth(), n.getDate())
}

let events: CalEvent[] = []
let cursor = new Date() // any date within the displayed month
let view: 'month' | 'list' = 'month'
const hiddenColors = new Set<ColorKey>()
let editingId: string | null = null
let uid = 0
const nextId = () => `ev-${++uid}`

function seed() {
  const base = new Date()
  const y = base.getFullYear()
  const m = base.getMonth()
  const fixed = (day: number) => iso(y, m, day) // pin to current month (keeps the grid populated)
  const fromToday = (off: number) => { // relative to today (keeps "Upcoming" populated regardless of date)
    const d = new Date(base); d.setDate(base.getDate() + off)
    return iso(d.getFullYear(), d.getMonth(), d.getDate())
  }
  const mk = (start: string, title: string, color: ColorKey, opts: Partial<CalEvent> = {}): CalEvent => ({
    id: nextId(), title, color, start, allDay: true, ...opts
  })
  events = [
    // Pinned to the current month so the grid always looks full
    mk(fixed(3), 'Team Standup', 'blue', { allDay: false, time: '09:30', description: 'Daily sync with the product team.' }),
    mk(fixed(6), 'Dentist Appointment', 'green', { allDay: false, time: '14:00' }),
    mk(fixed(11), 'Project Launch', 'red', { description: 'Ship v4.0 to production 🚀' }),
    mk(fixed(12), 'Design Conference', 'purple', { end: fixed(13), description: 'Two-day design & UX conference downtown.' }),
    mk(fixed(25), 'Payroll Run', 'amber'),
    // Anchored around today so the agenda & Upcoming panel always have items
    mk(fromToday(0), '1:1 with Manager', 'blue', { allDay: false, time: '11:00' }),
    mk(fromToday(2), 'Sprint Planning', 'blue', { allDay: false, time: '10:00' }),
    mk(fromToday(2), 'Team Lunch', 'green', { allDay: false, time: '12:30' }),
    mk(fromToday(5), 'Quarterly Review', 'red', { allDay: false, time: '15:00' }),
    mk(fromToday(9), 'Product Webinar', 'purple', { allDay: false, time: '16:00', description: 'Live demo of the new dashboard.' }),
    mk(fromToday(14), 'Release Notes Due', 'amber')
  ]
}

// --- element refs (resolved at init) ---
let grid: HTMLElement, title: HTMLElement, monthWrap: HTMLElement, listWrap: HTMLElement
let filtersBox: HTMLElement, upcomingBox: HTMLElement
let modal: HTMLElement, modalPanel: HTMLElement, modalTitle: HTMLElement
let fId: HTMLInputElement, fTitle: HTMLInputElement, fStart: HTMLInputElement, fEnd: HTMLInputElement
let fTime: HTMLInputElement, fColor: HTMLSelectElement, fAllDay: HTMLInputElement, fDesc: HTMLTextAreaElement
let deleteBtn: HTMLElement

function eventsForDay(dateISO: string): CalEvent[] {
  return events
    .filter(e => !hiddenColors.has(e.color))
    .filter(e => {
      const end = e.end || e.start
      return dateISO >= e.start && dateISO <= end
    })
    .sort((a, b) => (a.allDay === b.allDay ? (a.time || '').localeCompare(b.time || '') : a.allDay ? -1 : 1))
}

function pill(e: CalEvent): string {
  const c = COLORS[e.color].hex
  const label = !e.allDay && e.time ? `${e.time} ${e.title}` : e.title
  return `<button type="button" data-event-id="${e.id}"
    class="block w-full text-left text-[11px] leading-tight px-1.5 py-0.5 rounded truncate text-white hover:opacity-90 transition-opacity"
    style="background-color:${c}" title="${escapeHtml(e.title)}">${escapeHtml(label)}</button>`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string))
}

function renderMonth() {
  const y = cursor.getFullYear()
  const m = cursor.getMonth()
  title.textContent = `${MONTHS[m]} ${y}`

  const first = new Date(y, m, 1)
  const startOffset = first.getDay() // 0 = Sun
  const gridStart = new Date(y, m, 1 - startOffset)
  const today = todayISO()

  let html = ''
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    const dISO = iso(d.getFullYear(), d.getMonth(), d.getDate())
    const inMonth = d.getMonth() === m
    const isToday = dISO === today
    const dayEvents = eventsForDay(dISO)
    const shown = dayEvents.slice(0, 3)
    const extra = dayEvents.length - shown.length

    const numClasses = isToday
      ? 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold'
      : `text-sm ${inMonth ? 'text-gray-700' : 'text-gray-400'}`
    const cellBorder = (i % 7 !== 6 ? 'border-r ' : '') + (i < 35 ? 'border-b ' : '')

    html += `<div data-date="${dISO}"
      class="cal-cell min-h-28 p-1.5 ${cellBorder}border-gray-200 ${inMonth ? '' : 'bg-gray-50/40'} cursor-pointer hover:bg-gray-50 transition-colors">
      <div class="flex justify-end mb-1"><span class="${numClasses}">${d.getDate()}</span></div>
      <div class="space-y-1">${shown.map(pill).join('')}${extra > 0
        ? `<button type="button" data-more class="block w-full text-left text-[11px] text-gray-500 hover:text-blue-600 px-1.5">+${extra} more</button>`
        : ''}</div>
    </div>`
  }
  grid.innerHTML = html
}

function renderList() {
  // Agenda for the displayed month (like FullCalendar's listMonth view).
  const y = cursor.getFullYear()
  const m = cursor.getMonth()
  const inMonth = events
    .filter(e => !hiddenColors.has(e.color))
    .filter(e => { const d = parseISO(e.start); return d.getFullYear() === y && d.getMonth() === m })
    .sort((a, b) => a.start.localeCompare(b.start) || (a.time || '').localeCompare(b.time || ''))

  if (!inMonth.length) {
    listWrap.innerHTML = `<div class="p-10 text-center text-gray-500 text-sm">No events in ${MONTHS[m]}. Click a day in Month view to add one.</div>`
    return
  }
  // group by start date
  const groups: Record<string, CalEvent[]> = {}
  inMonth.forEach(e => { (groups[e.start] ||= []).push(e) })

  listWrap.innerHTML = Object.keys(groups).sort().map(dateISO => {
    const d = parseISO(dateISO)
    const heading = `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
    const rows = groups[dateISO].map(e => `
      <button type="button" data-event-id="${e.id}" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color:${COLORS[e.color].hex}"></span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-medium text-gray-800 truncate">${escapeHtml(e.title)}</span>
          ${e.description ? `<span class="block text-xs text-gray-500 truncate">${escapeHtml(e.description)}</span>` : ''}
        </span>
        <span class="text-xs text-gray-500 shrink-0">${e.allDay ? 'All day' : (e.time || '')}</span>
      </button>`).join('')
    return `<div>
      <div class="px-4 py-2 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">${heading}</div>
      ${rows}
    </div>`
  }).join('')
}

function renderFilters() {
  filtersBox.innerHTML = (Object.keys(COLORS) as ColorKey[]).map(key => `
    <label class="flex items-center gap-2.5 cursor-pointer select-none">
      <input type="checkbox" data-filter="${key}" class="w-4 h-4" ${hiddenColors.has(key) ? '' : 'checked'}>
      <span class="w-3 h-3 rounded-full" style="background-color:${COLORS[key].hex}"></span>
      <span class="text-sm text-gray-700">${COLORS[key].label}</span>
    </label>`).join('')
}

function renderUpcoming() {
  const today = todayISO()
  const next = events
    .filter(e => (e.end || e.start) >= today)
    .sort((a, b) => a.start.localeCompare(b.start) || (a.time || '').localeCompare(b.time || ''))
    .slice(0, 5)

  if (!next.length) {
    upcomingBox.innerHTML = `<p class="text-sm text-gray-500">Nothing coming up.</p>`
    return
  }
  upcomingBox.innerHTML = next.map(e => {
    const d = parseISO(e.start)
    return `<button type="button" data-event-id="${e.id}" class="w-full flex items-center gap-3 text-left group">
      <span class="flex flex-col items-center justify-center w-10 h-10 rounded-lg shrink-0 text-white" style="background-color:${COLORS[e.color].hex}">
        <span class="text-[10px] leading-none uppercase">${MONTHS[d.getMonth()].slice(0, 3)}</span>
        <span class="text-sm font-bold leading-none mt-0.5">${d.getDate()}</span>
      </span>
      <span class="flex-1 min-w-0">
        <span class="block text-sm font-medium text-gray-800 truncate group-hover:text-blue-600">${escapeHtml(e.title)}</span>
        <span class="block text-xs text-gray-500">${e.allDay ? 'All day' : (e.time || '')}</span>
      </span>
    </button>`
  }).join('')
}

function render() {
  monthWrap.classList.toggle('hidden', view !== 'month')
  listWrap.classList.toggle('hidden', view !== 'list')
  document.querySelectorAll<HTMLElement>('.cal-view-btn').forEach(b => {
    const active = b.dataset.view === view
    b.classList.toggle('bg-blue-600', active)
    b.classList.toggle('text-white', active)
    b.classList.toggle('text-gray-600', !active)
  })
  if (view === 'month') renderMonth()
  else renderList()
  renderUpcoming()
}

// --- modal ---
function openModal(mode: 'add' | 'edit', data: Partial<CalEvent>) {
  editingId = mode === 'edit' ? data.id || null : null
  modalTitle.textContent = mode === 'edit' ? 'Edit Event' : 'Add Event'
  fId.value = data.id || ''
  fTitle.value = data.title || ''
  fStart.value = data.start || todayISO()
  fEnd.value = data.end || ''
  fTime.value = data.time || ''
  fColor.value = data.color || 'blue'
  fAllDay.checked = data.allDay ?? true
  fDesc.value = data.description || ''
  fTime.disabled = fAllDay.checked
  deleteBtn.classList.toggle('hidden', mode !== 'edit')

  modal.classList.remove('opacity-0', 'pointer-events-none')
  modalPanel.classList.remove('scale-95')
  modalPanel.classList.add('scale-100')
  setTimeout(() => fTitle.focus(), 50)
}

function closeModal() {
  modal.classList.add('opacity-0', 'pointer-events-none')
  modalPanel.classList.add('scale-95')
  modalPanel.classList.remove('scale-100')
  editingId = null
}

function saveEvent() {
  const t = fTitle.value.trim()
  if (!t) { fTitle.focus(); fTitle.classList.add('ring-2', 'ring-red-500'); return }
  fTitle.classList.remove('ring-2', 'ring-red-500')

  const data: CalEvent = {
    id: editingId || nextId(),
    title: t,
    start: fStart.value || todayISO(),
    end: fEnd.value && fEnd.value >= fStart.value ? fEnd.value : undefined,
    time: fAllDay.checked ? undefined : (fTime.value || undefined),
    allDay: fAllDay.checked,
    color: (fColor.value as ColorKey),
    description: fDesc.value.trim() || undefined
  }

  if (editingId) {
    const i = events.findIndex(e => e.id === editingId)
    if (i >= 0) events[i] = data
  } else {
    events.push(data)
  }
  closeModal()
  render()
}

function deleteEvent() {
  if (!editingId) return
  events = events.filter(e => e.id !== editingId)
  closeModal()
  render()
}

export default function initCalendar() {
  grid = document.getElementById('calendar-grid')!
  title = document.getElementById('cal-title')!
  monthWrap = document.getElementById('cal-month')!
  listWrap = document.getElementById('cal-list')!
  filtersBox = document.getElementById('cal-filters')!
  upcomingBox = document.getElementById('cal-upcoming')!
  modal = document.getElementById('cal-modal')!
  modalPanel = document.getElementById('cal-modal-panel')!
  modalTitle = document.getElementById('cal-modal-title')!
  fId = document.getElementById('cal-ev-id') as HTMLInputElement
  fTitle = document.getElementById('cal-ev-title') as HTMLInputElement
  fStart = document.getElementById('cal-ev-start') as HTMLInputElement
  fEnd = document.getElementById('cal-ev-end') as HTMLInputElement
  fTime = document.getElementById('cal-ev-time') as HTMLInputElement
  fColor = document.getElementById('cal-ev-color') as HTMLSelectElement
  fAllDay = document.getElementById('cal-ev-allday') as HTMLInputElement
  fDesc = document.getElementById('cal-ev-desc') as HTMLTextAreaElement
  deleteBtn = document.getElementById('cal-delete')!

  if (!grid || !modal) return

  seed()
  renderFilters()
  render()

  // Navigation
  document.getElementById('cal-prev')?.addEventListener('click', () => { cursor.setMonth(cursor.getMonth() - 1); render() })
  document.getElementById('cal-next')?.addEventListener('click', () => { cursor.setMonth(cursor.getMonth() + 1); render() })
  document.getElementById('cal-today')?.addEventListener('click', () => { cursor = new Date(); render() })
  document.querySelectorAll<HTMLElement>('.cal-view-btn').forEach(b =>
    b.addEventListener('click', () => { view = (b.dataset.view as 'month' | 'list'); render() }))

  // Create button
  document.getElementById('cal-create')?.addEventListener('click', () => openModal('add', { start: todayISO() }))

  // Grid clicks: event pill → edit; "+more" → list view; empty cell → add
  grid.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const evBtn = target.closest('[data-event-id]') as HTMLElement | null
    if (evBtn) {
      const ev = events.find(x => x.id === evBtn.dataset.eventId)
      if (ev) openModal('edit', ev)
      return
    }
    if (target.closest('[data-more]')) { view = 'list'; render(); return }
    const cell = target.closest('[data-date]') as HTMLElement | null
    if (cell) openModal('add', { start: cell.dataset.date })
  })

  // Event clicks in list + upcoming
  const editFromList = (e: Event) => {
    const btn = (e.target as HTMLElement).closest('[data-event-id]') as HTMLElement | null
    if (!btn) return
    const ev = events.find(x => x.id === btn.dataset.eventId)
    if (ev) openModal('edit', ev)
  }
  listWrap.addEventListener('click', editFromList)
  upcomingBox.addEventListener('click', editFromList)

  // Category filters
  filtersBox.addEventListener('change', (e) => {
    const cb = e.target as HTMLInputElement
    const key = cb.dataset.filter as ColorKey
    if (!key) return
    if (cb.checked) hiddenColors.delete(key)
    else hiddenColors.add(key)
    render()
  })

  // All-day toggles the time field
  fAllDay.addEventListener('change', () => { fTime.disabled = fAllDay.checked; if (fAllDay.checked) fTime.value = '' })

  // Modal buttons
  document.getElementById('cal-save')?.addEventListener('click', saveEvent)
  deleteBtn.addEventListener('click', deleteEvent)
  document.querySelectorAll('[data-cal-close]').forEach(b => b.addEventListener('click', closeModal))
  document.getElementById('cal-form')?.addEventListener('submit', (e) => { e.preventDefault(); saveEvent() })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('pointer-events-none')) closeModal()
  })

  // Drag-to-create from the side panel
  document.querySelectorAll<HTMLElement>('.cal-ext-event').forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/plain', JSON.stringify({ title: chip.dataset.title, color: chip.dataset.color }))
      ;(e.dataTransfer as DataTransfer).effectAllowed = 'copy'
    })
  })
  grid.addEventListener('dragover', (e) => {
    const cell = (e.target as HTMLElement).closest('[data-date]')
    if (cell) { e.preventDefault(); cell.classList.add('ring-2', 'ring-inset', 'ring-blue-400') }
  })
  grid.addEventListener('dragleave', (e) => {
    (e.target as HTMLElement).closest('[data-date]')?.classList.remove('ring-2', 'ring-inset', 'ring-blue-400')
  })
  grid.addEventListener('drop', (e) => {
    const cell = (e.target as HTMLElement).closest('[data-date]') as HTMLElement | null
    if (!cell) return
    e.preventDefault()
    cell.classList.remove('ring-2', 'ring-inset', 'ring-blue-400')
    try {
      const { title: t, color } = JSON.parse(e.dataTransfer?.getData('text/plain') || '{}')
      if (!t) return
      events.push({ id: nextId(), title: t, start: cell.dataset.date!, allDay: true, color: (color as ColorKey) || 'blue' })
      const removeAfter = document.getElementById('cal-remove-after') as HTMLInputElement | null
      if (removeAfter?.checked) {
        document.querySelector(`.cal-ext-event[data-title="${t}"]`)?.remove()
      }
      render()
    } catch { /* ignore malformed payload */ }
  })
}
