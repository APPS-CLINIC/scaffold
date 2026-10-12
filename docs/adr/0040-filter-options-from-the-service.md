# ADR 0040 — Filter options from the service

- **Status:** Accepted
- **Date:** 2026-10-12
- **Refines:** [ADR 0039](0039-table-filters-declared-in-the-field-config.md)

## Context

The customer list filters offered options the frontend kept itself: enum
labels in the translations and stand-in lists of groups, advisors and teams.
The service now serves them:

- `GET /api/dictionaries` returns the static dictionaries (customer status,
  customer type, TS price condition status) as `{ code, label }` lists,
  labelled in the language of the `Accept-Language` header. A language it has
  no labels in gets 400; the client then asks again in Polish.
- `GET /api/v1/users?advisorType=…` (nine advisor types, up to about 60 each)
  and `GET /api/v1/teams?productGroup=LENDING` (up to 10) return
  `[{ id, name }]`.
- `GET /api/v1/corporateGroups` (about 2400) and `GET /api/v1/internalGroups`
  (about 1100) return `[{ id, name }]` and search by a part of the name
  (`name`, case-insensitive). Without `name` they return everything; there is
  no paging and no lookup by id.

Lists of groups, advisors and the TS status also need a choice for customers
without a value.

## Decision

- The customers feature loads the options through RTK Query
  (`customerFilterDictionaries.api.ts`) and owns the hooks; `@/ui` still never
  fetches.
- **Static dictionaries:** one request for all three, cached per language, so
  a language change loads new labels. A 400 for a language other than Polish
  makes a second request in Polish. The codes stay the filter values, and the
  URL schema keeps its allow-lists of them.
- **Short lists** (advisors, lending teams, static dictionaries) load whole
  when a control or a chip first needs them, stay cached for an hour, and are
  searched in the browser. `createMultiSelectFilter` takes a hook returning
  `{ options, loading, failed }`.
- **Long lists** (corporate and own groups) are searched on the service:
  `createSearchMultiSelectFilter` reports the text typed into the open list,
  from three characters on and 300 ms after typing pauses, and its hook asks
  the service. Its options always include the "no value" choice and the
  picked entries; like every option, the list shows them while they match the
  typed text.
- The field config chooses per field:
  `tableFilter(CustomerDictionaryFilter, { dictionary: 'rmAdvisors' })` or
  `tableFilter(CustomerSearchFilter, { list: 'corporateGroups' })`. Where each
  name is fetched from is one table in the API module.
- A picked entry of a long list takes its name from any cached search of the
  same list. Without one — after a reload or from a shared link — its id
  stands in for the name.
- "No value" is the value `null` in the field's param, offered first. The
  service reads it the same way in every filter.
- While options load, the multiselect shows a spinner and the chip says
  "Loading…"; when they fail, the open list says so.

## Consequences

- A new list is one entry in the API module's table and one config line.
- The first open of the filter dialog in a session sends one request per
  short list it shows: up to eleven, each a few kilobytes.
- A chip of a long-list filter shows ids after a reload, or an hour after the
  last search that found its entries, until the user searches that list
  again. A lookup by id on the service would fix it in the feature hook alone.
- The open list also filters the service's matches by the typed text. A
  service that matched more loosely, ignoring accents for example, would have
  hits hidden.
- Table cells keep their own labels: the status cell translates, and the type
  and TS status cells show the text the customer list returns.

## Alternatives considered

- **Load the long lists whole and search in the browser.** About 110 KB once
  a session, and picked entries would always have names. Rejected in favour of
  the name search the service built for these lists: the first open stays
  light and the lists may grow.
- **Search every list on the service.** Rejected: the short lists are a few
  kilobytes, and loading them whole keeps every name at hand.
- **Keep the static labels in the frontend translations.** Rejected: the
  labels belong to the service, which serves them per language.
