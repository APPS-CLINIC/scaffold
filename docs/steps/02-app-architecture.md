# Krok 02 — Architektura aplikacji

> **Cel:** udokumentować architekturę runtime, która siedzi na warstwie
> konfiguracji z [Kroku 01](01-scaffold-and-config.md).

Ten krok wyjaśnia, *jak aplikacja jest spięta w runtime*: gdzie żyje stan, jak
URL napędza widok, jak dane serwera są pobierane i cache'owane oraz jak UI
pozostaje wymienialne. Każda sekcja linkuje do ADR-a zapisującego decyzję.

## Główna idea: URL napędza wszystko

```
        zapis                              odczyt
 ┌───────────────────┐             ┌─────────────────────┐
 │ useListQueryState │  navigate → │  React Router (URL)  │
 │   setQuery(...)   │             └──────────┬──────────┘
 └───────────────────┘                        │ zmiana search params
                                              ▼
                                   ┌─────────────────────┐
                                   │   <UrlStateSync/>    │  (URL → Redux, ze strażnikiem)
                                   └──────────┬──────────┘
                                              ▼
                                   slice urlState (lustro)
                                              │
                  ┌───────────────────────────┼───────────────────────────┐
                  ▼                            ▼                           ▼
        selectListQuery (reselect)    listener middleware           komponenty czytają
                  │                   (prefetch następnej strony)    przez useAppSelector
                  ▼
        useGetXQuery(query)  →  cache RTK Query  →  render
```

**URL jest jedynym źródłem prawdy** dla odpytywalnego stanu widoku; Redux trzyma
jednokierunkowe **lustro** tego stanu. Zob.
[ADR 0006](../adr/0006-url-as-single-source-of-truth.md).

## Warstwa po warstwie

### 1. Store i warstwa danych — `src/app`, `src/api`

Jedna fabryka store (`makeStore`) komponuje root reducer i middleware; jedna
instancja `baseApi` RTK Query posiada cache stanu serwera, a funkcje wstrzykują
do niej swoje endpointy. Typowane hooki ukrywają surowe typy Redux przed
komponentami.
→ [ADR 0007](../adr/0007-redux-toolkit-and-rtk-query.md)

### 2. Stan URL — `src/features/urlState`

Zod parsuje search params **totalnie** (każde pole `.catch()` z domyślną), więc
zły URL nigdy nie wyłoży widoku; domyślne są usuwane przy serializacji dla
krótkich, udostępnialnych linków. `UrlStateSync` odzwierciedla URL→store
jednokierunkowo; `useListQueryState` to strona zapisu.
→ [ADR 0008](../adr/0008-zod-total-parsing-of-search-params.md),
[ADR 0006](../adr/0006-url-as-single-source-of-truth.md)

### 3. Odczyty wyprowadzone i efekty uboczne — selektory + listenery

Selektory reselect dają stabilne, memoizowane odczyty (mniej re-renderów);
listener middleware uruchamia reaktywne efekty uboczne — tutaj **prefetch
następnej strony** przy zmianie zapytania — bez thunków w komponentach.
→ [ADR 0009](../adr/0009-reselect-and-listener-middleware.md)

### 4. Dodawanie funkcji (feature)

Nową funkcję dodajesz jako folder w `src/features/<nazwa>/`. Funkcja
**wstrzykuje** swój endpoint przez `baseApi.injectEndpoints(...)` (z
unieważnianiem cache opartym na tagach), **czyta** stan zapytania z URL przez
`selectListQuery` / `useListQueryState`, a jeśli renderuje dużą listę —
opcjonalnie ją **wirtualizuje** (server-side paginacja niesiona przez
`page`/`pageSize` w `listQuerySchema`).

### 5. Szew UI — `src/ui`

Wszystko importuje prymitywy UI z `@/ui`, cienkiej warstwy-zaślepki, więc
wewnętrzną bibliotekę UI organizacji można podpiąć w jednym folderze bez
dotykania kodu funkcji.

### 6. Routing — `src/routes`

React Router v7 udostępnia URL/search params jako obserwowalny stan i zapewnia
miejsce montażu `RootLayout` dla `UrlStateSync`.
→ [ADR 0012](../adr/0012-routing-react-router-v7.md)

## Jak płynie pojedyncza interakcja

1. Użytkownik wpisuje w polu wyszukiwania → `setQuery({ q })` (debounce,
   `replace`), co resetuje `page` do 1 i wywołuje `setSearchParams`.
2. URL się zmienia → `UrlStateSync` parsuje go i, jeśli różny (strażnik
   płytkiego porównania), dispatchuje do lustra `urlState`.
3. `selectListQuery` przelicza ponownie; query hook funkcji pobiera dane
   (lub serwuje z cache); opcjonalny listener może prefetchować następną stronę.
4. Komponent renderuje wyniki — przy dużych listach opcjonalnie tylko widoczne
   wiersze (wirtualizacja).

## Weryfikacja kroku

Ponieważ architektura jest ćwiczona przez zestaw testów, te same bramki z
[Kroku 01](01-scaffold-and-config.md) ją walidują:

```bash
npm test          # parsowanie schematu, synchronizacja URL→store, selektory, itd.
npm run typecheck # typy od końca do końca: store, query, selektory
npm run build     # build produkcyjny
```

## Proces

Ten krok ląduje jako gałąź `docs/app-architecture`, na szczycie Kroku 01, przez
Pull Request — zob. [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
