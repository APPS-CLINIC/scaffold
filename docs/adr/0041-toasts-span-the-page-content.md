# ADR 0041 — Toasts span the page content

- **Status:** Accepted
- **Date:** 2026-10-12
- **Refines:** [ADR 0013](0013-iwa-components-primereact.md)

## Context

ADR 0013 put a toast primitive in the `@/ui` seam. Until now it was a
placeholder: `ToastProvider` at the app root drew its own list of toasts in
the bottom-right corner, and nothing used it. The work repo has no toast host
at all.

The design shows every toast in the context of the page content: a bar at the
bottom, as wide as the content next to the side menu, never across the whole
window. The first toast is the customer list's download notice.

The IWA `Snackbar` is controlled (`visibility`, `onHide`) and needs no
provider, but the library draws it over the page, not where it sits in the
markup. A `w-full` snackbar therefore spans the whole window.

## Decision

- `ToastProvider` wraps the routed content inside `<main>` in `RootLayout`,
  not the whole app. Features call `useToast().show({ type, message })` and
  never render a snackbar themselves; `hide()` closes the toast on screen.
- The provider shows one toast at a time as the IWA `Snackbar`. A new toast
  takes the place of the one on screen.
- While a toast shows, the provider measures the content it wraps through an
  empty block after it, keeps the content's left edge and width in CSS
  variables on the page root, and pins the snackbar to the bottom of the
  screen across them (`!fixed`, `!left-[var(…)]`, `!w-[var(…)]`).

## Consequences

- Every toast lines up with the page content, whatever the page.
- Components outside the content, such as the top bar and the side menu, have
  no toast host; `useToast` throws there.
- `renderWithProviders` puts every test inside the toast host, as every
  routed view is. The host adds only an empty block after the content, so a
  test's markup keeps its shape. A test that mocks the `@/ui` barrel adds
  `Snackbar` to the mock.
- The work repo adds the three `src/ui/toast` files and wraps its routed
  content with the provider.
- If the library draws the snackbar with its own transform or offsets, the
  pinning classes may need adjusting there.

## Alternatives considered

- **Render the snackbar in each view, measured by the view.** Worked for one
  view, but every view with a toast would repeat the state, the measuring and
  the classes.
- **A provider at the app root.** Toasts would have nothing to line up with
  but the window.
- **An in-flow notice of our own under the content.** Spans the content
  without measuring, but leaves the IWA component and its look.
