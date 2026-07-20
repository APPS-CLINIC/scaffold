# ADR 0014 — Internationalization (i18n)

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

The legacy BIX **has no language versioning** — part of the interface is in Polish, part
in English. English-speaking staff are joining the bank, so the new BIX
**is to ship with EN/PL versions**. It was stated explicitly in the meeting that the i18n structure must be
prepared **in this phase already**, because it affects how components are built.

A distinction from the discussion:

- **Static UI** (column names, titles, labels) — keys kept **on the
  frontend**.
- **Backend data** — potentially arrives **already translated**
  (e.g. company names and banking data are not subject to translation; descriptive
  labels like "facility" — to be considered on the backend side).

## Decision

We introduce an i18n layer from the start, based on **`react-i18next`** (on top of
`i18next`):

- A `src/i18n` directory with the i18next configuration and translation files (`pl`, `en`);
  default language `pl`, `fallbackLng: 'pl'`. Components translate via
  `useTranslation()`.
- **Flat, dot-separated keys** (`keySeparator: false`), `{{var}}` interpolation.
  Key type-safety via the `src/i18n/i18next.d.ts` augmentation (a typo =
  a compile error).
- **Static UI text goes through keys** (no literals in components).
- For **backend data** we assume the backend returns content in the user's
  language; the frontend does not translate domain data.

## Consequences

- Components use keys from the start, so adding EN requires no refactor.
- A contract with the backend must be agreed: **which fields arrive translated**.
- A small overhead per label (a key instead of a literal) — accepted.

## Alternatives considered

- **A custom, hand-rolled i18n layer.** Reinventing the wheel — react-i18next does
  interpolation, pluralization, language detection, and lazy loading with proven code.
- **formatjs / @lingui.** Good alternatives; react-i18next chosen as the
  most popular in the React ecosystem.
- **i18n later.** Rejected — it would force rewriting all views
  (the "must happen in this phase" decision).
- **Translating domain data on the frontend.** Costly and brittle; data is better
  translated at the source.
