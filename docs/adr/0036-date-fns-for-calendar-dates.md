# ADR 0036 — date-fns for calendar dates

- **Status:** Accepted
- **Date:** 2026-09-17

## Context

The service sends calendar dates (review dates, pricing condition end dates,
CDD expiry) as `yyyy-MM-dd` strings. The front end formats them for the active
locale and, for the customer list and the CDD/FATCA rows, flags the ones that
lie before today.

`src/i18n/dateFormats.ts` did this by hand: a regular expression, a date
built at noon, and a calendar roundtrip check, because `new Date` silently
rolls a day the month does not have (`2026-02-31`) over into the next month.
It also accepted full timestamps and compared dates as text. A work-repo review
found the code hard to follow and asked not to accept timestamps the service
does not send.

## Decision

We add **`date-fns`** and parse, validate and compare calendar dates with it.

- `parse(value, 'yyyy-MM-dd', new Date())` with `isValid` is the only way a
  date string becomes a `Date`: impossible days and timestamps are rejected,
  and the result is local midnight of that calendar day.
- Past-date checks compare calendar days with `isBefore(date, startOfDay(today))`.
- Display formatting stays on `Intl.DateTimeFormat` with the shared
  `DATE_DMY_FORMAT_OPTIONS`, which already follows the active locale.
- The library is used from `src/i18n/dateFormats.ts`; components and cells keep
  calling `formatIsoDmyDate` and `isPastIsoDate`.
- Each function is imported from its own entry point (`date-fns/parse`,
  `date-fns/isValid`, …). The package root re-exports every function, and the
  dev server and vitest transform each of those modules on first import —
  enough to push a lazily loaded customer route past a test's one-second wait.

## Consequences

- No hand-written calendar validation or time-of-day workaround remains.
- A value that is not a `yyyy-MM-dd` date is shown as it came and never marked
  overdue; a timestamp from a future endpoint needs an explicit parser.
- Comparisons work on local calendar days, so neither the viewer's timezone nor
  a DST switch changes the result.
- The work repo must have `date-fns` on its registry.

## Alternatives considered

- **Keep the hand-written parser and add a comment.** Rejected: the reviewer
  asked for simpler code, and the workaround would stay a trap for the next
  change.
- **`parseISO`.** Rejected: it accepts timestamps and converts ones with an
  offset to local time, which can move the calendar day.
- **Formatting with date-fns locales as well.** Rejected for now: `Intl` already
  formats per locale, and replacing it would add locale imports without a
  visible change.
