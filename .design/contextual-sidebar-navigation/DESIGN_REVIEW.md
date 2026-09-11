# Design Review: Customer Summary and Contextual Navigation

Reviewed against: `DESIGN_BRIEF.md`, `INFORMATION_ARCHITECTURE.md`, the customer-detail task, the supplied Figma reference, and ADR 0030
Philosophy: Calm, functional banking workspace with contextual disclosure
Date: 2026-09-02

The original brief predates the customer-detail requirement and describes only
flat section menus. The recursive customer tree reviewed here is an intentional
extension required by the accepted task and ADR 0030; it is not treated as an
unplanned accordion-navigation deviation.

## Screenshots Captured

| Screenshot                                                       | Breakpoint         | Description                                     |
| ---------------------------------------------------------------- | ------------------ | ----------------------------------------------- |
| `screenshots/review-customers-list-desktop-1280.png`             | Desktop (1280×800) | Global Customers list and sidebar               |
| `screenshots/review-customers-list-tablet-768.png`               | Tablet (768×1024)  | Responsive customer list                        |
| `screenshots/review-customers-list-mobile-375.png`               | Mobile (375×812)   | Single-column customer list                     |
| `screenshots/review-customer-general-desktop-1280.png`           | Desktop (1280×800) | Reference-aligned identity and detail hierarchy |
| `screenshots/review-customer-general-tablet-768.png`             | Tablet (768×1024)  | Icon-left identity and paired detail sections   |
| `screenshots/review-customer-general-mobile-375.png`             | Mobile (375×812)   | Single-column customer-detail reading order     |
| `screenshots/review-customer-review-details-desktop-1280.png`    | Desktop (1280×800) | IWA return link and expanded L3 parent branch   |
| `screenshots/review-customer-review-details-tablet-768.png`      | Tablet (768×1024)  | L3 route at compact desktop width               |
| `screenshots/review-customer-review-details-mobile-375.png`      | Mobile (375×812)   | L3 content without the desktop-only sidebar     |
| `screenshots/review-customer-general-collapsed-desktop-1280.png` | Desktop (1280×800) | Collapsed customer icon rail                    |
| `screenshots/review-customer-long-loading-desktop-1280.png`      | Desktop (1280×800) | Delayed summary skeleton                        |
| `screenshots/review-customer-long-loaded-desktop-1280.png`       | Desktop (1280×800) | Long summary values after loading               |
| `screenshots/review-customer-long-loading-tablet-768.png`        | Tablet (768×1024)  | Delayed compact horizontal skeleton             |
| `screenshots/review-customer-long-loaded-tablet-768.png`         | Tablet (768×1024)  | Long compact horizontal values after loading    |
| `screenshots/review-customer-long-loading-mobile-375.png`        | Mobile (375×812)   | Delayed mobile skeleton                         |
| `screenshots/review-customer-long-loaded-mobile-375.png`         | Mobile (375×812)   | Long mobile values after loading                |

> All screenshots are stored in
> `.design/contextual-sidebar-navigation/screenshots/`.

## Summary

The customer-detail shell now has a clear hierarchy: the unchanged global top
bar establishes **Customers**, the contextual sidebar exposes the customer
tabs, IWA `ScreenHeading` provides the Figma-aligned **Back to: My customers**
action and **Customer** title, and the persistent card keeps customer identity
visible above tab content. The large white briefcase in an ING-orange circle
matches the supplied customer reference. The card follows the reference's
hierarchy: name and status, an untitled overview, then aligned
**Identification data** and **Rating** sections. Labels are bold and compact,
rating is a plain value, dates are localized, and the unsupported own-group
action is absent. The implementation is restrained, token-based, and strongly
reuses IWA. Browser measurements confirm zero card-height and card-top movement
between skeleton and long loaded data at 1280, 768, and 375 pixels (406, 434,
and 734 pixels respectively in both states).

No application-owned blocker remains after the review fixes. The remaining
accessibility issues are limitations of the installed IWA package and should be
handled in the shared library rather than patched locally.

## Must Fix

None remaining.

## Should Fix

1. **IWA navigation semantics need a shared-library fix.** The installed
   `TabMenu` and `MenuList` emit `aria-selected` on ordinary buttons.
   Application touchpoints are `TopBarCustom.tsx` and `MenuListAdapter.tsx`.
   Extend the IWA contracts with correct tab/list semantics; do not add DOM
   mutation workarounds in this application.
2. **The documented IWA tooltip and icon-button APIs are missing from the
   installed package.** The collapsed rail therefore retains accessible names
   and native titles, but it cannot provide the required shared tooltip to
   sighted keyboard and touch users. Publish the documented APIs before
   replacing this fallback.
3. **The documented IWA `Heading` is missing from the verified package
   contract.** Customer and section titles therefore remain semantic `h2`/`h3`
   elements styled only with existing typography and color tokens. Publish the
   Storybook component in the package before replacing them; a local duplicate
   or runtime compatibility hack would weaken the UI seam.

## Could Improve

1. **Add a customer-tab surface below `md` if mobile becomes supported.** The
   brief explicitly scopes navigation to desktop, so the sidebar is hidden at
   `ContextualSidebar.tsx:70`. The content itself adapts cleanly at 375 pixels,
   but switching customer tabs requires a future mobile navigation decision.
2. **Resolve existing global top-bar overflow in IWA.** The customer work now
   preserves the original top-bar markup and utilities exactly as requested.
   The installed component still compresses long tab sets at narrower widths;
   address that as a separate global-navigation/IWA change rather than inside
   this customer PR.

## Resolved During Review

1. Loaded field values and skeletons now use the same configuration-driven
   region and fixed-row geometry. Long values remain present in the
   accessibility tree and expose their complete text through the native title;
   the vertical name/status header reserves matching space in every state.
2. The full breadcrumb was replaced with the Figma-specified IWA
   `ScreenHeading`: one stable **My customers** return link above the orange
   **Customer** H1. Its destination is derived from the manifest root item and
   no longer depends on asynchronously loaded customer data.
3. The global top bar was restored to its previous IWA structure, spacing, and
   utility actions; only its items, destinations, and active index come from
   the resolver.
4. The sidebar rail toggle exposes `aria-expanded`/`aria-controls`; branch
   disclosure controls expose `aria-expanded`, and
   a collapsed active branch promotes its visible parent to
   `aria-current="location"`.
5. The customer layout establishes its H1 before the panel's H2/H3 hierarchy,
   and skeleton motion is disabled when reduced motion is requested.
6. The RTK Query-to-Redux bridge now mirrors cache reset and failed-refetch
   transitions deterministically, preventing stale successful data from
   remaining in the view store.
7. The customer card now follows the supplied detail reference: a leading
   overview block precedes two aligned sections, labels use compact bold
   definition terms with presentation colons, an explicit value-only field
   avoids repeating the rating label, and strict shared date formatting uses
   the active locale without normalizing invalid calendar values.
8. The horizontal identity layout now starts at `md`: the hero icon remains on
   the left, all customer text remains on the right, and Identification data
   and Rating stay paired. Compact-width definition rows retain their complete
   labels and truncate only values with native full-value titles, reducing the
   reviewed 768-pixel card from 614 to 434 pixels without layout shift.

## What Works Well

- The desktop hierarchy is immediate and predictable in
  `review-customer-general-desktop-1280.png`: customer identity is strongest,
  the selected tab is unambiguous, and secondary metadata remains quiet.
- The L3 screenshot shows the correct parent highlight and child disclosure
  without losing either the customer shell or its list return action.
- The panel renders the icon to the left of its content and keeps the two detail
  sections paired at desktop and tablet widths; only the mobile layout stacks
  into the required semantic reading order, without horizontal document
  overflow.
- Spacing, borders, surfaces, icons, typography, and active states use existing
  Tailwind/design-system tokens; no feature-specific color or shadow values
  were introduced.
- IWA reuse is broad and appropriate: `TopBar`, `TabMenu`, `NavigationPanel`,
  `MenuList`, `NavigationMenuItem.subNodes`, `ScreenHeading`, `Card`,
  `DefinitionList`, `Skeleton`, and `Status` remain behind the UI seam.
- Keyboard-operable navigation and disclosure actions have separate 44-pixel
  targets, deep links expand their active ancestry, and the heading return
  action retains a real manifest-derived link target.
- Empty values preserve every configured row and use the required en dash;
  unsupported group actions and links are absent.
