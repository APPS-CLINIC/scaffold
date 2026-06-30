# ADR 0012 — Routing z React Router v7

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Architektura „URL jako źródło prawdy"
([ADR 0006](0006-url-as-single-source-of-truth.md)) zależy od routera, który
udostępnia URL — zarówno ścieżkę, jak i **search params** — jako pierwszorzędny,
obserwowalny stan z hookami. Chcemy też jednego miejsca na zamontowanie spraw
przekrojowych (synchronizacja URL→store) oraz powłoki layoutu.

## Decyzja

Używamy **React Router v7** z routerem przeglądarki zdefiniowanym w
[`router.tsx`](../../src/routes/router.tsx):

- Element `RootLayout` opakowuje wszystkie trasy i jest miejscem, gdzie
  [`UrlStateSync`](../../src/features/urlState/UrlStateSync.tsx) montuje się raz.
- Trasy: indeks renderuje `HomePage` (placeholder), a `*` renderuje
  `NotFoundPage`.
- Funkcje czytają/zapisują search params przez `useSearchParams` routera
  (opakowane przez `useListQueryState`), co jest kręgosłupem wzorca stanu
  napędzanego URL-em.

## Konsekwencje

- Search params są obserwowalnym stanem React, umożliwiając jednokierunkową
  synchronizację URL→store i udostępnialne linki.
- `RootLayout` daje jedno miejsce montażu dla spraw ogólnoaplikacyjnych
  (synchronizacja dziś; error boundaries, chrome itd. później).
- Związane z API React Routera; helper testowy `renderWithProviders` podpina
  router, więc komponenty używające hooków routera są testowalne.

## Rozważane alternatywy

- **TanStack Router.** Mocna, typowo-bezpieczna historia routingu/search params;
  React Router v7 wybrano jako domyślną, mniej oporną i szeroko znaną opcję dla
  tego scaffoldu.
- **Brak routera / ręczne `history`.** Re-implementuje obserwację search params i
  nawigację, które router już zapewnia.
