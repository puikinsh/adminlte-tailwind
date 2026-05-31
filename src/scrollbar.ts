/**
 * AdminLTE Tailwind - Custom sidebar scrollbar
 *
 * Replaces the native sidebar scrollbar with a thin auto-hiding OverlayScrollbars
 * one (light theme, since the sidebar is dark), matching the original AdminLTE.
 */
import { OverlayScrollbars } from 'overlayscrollbars'
import 'overlayscrollbars/styles/overlayscrollbars.css'

export default function initScrollbars() {
  document.querySelectorAll<HTMLElement>('.sidebar-menu').forEach((el) => {
    // Hand scrolling over to OverlayScrollbars (drop the native overflow).
    el.classList.remove('overflow-y-auto')
    OverlayScrollbars(el, {
      scrollbars: {
        theme: 'os-theme-light',
        autoHide: 'leave',
        autoHideDelay: 300,
      },
    })
  })
}
