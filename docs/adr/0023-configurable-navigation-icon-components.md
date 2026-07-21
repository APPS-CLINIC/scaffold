# ADR 0023 — Configurable and persistent contextual navigation

- **Status:** Accepted
- **Date:** 2026-07-21
- **Supersedes:** [ADR 0022](0022-typed-navigation-manifest.md)

## Context

[ADR 0022](0022-typed-navigation-manifest.md) introduced a typed static
frontend manifest for primary and contextual navigation. It used a closed
`iconKey` union and a central registry to resolve those keys to IWA icons.

That indirection makes basic configuration unnecessarily expensive: choosing a
new icon requires changing both the registry type and the menu declaration. It
also limits configuration to the small set of keys already registered.

The manifest is TypeScript source code, not runtime JSON. It can therefore hold
a typed React component reference without serializing React elements or
exposing rendering internals to a backend contract.

## Decision

We retain the static typed manifest, stable navigation IDs, derived paths,
URL-driven selection, default redirects, and the IWA `MenuListAdapter` from
ADR 0022, with the following refinements:

- A contextual item must declare `icon: NavigationIconComponent` directly.
- `NavigationIconComponent` accepts any component that supports a `className`
  prop, including icons exported by `ing-react-icons`.
- The shared `NavigationIcon` presentation wrapper applies consistent size,
  color, and decorative semantics to the configured component.
- The manifest chooses the icon at the item declaration. Adding another icon
  does not require extending a union or editing a central switch statement.
- This remains source configuration. We still do not serialize React nodes,
  component functions, `key`, `ref`, or `props` into JSON.
- Every route rendered inside the application shell keeps the contextual
  sidebar. A section with no dedicated items receives one shared, configurable
  `defaultNavigationItem` that links to the section root.
- The IWA collapse action is placed in the panel header, before its title,
  rather than in the footer.
- Expanded mode shows item labels. Collapsed mode renders an icon-only rail;
  icons keep accessible labels even when their visible text is absent.

## Consequences

- A developer can import any available IWA icon and assign it to one menu item
  in the same configuration change.
- Requiring an icon prevents blank destinations in the collapsed rail.
- Item configuration is more explicit and easier to scan.
- The manifest now has a compile-time dependency on the icon component type,
  which is acceptable for static frontend configuration.
- Consistent visual treatment remains centralized in `NavigationIcon` even
  though icon selection is decentralized.
- Empty sections retain a consistent shell and can later replace the shared
  overview entry with dedicated items without changing the sidebar component.
- A future backend-delivered menu would need a separate serializable icon-name
  contract and allow-listed resolver; component references cannot cross a JSON
  boundary.

## Alternatives considered

- **Keep the closed `iconKey` registry.** Rejected because every new choice
  requires edits outside the item declaration and the available set is
  artificially limited.
- **Store a ready-made React element in configuration.** Flexible, but a
  component reference is easier to type and lets the presentation wrapper apply
  consistent props.
- **Accept arbitrary icon strings.** Useful for a backend contract, but weaker
  for the current static TypeScript scope and still requires a runtime resolver.
- **Render icons directly without `NavigationIcon`.** Rejected because sizing,
  color, and decorative accessibility semantics would be duplicated.
- **Omit the sidebar for empty sections.** Rejected because the application
  shell would change structure between top-level URLs and leave no stable
  collapsed rail.
- **Keep the collapse action in the footer.** Rejected because the supplied
  navigation reference locates this primary layout control in the panel header.
