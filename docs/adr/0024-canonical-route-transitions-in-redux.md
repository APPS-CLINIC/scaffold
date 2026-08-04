# ADR 0024 — Canonical route transitions in the Redux URL mirror

- **Status:** Accepted
- **Date:** 2026-07-21

## Context

[ADR 0006](0006-url-as-single-source-of-truth.md) established a one-way URL to
Redux mirror, and [ADR 0023](0023-configurable-navigation-icon-components.md)
made contextual navigation URL-driven. The first navigation implementation
mirrored only the active top-level tab into Redux.

That representation cannot distinguish different content inside one section.
For example, `/clients/all`, `/clients/advisors`, and
`/clients/all/123/documents` all resolve to the `clients` top tab. Consumers of
listener middleware therefore receive no Redux action for many real route
transitions, even though React Router correctly renders different content.

Mirroring only the sidebar item is also insufficient because multiple deeper
entity URLs can belong to the same item.

## Decision

The `urlState` slice keeps one canonical, serializable route snapshot:

```ts
interface UrlRouteState {
  pathname: string;
  sectionKey: NavigationSectionKey;
  itemId: string | null;
}
```

- `UrlStateSync` is the only writer. A component changes the URL through React
  Router and never dispatches navigation state directly.
- Every distinct pathname produces one `urlState/routeChanged` action.
- The complete pathname is retained so deeper entity routes remain distinct
  even when they share a section and contextual menu item.
- Section and item IDs are parsed from the typed navigation manifest and added
  to the payload for semantic selectors, listeners, analytics, and prefetching.
- The active top tab, active contextual item ID, and pathname are selectors
  derived from `urlState.route`; they are not stored as parallel fields.
- The equality guard suppresses dispatch when the pathname and derived route
  identity are unchanged.
- Search parameters keep their feature-specific actions, such as
  `listQueryChanged`. `routeChanged` represents content-path transitions, not
  every filter or pagination update.

React Router remains the rendering authority and the URL remains the source of
truth. Redux is an observable read-only mirror for cross-feature reactions.

## Consequences

- Every shallow or deep content-path transition becomes visible in Redux
  DevTools and to listener middleware.
- Direct links and browser back/forward navigation use the same action path as
  clicks in the top or contextual menus.
- Components cannot accidentally create competing URL and Redux navigation
  state.
- Listener payloads contain stable semantic IDs plus the exact pathname needed
  to distinguish entity-level content.
- Clicking or replacing the exact same pathname does not emit a redundant
  action. An explicit refresh remains a separate event.
- Query-only changes continue to use typed, validated query actions and do not
  create a second generic navigation action.

## Alternatives considered

- **Dispatch from the sidebar click handler.** Rejected because it misses top
  navigation, programmatic routing, redirects, direct links, and browser
  history.
- **Mirror only `activeItemId`.** Rejected because multiple deeper URLs can
  share one contextual item while rendering different content.
- **Store the complete React Router location object.** Rejected because router
  state may contain arbitrary non-serializable application values and leaks a
  vendor contract into the store.
- **Dispatch on every render without an equality guard.** Rejected because it
  creates duplicate analytics, prefetching, and rendering work.
- **Put query strings into `routeChanged`.** Rejected because feature-specific
  Zod schemas and actions already provide stronger typed semantics for queryable
  view state.
