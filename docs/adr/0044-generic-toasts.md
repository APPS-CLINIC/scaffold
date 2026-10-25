# ADR 0044 — Generic toasts

- **Status:** Accepted
- **Date:** 2026-10-25
- **Refines:** [ADR 0041](0041-toasts-span-the-page-content.md),
  [ADR 0043](0043-list-loading-with-a-way-back.md)

## Context

Story 13889954 asks for one notification layer the whole app uses:

- a default place, and chosen notices shown in a given area of the app;
- a link to an action in the app or to a page outside it;
- an icon before the text, and a red cross for errors;
- a notice that changes once it is open, e.g. the Excel "download started" notice that
  turns into a success or an error.

The toasts so far took a message and could stay on screen until their handle hid them
(ADR 0043). Every toast is the same dark bar of the mock-ups, so a toast has no type. The
customer list drew its own spinner and link inside the message, and a second toast simply
replaced the first.

## Decision

- **A toast is a message with an optional `icon`, `action`, `area` and `persistent`.** The
  provider draws one row: the icon, the text, and the action. The bar is the same for every
  toast.
- **Errors carry `ToastErrorIcon`,** the red cross, before their text. The bar does not
  change colour.
- **An action is drawn by us,** underlined in the text's colour: a button for an action in
  the app, a router link for a route, and a link to a new tab for a page outside the app.
  The library's snackbar link only takes a URL, which reloads the page for a route.
- **Open toasts stack.** The newest is on screen. `show()` drops the toasts it covers unless
  they are persistent; a persistent toast comes back once the toasts over it go.
- **`update()` replaces a toast where it is.** On top, the change shows at once; covered, it
  shows once the toasts over it go. The list loading notice changes its text this way
  without covering a toast shown meanwhile, and a download that ends during a load shows
  its result after the load.
- **`area` names the element a toast spans,** instead of the page content, while that
  element is on screen.

## Consequences

- The customer list's loading notice and the Excel export use the same toast parts; no
  feature draws a spinner or a link inside a message any more.
- The export notice stays on screen without a close button until the file is saved or the
  download fails, and then offers a close button.
- A toast that is not persistent and gets covered by a new toast is lost, as before.
- Still to check in the work repo: that the IWA `Snackbar` draws no icon of its own next to
  ours, and that `default` is the dark bar.

## Alternatives considered

- **The library's `link` prop.** It takes only a URL and would reload the page for a route.
- **A colour or type per toast.** The design keeps one bar for every toast; the red cross
  marks an error.
- **`update()` brings the toast on top.** The loading notice changes its text several times
  during one load, and each change would cover, and drop, a toast shown meanwhile.
