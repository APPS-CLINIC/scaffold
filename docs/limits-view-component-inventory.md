# Limits view — component inventory

The limits table from the mock-up: which components the scaffold already has, which have to
be built, and which IWA components it uses. This is an analysis only; nothing is
implemented, and the screen has no story yet. UI copy is quoted in Polish as it appears on
the mock-up.

## Already in the scaffold

- `GenericDataTable`: columns, sorting, paging, row expansion, loading.
- `DateCell`: "Expiry date" and "Data LDD".
- `TextCell`: "Nazwa klienta głównego".
- `GenericTableSettings`: "Pobierz listę" and "Rozwiń wszystkie". Its export label has to be
  configurable.
- The `noResults` prop of `GenericDataTable`: the no-results notice.

## To build

- The "Dane podstawowe" cell: the row number, the icons and the text stack.
- `AmountCell` and amount formatting ("9 999 999,00 PLN").
- `PercentCell`: "% wykorzystania".
- Right and top alignment of columns in `GenericDataTable`.
- An expansion template, if an expanded row shows its sub-limits.
- The limit row type, endpoint, adapter and test data.

## IWA components

- `PaginatorTable`, under `GenericDataTable`.
- `BadgeIconButton` or `BadgeNotification`: the icon with a count.
- `Switch`: "Rozwiń wszystkie".
- `RichNotification`: the no-results notice.
- `Tooltip`, optional: if the icons need a description.
