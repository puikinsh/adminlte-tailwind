/**
 * AdminLTE Tailwind - Data tables
 *
 * Sortable / searchable / paginated tables powered by simple-datatables
 * (vanilla, no jQuery). Auto-initialises any `<table data-datatable>`.
 */
import { DataTable } from 'simple-datatables'
import 'simple-datatables/dist/style.css'

export default function initTables() {
  document.querySelectorAll<HTMLTableElement>('table[data-datatable]').forEach((el) => {
    new DataTable(el, {
      searchable: true,
      sortable: true,
      perPage: 10,
      perPageSelect: [5, 10, 25, 50],
      labels: {
        placeholder: 'Search...',
        perPage: 'entries per page',
        noRows: 'No entries found',
        info: 'Showing {start} to {end} of {rows} entries'
      }
    })
  })
}
