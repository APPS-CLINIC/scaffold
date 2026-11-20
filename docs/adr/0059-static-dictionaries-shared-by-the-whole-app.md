# ADR 0059 — Static dictionaries shared by the whole app

- **Status:** Accepted
- **Date:** 2026-11-20
- **Refines:** [ADR 0040](0040-filter-options-from-the-service.md)

## Context

ADR 0040 loaded the static dictionaries (customer status, customer type, TS
price condition status) inside the customers feature, for the filters only.
The table cells and the customer details kept their own labels: the status was
translated in the frontend, and the type and the TS status showed the raw value
of the response. One value could therefore read differently in a filter and in
the row beside it, and no other feature could use the dictionaries.

Story 14454610 asks for the same label everywhere, with the dictionaries loaded
once for the whole app when it opens, without holding the screen back.

The service is unchanged: `GET /api/dictionaries` returns every dictionary in
one answer, labelled in the language of `Accept-Language`.

The customer responses do not all carry codes:

- The list sends the TS status as a number from 1 to 3. The details send its
  code, or the same number.
- The test data has the customer type as a label ("Bank Inwestycyjny"), not as
  a code (`INVESTMENT_BANK`). What the service really sends is not confirmed.

## Decision

- `src/features/dictionaries/` owns the request and its cache. The request
  keeps the rules of ADR 0040: one cache entry per language, a second request
  in Polish after a 400, and an hour in the cache.
- Features read a dictionary by its name: `useDictionary(name)` returns its
  entries, a `labelOf(code)` lookup, and the `loading` and `failed` states. How
  the dictionaries are fetched stays inside the module.
- `RootLayout` calls `usePreloadDictionaries()`, so the request starts when the
  app opens and nothing waits for it. The shell keeps that subscription, so the
  dictionaries stay cached for the whole session. A language change loads the
  labels of the new language.
- The customer views take their labels from the dictionaries: the status, type
  and TS status cells of the list, the status in the summary panel, the type in
  General data and the TS status in Review dates. The filters keep working as
  before, now through the same hook.
- Only the value that needs a dictionary waits for it, with a placeholder. The
  rest of the row or tab shows as soon as its own data arrives.
- A value the dictionary does not know is shown as the service sent it. So is
  every value when the dictionaries could not be loaded; the status then keeps
  its built-in translation. A view opened after a failed load asks again.
- `ActiveArchivalStatusCell` stays in `@/ui` and takes optional `labels`. The
  customers feature passes the dictionary's labels; `@/ui` still never fetches.
- The adapters turn the TS status number into its code, so the views and the
  filter share one vocabulary. Number _n_ is the _n_-th entry of
  `TS_PRICE_CONDITION_STATUSES`. This follows the dictionary labels, which
  start with "1 -" and "3 -"; the service has not confirmed it.

## Consequences

- A new dictionary is one name in `STATIC_DICTIONARIES` and a `useDictionary`
  call where its labels are shown.
- Opening the app sends one more request of a few kilobytes, also on pages
  that show no dictionary value.
- A customer type that arrives as a label stays as sent and does not change
  with the language. The same labels everywhere need the service to send the
  code in the list and in the details.
- If the service numbers the TS statuses differently, the list shows the wrong
  label. The adapter test states the assumed order.
- The built-in status translations stay: they are the fallback here and the
  labels of the Facilities status.

## Alternatives considered

- **Load a dictionary only when a view first needs it.** Rejected: the story
  asks for loading at entry, and the first table would open with placeholders
  in three columns.
- **Hold the whole tab until the dictionaries arrive.** Rejected: a slow
  dictionary request would hide data that is already there.
- **Map the TS status number in the cell.** Rejected: the details view would
  need the same mapping, and the adapters already own the response vocabulary.
- **One request per dictionary.** Not possible today: the service has one
  endpoint for all of them. The hook is asked by name, so this can change
  without touching the views.
