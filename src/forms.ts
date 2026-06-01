/**
 * AdminLTE Tailwind - Form validation & wizard
 *
 * Lightweight vanilla helpers:
 *  - `form[data-validate]`  → live HTML5 validation with valid/invalid states.
 *  - `[data-wizard]`        → multi-step form with a stepper and prev/next nav.
 */

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

function validateField(field: Field): boolean {
  const valid = field.checkValidity()
  const isToggle =
    field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')
  field.classList.toggle('is-invalid', !valid)
  field.classList.toggle('is-valid', valid && !isToggle && field.value.trim() !== '')
  const feedback = field.closest('div')?.querySelector<HTMLElement>('.invalid-feedback')
  feedback?.classList.toggle('hidden', valid)
  return valid
}

function initValidation() {
  document.querySelectorAll<HTMLFormElement>('form[data-validate]').forEach((form) => {
    const fields = Array.from(form.querySelectorAll<Field>('input, textarea, select'))

    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field))
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) validateField(field)
      })
    })

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const ok = fields.map(validateField).every(Boolean)
      const success = form.querySelector<HTMLElement>('[data-validate-success]')
      if (ok) {
        success?.classList.remove('hidden')
        form.reset()
        fields.forEach((f) => f.classList.remove('is-valid', 'is-invalid'))
      } else {
        success?.classList.add('hidden')
        form.querySelector<HTMLElement>('.is-invalid')?.focus()
      }
    })
  })
}

function initWizard() {
  document.querySelectorAll<HTMLElement>('[data-wizard]').forEach((wiz) => {
    const steps = Array.from(wiz.querySelectorAll<HTMLElement>('[data-wizard-step]'))
    const dots = Array.from(wiz.querySelectorAll<HTMLElement>('[data-wizard-dot]'))
    const prev = wiz.querySelector<HTMLButtonElement>('[data-wizard-prev]')
    const next = wiz.querySelector<HTMLButtonElement>('[data-wizard-next]')
    const submit = wiz.querySelector<HTMLButtonElement>('[data-wizard-submit]')
    const done = wiz.querySelector<HTMLElement>('[data-wizard-done]')
    if (!steps.length) return
    let current = 0

    const render = () => {
      steps.forEach((s, i) => s.classList.toggle('hidden', i !== current))
      dots.forEach((d, i) => d.classList.toggle('wizard-dot-active', i <= current))
      prev?.classList.toggle('invisible', current === 0)
      next?.classList.toggle('hidden', current === steps.length - 1)
      submit?.classList.toggle('hidden', current !== steps.length - 1)
    }

    next?.addEventListener('click', () => {
      if (current < steps.length - 1) {
        current++
        render()
      }
    })
    prev?.addEventListener('click', () => {
      if (current > 0) {
        current--
        render()
      }
    })
    submit?.addEventListener('click', () => done?.classList.remove('hidden'))

    render()
  })
}

export default function initForms() {
  initValidation()
  initWizard()
}
