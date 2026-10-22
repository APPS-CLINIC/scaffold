# Limits view — component inventory

The limits screen mock-up, taken apart: which parts come from the IWA library, which the
scaffold already has, and which have to be built. This is an analysis only; nothing is
implemented, and the screen has no story yet. UI copy is quoted in Polish as it appears on
the mock-up.

## The screen

- **Summary**, top of the view:
  - the heading "Podsumowanie · Lending · TFS · Intraday · Investment", next to an orange icon;
  - three totals, each a label above an amount: "Limit przyznany", "Limit wykorzystany" and
    "Limit dostępny" (for example "1 425 000,00 EUR").
- **Chips**:
  - "Wszystkie", shown selected;
  - "Rodzaj: …": Lending (inc. TFS), TFS, Intraday, Investment, Limity karty, Inne;
  - "Facility: 1" up to "Facility: 1,2,3,4,5,6";
  - "Waluta: EUR" and "Waluta: Oryginalna waluta".
- **Toolbar**: "Dostosuj filtry", the "Szukaj na liście" search, "Pobierz listę" and the
  "Rozwiń wszystkie" switch.
- **Table**:
  - "Dane podstawowe" is one column holding three things:
    - the row number;
    - a row of icons, one of them with a count badge;
    - a stack of text: the limit number (bold), its status, its kind (bold), the facility
      type, C/U and "Waluta umowy".
  - "Nazwa klienta głównego";
  - "Expiry date" and "Data LDD";
  - "Limit przyznany", "Limit wykorzystany" and "Limit dostępny", right-aligned amounts with
    a currency;
  - "% wykorzystania".

The mock-up does not show the paginator.

## IWA components the scaffold does not use yet

- **`BadgeIconButton`** is the icon with the count badge in "Dane podstawowe". If the icon
  is not clickable, the plain icon with a **`BadgeNotification`** is enough.
- Neither is in the local IWA stub, the test double or the `@/ui` barrel yet. Each has to be
  added to all three, as `RichNotification` was.

Every other IWA component the screen needs is already in use (see below).

## Already in the scaffold

| On the screen                            | In the scaffold                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table, orange header rule, sort, paging  | `GenericDataTable`, over the IWA `PaginatorTable`                                                                                                 |
| "Expiry date", "Data LDD" (`25.04.2026`) | `DateCell`                                                                                                                                        |
| "Dostosuj filtry" and its dialog         | `TableFilters`, with `MultiSelectFilter` and `DateRangeFilter`                                                                                    |
| "Szukaj na liście"                       | `GenericSearch`; the Polish placeholder already exists as `customers.search.placeholder`                                                          |
| "Pobierz listę" and "Rozwiń wszystkie"   | `GenericTableSettings`, which draws the export button and the expand-all IWA `Switch` over the controlled `expandedRowKeys` of `GenericDataTable` |
| Export flow                              | The customer export (file download and toasts)                                                                                                    |
| Chips with an exclusive "Wszystkie"      | IWA `Chips` in `DueDateFilter`                                                                                                                    |
| No matching rows                         | IWA `RichNotification` through the `noResults` prop of `GenericDataTable`                                                                         |
| Route                                    | The placeholders `nav.customerDetail.limits` (`src/routes/pageRoutes/customers.pageRoutes.tsx`) and `nav.portfolio.limits`                        |

`GenericTableSettings` is not fully generic yet:

- its labels are the customer messages: `customers.actions.export` says "Pobierz do excela",
  where the mock-up says "Pobierz listę";
- its rows must have a numeric `id`.

The limits view needs the labels passed in, or its own message keys.

## To build

1. **Summary.** The heading and the three totals tiles. No IWA component draws a label above
   an amount: `DefinitionList` lays a term and its definition out in a row, and takes the
   text as a string. This is a small component local to the limits view.
2. **Amounts and percentages.**
   - The scaffold has no amount formatting with a currency ("9 999 999,00 PLN"). The view
     needs that formatting, plus an amount cell and a percent cell.
   - `GenericDataTable` cannot right-align a column. The field config needs an `align`
     option that applies to both the header and the cells.
3. **The "Dane podstawowe" cell.**
   - It holds the row number, offset by the page, then the icon row, then the text stack.
   - It is local to the limits view.
   - The icons come through `useCustomIcon` and `ing-react-icons`, plus `BadgeIconButton`.
     On the mock-up they are still placeholders.
4. **Quick-filter chips.** `DueDateFilter` is tied to due-date windows. The limits view needs
   a generic version: any options, plus an exclusive "Wszystkie". The selected "Wszystkie"
   on the mock-up is dark, while the IWA `Chips` Storybook shows a light selected fill;
   check this against the real library.
5. **Row expansion.**
   - The switch is ready. `GenericDataTable`, however, expands a row only into the columns
     that did not fit the width.
   - If a limit row expands into its sub-limits, `GenericDataTable` needs a new expansion
     template.
6. **Data.** Nothing exists yet:
   - the limits endpoint;
   - its types and adapter;
   - the RTK Query endpoint;
   - test data in the API test transport.

## Open questions

- **What does an expanded row show:** the columns that did not fit, or the sub-limits and
  facilities? This decides item 5.
- **Are the "Waluta: EUR / Oryginalna waluta" chips a filter, or a switch** for the currency
  the amounts are shown in? The two options exclude each other, so they look like a switch.
- **Where does the screen live:** under customer details ("Limity") or under the portfolio?
  The "Nazwa klienta głównego" column suggests the portfolio or a customer group.
- **What do the icons in "Dane podstawowe" mean,** and are they clickable?
