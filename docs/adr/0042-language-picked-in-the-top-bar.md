# ADR 0042 — Language picked in the top bar

- **Status:** Accepted
- **Date:** 2026-10-12
- **Refines:** [ADR 0014](0014-internationalization-i18n.md)

## Context

ADR 0014 ships the app in Polish and English but always started it in Polish;
nothing let the user switch. The design puts a language menu in the top bar,
between "Szybkie wyszukiwanie" and "Mój profil": the current language named in
itself ("Polski") with a caret, no icon.

The language reaches the service too (`Accept-Language` on the dictionaries
and the export), but it is a user preference, not view state: a shared link
should open in the reader's own language.

## Decision

- `src/i18n/languages.ts` lists the shipped languages once, each with its own
  name (`Polski`, `English`); i18next's `supportedLngs` and the menu read it.
- The top bar shows the current language as an IWA `TopBar.Item` menu
  (`menuProps` with `icon: null`, the language's name and one `MenuItem` per
  language, whose `command` picks it).
- Picking a language switches i18next and stores the pick in `localStorage`
  (`scaffold.language`). The app starts in the stored language, else Polish.
  Only a pick is stored, so the default never pins itself.
- `<html lang>` follows the language.
- The language stays out of the URL.

## Consequences

- Every translated text, the dictionaries loaded per language and the export's
  `Accept-Language` follow the pick at once, as they already follow i18next.
- The pick belongs to the browser, not to the user: another browser starts in
  Polish. A profile setting on the service would replace the storage read.
- With storage blocked, the pick lasts until a reload.

## Alternatives considered

- **Language in the URL.** Every link would carry it, and a shared link would
  force the sender's language on the reader.
- **Detect the browser language.** The design shows an explicit menu, and
  ADR 0014 starts the app in Polish. Detection could still choose the first
  visit's language later, before any pick is stored.
