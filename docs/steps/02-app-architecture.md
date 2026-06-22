# Krok 02 — Architektura aplikacji

> **Gałąź:** `docs/app-architecture` (zbudowana na `docs/scaffold-and-config`)
> **Cel:** udokumentować architekturę runtime, która siedzi na warstwie
> konfiguracji z [Kroku 01](01-scaffold-and-config.md).

Ten krok wyjaśnia, *jak aplikacja jest spięta w runtime*: gdzie żyje stan, jak
URL napędza widok, jak dane serwera są pobierane i cache'owane oraz jak UI
pozostaje wymienialne. Każda sekcja linkuje do ADR-a zapisującego decyzję.

## Główna idea: URL napędza wszystko

```
        zapis                              odczyt
 ┌──────────────────┐              ┌─────────────────────┐
 │ useItemsUrlState │  navigate →  │  React Router (URL)  │
 │   setQuery(...)  │              └──────────┬──────────┘
 └──────────────────┘                         │ zmiana search params
                                              ▼
                                   ┌─────────────────────┐
                                   │   <UrlStateSync/>    │  (URL → Redux, ze strażnikiem)
                                   └──────────┬──────────┘
                                              ▼
                                   slice urlState (lustro)
                                              │
                  ┌───────────────────────────┼───────────────────────────┐
                  ▼                            ▼                           ▼
        selectItemsQuery (reselect)   listener middleware           komponenty czytają
                  │                   (prefetch następnej strony)    przez useAppSelector
                  ▼
        useGetItemsQuery(query)  →  cache RTK Query  →  render
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
jednokierunkowo; `useItemsUrlState` to strona zapisu.
→ [ADR 0008](../adr/0008-zod-total-parsing-of-search-params.md),
[ADR 0006](../adr/0006-url-as-single-source-of-truth.md)

### 3. Odczyty wyprowadzone i efekty uboczne — selektory + listenery

Selektory reselect dają stabilne, memoizowane odczyty (mniej re-renderów);
listener middleware uruchamia reaktywne efekty uboczne — tutaj **prefetch
następnej strony** przy zmianie zapytania — bez thunków w komponentach.
→ [ADR 0009](../adr/0009-reselect-and-listener-middleware.md)

### 4. Przykładowa funkcja — `src/features/items`

Lista data-heavy: `items.api.ts` wstrzykuje `getItems` (dostarcza wbudowany mock
`queryFn`, wymienialny na prawdziwy `query` jedną linijką), unieważnianie cache
oparte na tagach, wirtualizowaną `ItemsTable`, pasek narzędzi i paginację.
→ [ADR 0010](../adr/0010-list-virtualization.md)

### 5. Szew UI — `src/ui`

Wszystko importuje prymitywy UI z `@/ui`, cienkiej warstwy-zaślepki, więc
wewnętrzną bibliotekę UI organizacji można podpiąć w jednym folderze bez
dotykania kodu funkcji.
→ [ADR 0011](../adr/0011-ui-seam-no-bundled-ui-library.md)

### 6. Routing — `src/routes`

React Router v7 udostępnia URL/search params jako obserwowalny stan i zapewnia
miejsce montażu `RootLayout` dla `UrlStateSync`.
→ [ADR 0012](../adr/0012-routing-react-router-v7.md)

## Jak płynie pojedyncza interakcja

1. Użytkownik wpisuje w polu wyszukiwania → `setQuery({ q })` (debounce,
   `replace`), co resetuje `page` do 1 i wywołuje `setSearchParams`.
2. URL się zmienia → `UrlStateSync` parsuje go i, jeśli różny (strażnik
   płytkiego porównania), dispatchuje do lustra `urlState`.
3. `selectItemsQuery` przelicza ponownie; `useGetItemsQuery(query)` pobiera
   (lub serwuje z cache); listener prefetchuje następną stronę.
4. `ItemsTable` renderuje tylko widoczne wiersze.

## Weryfikacja kroku

Ponieważ architektura jest ćwiczona przez zestaw testów, te same bramki z
[Kroku 01](01-scaffold-and-config.md) ją walidują:

```bash
npm test          # parsowanie schematu, mock zapytania, interakcja paska, itd.
npm run typecheck # typy od końca do końca: store, query, selektory
npm run build     # build produkcyjny
```

## Proces

Ten krok ląduje jako gałąź `docs/app-architecture`, na szczycie Kroku 01, przez
Pull Request — zob. [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
