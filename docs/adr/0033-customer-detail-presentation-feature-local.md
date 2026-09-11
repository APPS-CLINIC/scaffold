# ADR 0033 — Customer detail presentation is feature-local

- **Status:** Accepted
- **Date:** 2026-09-03
- **Refines:** ADR 0013

## Context

The customer summary panel and the two detail tabs were presented through
generic `@/ui` layers — `DataPanel<T>` (typed `fields` config, `column`/
`valueOnly`/`renderValue`), `DataPanelSkeleton` (a parallel invisible-label
geometry mirror), and `KeyValueSections` — driven by a 521-line
`customerDetails.sections.tsx` with a `format` discriminator re-narrowed by
`typeof` at render time. Every one of these layers has exactly one consumer:
the customer detail screens. The `format` discriminator was also unsound —
a boolean field configured with `format: 'date'` compiled and silently
rendered a dash instead of Yes/No.

Both `DataPanel` and `KeyValueSections` pass raw `<span>` elements into the
IWA `DefinitionList`'s text parts. The real IWA `DefinitionList` types
`body.text` as `string` (fixed as a TS2322 in the work-repo review, commit
`f53809d`; `src/ui/GenericDataTable/components/ExpandedRowContent.tsx`
already hand-rolls a `<dl>` for the same reason). Both components would fail
to compile against the real library, not just the local stub.

ADR 0013 established `@/ui` as re-exports and thin wrappers around IWA
components, "not generic stubs," and `ui.instructions.md` requires an
explicit request before adding a domain-shaped seam primitive. The user's
request to simplify this to the maximum and make it "deliberately
non-generic" is that explicit request.

## Decision

Customer detail presentation lives in
`src/features/customers/customerDetails/`, as plain JSX composed directly
over IWA `Card`, `Status`, `Skeleton`, and `useCustomIcon` — all imported
through `@/ui`, never `iwa-react-components` directly.

The one shared piece is `CustomerField`, a feature-local row that
hand-rolls a semantic `<dl>/<dt>/<dd>` (Tailwind classes only) instead of
using IWA `DefinitionList`, because the real component's `string`-typed text
parts cannot carry the row's `<time>` element and inline `Status` badge, and
its fixed term column cannot express both the panel's compact geometry and
the tabs' fixed-label geometry without mutating vendor DOM. This is the same
shape already accepted in `ExpandedRowContent.tsx`.

Field lists are typed local row tables — `{ labelKey: MessageKey, value:
CustomerFieldValue }`, where `CustomerFieldValue = string | ReactElement |
null | undefined` — instead of the deleted `format` discriminator. A raw
`boolean | null` value is a `tsc` error at the row's construction site, not
a runtime dash; a typo in `labelKey` fails against `MessageKey` in both
locale catalogs. `DataPanel*` and `KeyValueSections*` are deleted and leave
the `@/ui` public seam entirely; no generic renderer is added to replace
them for a single consumer.

## Consequences

- `src/ui/DataPanel/` (5 source files, 2 tests) and `src/ui/KeyValueSections/`
  (2 source files, 1 test) are deleted; their exports are removed from
  `src/ui/index.ts`; `src/ui/README.md` loses the "DataPanel and
  DataPanelSkeleton" and "KeyValueSections" sections.
- The customer screens compile against the real IWA library's typed
  contract: no `ReactNode` into `DefinitionList` text, no `Skeleton`
  `className` (the real component has none — `ValueSkeleton` wraps it in a
  `<span>` that owns size and radius instead).
- Typed row tables satisfy the underlying "no hardcoded JSX field list"
  intent (`customerSummaryPanelFields.ts`, status unconfirmed before this
  change) at zero cost — the tables remain, only the generic renderer
  underneath them is gone.
- A future second consumer of definition-style rows outside
  `customerDetails/` does not get `CustomerField` promoted into `@/ui`
  automatically; that requires its own ADR, matching ADR 0013's "not
  generic stubs" stance and `ui.instructions.md`'s explicit-request rule.

## Alternatives considered

- **Keep `DataPanel`/`KeyValueSections`, fix the `DefinitionList` typing
  locally.** Rejected: the components would still be config machinery
  (`renderValue`, `valueSize`, `column: 'summary' | 1 | 2`) built for one
  consumer's irregular layout, most of it unused.
- **Move `DataPanel`/`KeyValueSections` into the feature unchanged.**
  Rejected: keeps the `format` discriminator's unsoundness and the
  `DefinitionList` incompatibility with the real library; only the location
  would change.
- **A generic `<CustomerFieldValue<T>>` renderer.** Rejected by the user's
  own framing of the task ("deliberately non-generic") and by KISS — one
  screen shape does not need a type parameter.
