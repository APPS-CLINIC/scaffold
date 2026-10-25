# ADR 0043 — List loading with a way back

- **Status:** Accepted
- **Date:** 2026-10-23
- **Refines:** [ADR 0041](0041-toasts-span-the-page-content.md)

## Context

Story 14826301 asks the customer list to show when it loads, especially when it loads
long. The rows on screen go and a loading view takes their place. A notice says the list
loads and offers a way back that depends on what started the load:

- a search goes back to the earlier list, with the typed text still in the field;
- a filter change goes back to the earlier list and opens the filters again with the
  user's choice;
- the first load sends the request again.

Until now the table dimmed the rows on screen while the next page loaded. It showed
placeholder rows only when it had no rows. Toasts took only text and closed themselves.

## Decision

- **Timing.** Common guidance is to show no indicator for waits under 200–500 ms, to keep
  one on screen for 400–1000 ms once shown, and to call out waits past 10 s, where
  attention wanders (Nielsen Norman Group).
  - For the first 300 ms nothing changes, so a quick answer swaps the rows without a
    flash.
  - Then the table shows placeholder rows for at least 500 ms, and a notice shows.
  - After 10 s the notice says the load takes longer than usual.
  - The first load shows placeholders at once, also for the data date, the filters and the
    search, because there is nothing to keep on screen.
- **`GenericDataTable`** shows placeholder rows whenever `loading`, also over rows on screen,
  and hides the paginator. It keeps its headers.
- **The cause comes from what the load changes** against the list on screen:
  - the filters;
  - else the search;
  - else anything else (page, sort, refresh, Back), which offers a plain "Cancel".
- **Calling a load off puts back the URL of the list on screen** (`replace`). RTK Query
  serves that list from its cache. A second subscription keeps it there while the next
  one loads, whatever the cache's 60 s.
- **A request number.** The list request carries an `attempt` number that is only in the
  cache key. "Refresh" and "Cancel and try again" raise it to send the same query again,
  because RTK Query does not send a second request for arguments already on their way.
- **Toasts** take any node as a message. They can stay on screen without a close button
  until the handle `show()` returns hides them; a handle hides only its own toast.
- **Shared pieces.** The timing is `useLoadingPhase` in `@/ui` and the cause is
  `listLoadCause` in `urlState`, so the next list reuses both. The way back, the labels and
  the kept list stay in the view, because each view goes back to its own controls.

## Consequences

- A slow search, filter change, page change or refresh no longer leaves stale rows on
  screen, and the user can always step back.
- Calling a load off does not stop the HTTP request: the hook does not expose it. Its
  answer lands in the cache unseen, and the service finishes its work anyway.
- A persistent toast passes the longest timeout a browser keeps (2^31 − 1 ms) to the IWA
  `Snackbar`, which hides a toast without a close button after `hideTimeoutMs`.
- The notice deviates from the mock-up in two places: the filters and the search become
  placeholders only on the first load, and the table keeps its headers.
- Check in the work repo which `Snackbar` type is dark, and that a persistent toast stays.

## Alternatives considered

- **Dim the rows on screen, as before.** The story asks for the rows to go.
- **Placeholders for the filters and the search on every load.** The user loses what they
  just typed or chose, and the field loses the cursor mid-typing.
- **Remember the cause at each action.** Back and Forward change the list without an
  action. Deriving the cause from the query covers them too.
- **Abort the request.** Aborting through RTK Query marks the query as failed. That would
  show the error state, and it would not stop the service either.
