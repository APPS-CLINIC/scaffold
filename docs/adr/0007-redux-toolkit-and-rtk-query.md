# ADR 0007 — Redux Toolkit + RTK Query do stanu i cache

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Mamy dwa różne rodzaje stanu: niewielką ilość **stanu widoku po stronie klienta**
(lustro URL) oraz **stan serwera** (paginowane elementy), który wymaga
cache'owania, deduplikacji, unieważniania i prefetchu. Chcemy jednego spójnego
store, typowanego od końca do końca, bez ręcznego pisania logiki fetch/cache.

## Decyzja

Używamy **Redux Toolkit** dla store i **RTK Query** dla stanu serwera.

- Jedna fabryka store, [`makeStore`](../../src/app/store.ts), komponuje root
  reducer i middleware. **Fabryka** (a nie tylko singleton) czyni testy
  hermetycznymi i zostawia otwarte drzwi do SSR. Kolejność middleware jest
  celowa: `listenerMiddleware` jest **prepended** (działa przed), a
  `baseApi.middleware` jest dołączony przez concat.
- **Jedna instancja API RTK Query**, [`baseApi`](../../src/api/baseApi.ts),
  posiada `reducerPath: 'api'`, współdzielone `tagTypes` oraz
  `keepUnusedDataFor`. Funkcje **wstrzykują** swoje endpointy przez
  `baseApi.injectEndpoints(...)`, więc każda funkcja jest samowystarczalna i
  podzielna na chunki.
- [`rootReducer`](../../src/app/rootReducer.ts) podpina `[baseApi.reducerPath]`
  i slice `urlState`.
- Typowane hooki (`useAppSelector`, `useAppDispatch`, `useAppStore`) centralizują
  typy `RootState`/`AppDispatch`, więc komponenty nigdy nie importują surowych
  typów Redux.

Unieważnianie cache jest oparte na tagach. `baseApi.tagTypes` startuje pusty
(`[]`); typy tagów rejestruje się centralnie w miarę, jak funkcje dodają
endpointy. Przykładowo zapytanie listy mogłoby dostarczać tag per wiersz plus
tag `LIST`, dzięki czemu przyszła mutacja unieważnia precyzyjnie.

## Konsekwencje

- Kwestie cache serwera (dedup, czas życia cache, refetch przy focus/reconnect
  przez `setupListeners`, unieważnianie) obsługuje RTK Query, a nie kod własny.
- Wstrzykiwane endpointy trzymają funkcje modularne i ładowalne leniwie.
- Pojedynczy `baseApi` centralizuje koordynację tagów między funkcjami.
- Trochę boilerplate/ceremoniału wokół typowania store — płacone raz, w
  `src/app`.

## Rozważane alternatywy

- **Rdzeń Redux + ręczne thunki/cache.** Wymyśla RTK Query od nowa, gorzej.
- **React Query + Zustand/Context.** Znakomite połączenie, ale dwie biblioteki i
  dwa modele mentalne; RTK Query daje cache *oraz* store Redux (potrzebny dla
  lustra URL, selektorów i listener middleware) w jednym.
- **Wiele instancji `createApi`.** Traci scentralizowaną koordynację
  tagów/cache.
