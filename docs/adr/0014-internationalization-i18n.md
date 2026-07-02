# ADR 0014 — Internationalization (i18n)

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

The old BIKS **has no language versioning** — part of the interface is in
Polish, part in English. English-speaking people are joining the bank, so the
new BIKS **must have an EN/PL version**. The meeting made it explicit that the
i18n structure needs to be prepared **already at this phase**, because it affects
how components are built.

Distinction from the discussion:

- **Static UI** (column names, titles, labels) — keys kept **on the frontend**.
- **Backend data** — potentially arrives **already translated** (e.g. company
  names and banking data are not translated; descriptive fields like "facility"
  — to be considered on the backend side).

## Decision

We introduce an i18n layer from the start, on the **`react-i18next`** library
(on top of `i18next`):

- A `src/i18n` directory with the i18next config and translation files (`pl`,
  `en`); default language `pl`, `fallbackLng: 'pl'`. Components translate via
  `useTranslation()`.
- **Flat, dotted keys** (`keySeparator: false`), `{{var}}` interpolation. Key
  type-safety via the `src/i18n/i18next.d.ts` augmentation (a typo = a compile
  error).
- **Static UI text via keys** (no literals in components).
- For **backend data**, we assume the backend returns content in the user's
  language; the frontend does not translate domain data.

## Consequences

- Components use keys from the start, so adding EN requires no refactor.
- A contract with the backend must be settled: **which fields arrive
  translated**.
- A small overhead per label (a key instead of a literal) — accepted.

## Alternatives considered

- **A bespoke, hand-rolled i18n layer.** Reinventing — react-i18next does
  interpolation, plurals, language detection, and lazy-loading with proven code.
- **formatjs / @lingui.** Good alternatives; react-i18next chosen as the most
  popular in the React ecosystem.
- **i18n later.** Rejected — it would force rewriting every view (the "must be
  at this phase" decision).
- **Translating domain data on the frontend.** Costly and brittle; data is
  better translated at the source.
