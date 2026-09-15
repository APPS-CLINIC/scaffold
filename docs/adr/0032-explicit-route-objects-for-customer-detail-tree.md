# ADR 0032 — Explicit route objects for the customer detail tree

- **Status:** Accepted
- **Date:** 2026-09-03
- **Refines:** ADR 0027, ADR 0030 — customer context tree only

## Context

The `/customers/:id/*` tree was generated from the navigation manifest: a
runtime lookup re-derived the customer context, two import-time `throw`s
guarded a missing context or default item, an eight-key loader map paired
every manifest item ID with a lazy page, and a conditional type (plus three
helpers) made that map exhaustive against the manifest's item IDs. The
customer tree has exactly one consumer of that machinery and a fixed shape
(seven L2 items, one nested L3 pair, six of eight destinations still
placeholders). A typo in a manifest item threw at import time instead of
failing a readable test, and the generation code was harder to read than the
seven-item tree it produced.

## Decision

`customersDetailRoutes` in `customers.pageRoutes.tsx` is a **hand-written
literal** `readonly RouteObject[]`, not derived from the manifest at build or
run time. Its static segments are written out literally (`general-data`,
`cdd-crs-fatca`, `reviews`, `reviews/details`, `monitoring`, `limits`,
`products`, plus `dashboard/*` outside the summary layout) and must equal
the manifest's customer-context segments, because `resolveNavigation`
derives sidebar, breadcrumb, and URL-mirror state from the pathname against
those segments alone, never from the route tree.

A co-located test enforces that equality plus the index redirect and casing:
it flattens the manifest's context items and the route literal's paths and
asserts they match, asserts the index route's redirect target equals the
manifest's default item path, and asserts every non-wildcard route sets
`caseSensitive: true`. A drifted segment, a missing route, or a forgotten
`caseSensitive` fails this test instead of compiling silently or throwing at
import time.

The six unimplemented destinations are inline `<SectionPage titleKey .../>`
elements directly in the literal, not separate placeholder page files behind
their own lazy chunk — a five-line file that only wraps `SectionPage` is not
a code-split boundary. `lazy` boundaries exist only where a real page module
exists: the two layouts and the two implemented tabs.

`router.tsx`'s per-section route spread collapses to
`...getSectionDetailRoutes(section.id)`. Today that spread is the code path
that injects `caseSensitive: true` into every generated detail route; after
this change the hand-written literal is the _only_ source of that flag,
which is why the drift test asserts it on every route explicitly.

## Consequences

- One file describes the whole customer route tree in the order it renders.
- Removed: the manifest re-lookup and its two import-time `throw`s, the
  eight-key loader map and its guard, both `buildNavigationItemRoutes` calls
  in the customer tree, route `id`s (no production code read them), and from
  `pageRoutes.types.ts` the four conditional types the map needed.
  `SectionDetailRoutes` becomes `readonly RouteObject[]`.
- Manifest/route drift is now a **test-time** guarantee, not a compile-time
  one: a missing or misspelled route fails `customers.pageRoutes.test.tsx`
  instead of `tsc`. Accepted for a tree this size, with that test as a gate.
- Adding a context destination is now: one manifest item, both i18n keys,
  one route object next to its siblings in the literal (inline `SectionPage`
  until a real page exists). One test fails if either half is missing.
- `pageRouteRegistry.ts`, `SectionPageRoutes<TKey>`, and the `all-customers`
  lazy mapping are untouched — ADR 0027's registry and section-scoped
  modules still compose every _implemented navigation destination_; this
  ADR only replaces the customer-context tree's _generation_, which ADR
  0027 already anticipated ("entity detail routes remain explicit React
  Router route objects"). ADR 0030's manifest, resolver, and
  sidebar/breadcrumb contract are unchanged; its "one shared recursive route
  builder" claim now applies to section trees only.

## Alternatives considered

- **Delete `pageRouteRegistry.ts` / `pageRoutes.types.ts`, move maps into
  `router.tsx`.** Exceeds this task's scope and is the exact alternative
  ADR 0027 rejected (domain knowledge accumulating in the root router).
- **Keep the runtime manifest lookup and import-time throws.** A typo in a
  manifest item fails the whole application at import time instead of one
  readable test.
- **Mark ADR 0027/0030 "Accepted (amended by ADR-0032)."** Not a legend
  status (`docs/adr/README.md`); this ADR refines them in its body line
  instead, and both stay `Accepted` and unedited.
- **Supersede ADR 0027 wholesale.** Would misstate that section-scoped
  page-route modules and the registry are gone — they are not; only the
  customer context's generated tree is replaced.
