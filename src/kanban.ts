/**
 * AdminLTE Tailwind — Kanban board interactions (preview only, no persistence).
 *
 * Adds HTML5 drag-and-drop: reorder cards within a column and move them between
 * columns, with live column counts and a working "Add Task" button. State is in
 * the DOM only and resets on reload — this is a template demo.
 */

let dragged: HTMLElement | null = null

function columns(board: HTMLElement): HTMLElement[] {
  return Array.from(board.children) as HTMLElement[]
}

function listOf(column: HTMLElement): HTMLElement | null {
  return column.querySelector('.space-y-3')
}

function cardsOf(list: HTMLElement): HTMLElement[] {
  return Array.from(list.querySelectorAll(':scope > .card')) as HTMLElement[]
}

function addButtonOf(list: HTMLElement): HTMLElement | null {
  return list.querySelector(':scope > button')
}

function updateCounts(board: HTMLElement) {
  columns(board).forEach((col) => {
    const list = listOf(col)
    const badge = col.querySelector('.badge')
    if (list && badge) badge.textContent = String(cardsOf(list).length)
  })
}

// Find the card that should come *after* the drop point for a given cursor Y.
function cardAfter(list: HTMLElement, y: number): HTMLElement | null {
  const cards = cardsOf(list).filter((c) => c !== dragged)
  let closest: { offset: number; el: HTMLElement | null } = { offset: -Infinity, el: null }
  for (const card of cards) {
    const box = card.getBoundingClientRect()
    const offset = y - box.top - box.height / 2
    if (offset < 0 && offset > closest.offset) closest = { offset, el: card }
  }
  return closest.el
}

function highlightColumn(board: HTMLElement, active: HTMLElement | null) {
  columns(board).forEach((col) => {
    const box = col.firstElementChild as HTMLElement | null
    box?.classList.toggle('ring-2', box === active)
    box?.classList.toggle('ring-blue-400', box === active)
    box?.classList.toggle('ring-inset', box === active)
  })
}

function makeDraggable(card: HTMLElement, board: HTMLElement) {
  card.setAttribute('draggable', 'true')
  card.addEventListener('dragstart', () => {
    dragged = card
    // defer so the drag image is the opaque card, then dim the source
    setTimeout(() => card.classList.add('opacity-40'), 0)
  })
  card.addEventListener('dragend', () => {
    card.classList.remove('opacity-40')
    dragged = null
    highlightColumn(board, null)
    updateCounts(board)
  })
}

function wireList(list: HTMLElement, board: HTMLElement) {
  const colBox = list.closest('.flex-shrink-0')?.firstElementChild as HTMLElement | null
  list.addEventListener('dragover', (e) => {
    if (!dragged) return
    e.preventDefault()
    highlightColumn(board, colBox)
    const after = cardAfter(list, (e as DragEvent).clientY)
    if (after) list.insertBefore(dragged, after)
    else list.insertBefore(dragged, addButtonOf(list)) // before the "Add Task" button
  })
}

function createCard(): HTMLElement {
  const card = document.createElement('div')
  card.className = 'card cursor-move'
  card.innerHTML =
    '<div class="card-body p-4">' +
    '<div class="flex items-start justify-between mb-2">' +
    '<span class="badge badge-secondary">Task</span>' +
    '</div>' +
    '<h6 class="font-medium text-gray-800 outline-none" contenteditable="true">New task</h6>' +
    '</div>'
  return card
}

function selectAll(el: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function wireAddButton(list: HTMLElement, board: HTMLElement) {
  const btn = addButtonOf(list)
  btn?.addEventListener('click', () => {
    const card = createCard()
    list.insertBefore(card, btn)
    makeDraggable(card, board)
    updateCounts(board)

    const title = card.querySelector('h6') as HTMLElement
    title.focus()
    selectAll(title)
    const finish = () => {
      if (!title.textContent || !title.textContent.trim()) {
        card.remove()
        updateCounts(board)
      }
    }
    title.addEventListener('blur', finish)
    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        title.blur()
      }
      if (e.key === 'Escape') {
        title.textContent = ''
        title.blur()
      }
    })
  })
}

export default function initKanban() {
  const board = document.getElementById('kanban-board')
  if (!board) return

  columns(board).forEach((col) => {
    const list = listOf(col)
    if (!list) return
    cardsOf(list).forEach((card) => makeDraggable(card, board))
    wireList(list, board)
    wireAddButton(list, board)
  })

  updateCounts(board)
}
