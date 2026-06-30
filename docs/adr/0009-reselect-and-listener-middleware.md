# ADR 0009 — Selektory reselect + listener middleware

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Dwie powracające potrzeby w aplikacji data-heavy: (1) wyprowadzać wartości ze
stanu **bez powodowania dodatkowych re-renderów** oraz (2) uruchamiać
**reaktywne efekty uboczne** (prefetch, analityka, koordynacja między slice'ami)
**bez rozsiewania thunków po komponentach**.

## Decyzja

Używamy **reselect** do odczytów wyprowadzonych oraz **listener middleware** z
Redux Toolkit do reaktywnych efektów ubocznych.

- Selektory **reselect** (`src/features/**/**.selectors.ts`) memoizują stan
  wyprowadzony i zwracają **stabilne referencje**, więc subskrybenci selektorów
  re-renderują się tylko wtedy, gdy ich wycinek stanu wyprowadzonego faktycznie
  się zmieni. Komponenty czytają lustro URL przez nie, zamiast parsować
  ponownie.
- **Listener middleware** jest skonfigurowane raz w
  [`listenerMiddleware.ts`](../../src/app/listenerMiddleware.ts) z typowanymi
  helperami (`startAppListening` / `addAppListener`). Funkcje rejestrują własne
  listenery przez **import z efektem ubocznym** w
  [`store.ts`](../../src/app/store.ts). Typowym wzorcem do dodania per funkcja
  jest listener, który **prefetchuje następną stronę** przy zmianie zapytania,
  więc paginacja jest natychmiastowa.
- Middleware jest **prepended** przed API middleware (zob.
  [ADR 0007](0007-redux-toolkit-and-rtk-query.md)), więc obserwuje akcje jako
  pierwsze.

## Konsekwencje

- Mniej re-renderów: stabilne wyjścia selektorów + strażnik płytkiego
  porównania w `UrlStateSync` trzymają churn dispatch/render niski.
- Efekty uboczne żyją w jednym idiomatycznym miejscu (listenery), a nie
  rozsiane jako thunki w komponentach — łatwiej znaleźć, testować, rozumować.
- Wzorzec prefetch-przy-zmianie daje natychmiastową paginację kosztem
  dodatkowych żądań (ograniczonych cache'owaniem/dedup RTK Query).
- Listenery rejestrują się przez import z efektem ubocznym, który musi pozostać
  w `store.ts`, by się podłączyły.

## Rozważane alternatywy

- **Inline `useMemo`/`useSelector` wyprowadzające w komponentach.** Zduplikowana
  logika, niestabilne referencje, więcej re-renderów.
- **Thunki / `useEffect` do efektów ubocznych.** Rozprasza logikę reaktywną po
  drzewie komponentów; trudniej koordynować między slice'ami.
- **Redux-Saga/Observable.** Potężne, ale zbyt ciężkie dla tej skali; listener
  middleware to natywna dla RTK odpowiedź.
