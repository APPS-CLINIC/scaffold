---
description: 'TypeScript/React conventions for application source code'
applyTo: 'src/**/*.{ts,tsx}'
---

# TypeScript & React conventions

- **English only** in code: identifiers, comments, JSDoc and test
  descriptions. Polish copy belongs exclusively in
  `src/i18n/messages/pl.ts`.
- TypeScript is strict with `verbatimModuleSyntax`: use `import type { ... }`
  for type-only imports, never mix types into value imports.
- `noUncheckedIndexedAccess` is on: indexed access yields `T | undefined` —
  narrow before use, do not use non-null assertions (`!`).
- Import application code via the `@/` alias (`@/ui`, `@/app/hooks`), not
  relative paths that climb directories (`../../`).
- Use the typed store hooks `useAppSelector` / `useAppDispatch` from
  `@/app/hooks` — never raw `useSelector` / `useDispatch`.
- Server data goes through RTK Query: inject endpoints onto the existing
  `baseApi` (`src/api/baseApi.ts`) with `injectEndpoints`. Never create a
  second `createApi`.
- List/view state (search, sort, pagination) lives in the URL. Read it with
  `selectListQuery` or `useListQueryState`; write it only through
  `setQuery` from `useListQueryState`. Never dispatch to the `urlState`
  slice directly and never sync store → URL.
- `page` in list queries is 1-based (minimum 1). Convert to 0-based only in
  the API-client layer if a backend requires it.
- When extending `listQuerySchema`, give every new field a `.catch()` default
  so URL parsing stays total (a malformed URL must never crash the app).
- User-facing strings go through i18next (`useTranslation`), with messages
  added to both `src/i18n/messages/pl.ts` and `en.ts`. No hardcoded copy.
- Functional components only; prefer named exports; keep components
  presentation-focused and push data wiring into hooks/selectors.
