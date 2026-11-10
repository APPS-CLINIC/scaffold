# Facilities — notatka integracyjna dla BE

Stan implementacji: **10.11.2026**.

## 1. Status kontraktu

Poniżej opisujemy **obecny model FE i propozycję do uzgodnienia z BE**.
Facilities działa obecnie na asynchronicznym symulatorze danych w `/dev/facilities`
oraz w Storybooku. Nie ma jeszcze podpiętych produkcyjnych żądań HTTP dla tej tabeli.
Metody HTTP, adresy endpointów i sposób przekazania kontekstu klienta pozostają
do ustalenia. Nazwy operacji z kodu FE nie narzucają nazw endpointów BE.

Typy transportowe są w [facilities.types.ts](../src/features/facilities/facilities.types.ts).
To oddzielny model od wierszy używanych przez komponenty tabeli.

## 2. Jak FE pobiera i pokazuje dane

1. Po wejściu na widok pobieramy **pierwszą stronę korzeni**. Nie pobieramy ich potomków.
2. Wiersz ma strzałkę, jeśli `hasChildren === true`, również gdy nie pobraliśmy jeszcze
   żadnego dziecka.
3. Rozwinięcie wiersza pobiera **pierwszą stronę jego bezpośrednich dzieci**.
   Kolejny poziom jest pobierany dopiero po rozwinięciu odpowiedniego dziecka.
4. Jeśli odpowiedź zawiera `nextCursor`, pokazujemy akcję doładowania kolejnych dzieci.
   Korzenie mają osobną akcję i osobny kursor kontynuacji.
5. Pobrane strony są scalane w cache RTK Query po `key`. Zwinięcie wiersza nie usuwa
   danych; ponowne otwarcie korzysta z pobranej części. Samo zwinięcie nie anuluje
   trwającego pojedynczego pobrania dzieci.
6. Zmiana wyszukiwania lub filtrów oznacza inny wpis cache i inny stan rozwinięcia.
   Sama zmiana waluty prezentacji zachowuje pobrane gałęzie.
7. **„Wszystkie” w filtrach grup oznacza wszystkie grupy**, z początkowo zwiniętymi
   korzeniami. Wybranie Lending również nie pobiera automatycznie potomków.
8. **„Rozwiń wszystko”** pobiera brakujące strony korzeni i potomków sekwencyjnie,
   a po zakończeniu otwiera cały pobrany wynik. Korzysta z tych samych operacji
   stronicowanych. Użytkownik może anulować aktywne pobranie i dalsze przechodzenie
   drzewa; wcześniej pobrane strony zostają w cache.

Zmiana zapytania lub opuszczenie widoku anuluje bieżącą operację „Rozwiń wszystko”.
Odpowiedzi dla różnych zapytań trafiają do osobnych wpisów cache. Cache ma obecnie
czas przechowywania 60 sekund po utracie ostatniej subskrypcji; nie jest to ustalenie
biznesowej świeżości danych ani okres automatycznego odświeżania.

FE sam pokazuje skeletony i komunikaty ładowania. Sztuczne opóźnienie 500 ms
w symulatorze służy sprawdzeniu tych stanów i nie jest wymaganiem dla BE.

## 3. Operacje i parametry żądania

| Operacja logiczna                  | Co zwraca                                       | Obecna operacja FE                                          |
| ---------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| Pierwsza strona korzeni            | `FacilityRootsResponse`                         | `getFacilityPreviewRoots(query)`                            |
| Pierwsza lub kolejna strona dzieci | `FacilityChildrenResponse`                      | `getFacilityPreviewChildren({ query, parentKey, cursor? })` |
| Kolejna strona korzeni             | `FacilityChildrenResponse`, z `parentKey: null` | Ta sama operacja kontynuacji z `parentKey: null`            |

Przykład żądania kolejnej strony dzieci:

```json
{
  "query": {
    "q": "",
    "filters": {}
  },
  "parentKey": "lending-3",
  "cursor": "1"
}
```

`cursor` pomijamy dla pierwszej strony. `parentKey` jest kluczem wystąpienia
w hierarchii, a nie identyfikatorem produktu `data.id`.

W żądaniach tej tabeli używamy `q` i `filters`. Ogólne parametry listy `page`,
`pageSize`, `sort` i `dir` nie są obecnie przekazywane przez Facilities do symulatora.
Wielkość strony i kolejność rodzeństwa musimy ustalić z BE.
Widok szczegółów i akcje przy ikonach są obecnie demonstracyjne; nie definiują
jeszcze produkcyjnego kontraktu pobierania szczegółów.

### Wyszukiwanie i filtry

Filtry mają postać `Record<string, string[]>`, również dla pojedynczego wyboru.
Przykładowo: `{"group":["LENDING"],"maxLevel":["3"]}`.

| Parametr                           | Obecna semantyka                                                                                                                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `q`                                | Wyszukiwanie fragmentu tekstu bez rozróżnienia wielkości liter po numerze, opisie, typie, statusie i grupie. Przeszukujemy cały zbiór po stronie symulatora.                                            |
| `group`                            | Dowolna kombinacja `LENDING`, `TFS`, `INTRADAY`, `INVESTMENT`, `CARD`, `OTHER`; pusta lista oznacza wszystkie. Wybór `LENDING` obejmuje też `TFS`. Wybory tworzą sumę zbiorów bez duplikowania pozycji. |
| `contractCurrency`                 | Jeden wybór: `PLN` albo `EUR`.                                                                                                                                                                          |
| `facilityType`                     | Jeden kod typu; słownik jest zwracany w metadanych korzeni.                                                                                                                                             |
| `commitment`                       | Jeden wybór: `C` albo `U`.                                                                                                                                                                              |
| `maxLevel`                         | Poziomy biznesowe od 1 do N, gdzie N to 1–6; domyślnie 6. Nie oznacza wyboru wyłącznie poziomu N.                                                                                                       |
| `expiryDate.from`, `expiryDate.to` | Przedział daty wygaśnięcia, z włączonymi granicami.                                                                                                                                                     |
| `looDate.from`, `looDate.to`       | Przedział daty LOO, z włączonymi granicami.                                                                                                                                                             |
| `displayCurrency`                  | `original`, `PLN` albo `EUR`. Parametr prezentacji FE, usuwany z żądania i klucza cache danych. Nie powinien powodować ponownego pobierania drzewa w obecnym modelu.                                    |

Warunki różnych filtrów i wyszukiwania łączymy przez AND. Daty są dniami kalendarzowymi
`YYYY-MM-DD`; `null` nie spełnia aktywnego warunku daty. Dokładna produkcyjna semantyka
wyszukiwania i walidacji filtrów wymaga potwierdzenia z BE.

## 4. Węzeł transportowy: `FacilityNodeDto`

```ts
interface FacilityNodeDto {
  key: string;
  parentKey: string | null;
  businessLevel: 1 | 2 | 3 | 4 | 5 | 6;
  hasChildren: boolean;
  childrenCount: number;
  data: FacilityRow;
}
```

| Pole            | Znaczenie i oczekiwanie FE                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`           | Stabilny, jednoznaczny klucz wystąpienia w drzewie. FE używa go do rozwijania i scalania stron. Ten sam produkt może wymagać różnych kluczy, jeśli występuje w różnych miejscach hierarchii. |
| `parentKey`     | Klucz rodzica. `null` dla korzenia zwracanego lasu.                                                                                                                                          |
| `businessLevel` | Poziom biznesowy. Nie jest równoważny głębokości w interfejsie: korzeń może zaczynać się np. na poziomie biznesowym 3.                                                                       |
| `hasChildren`   | Czy w wyniku bieżącego zapytania istnieją bezpośrednie dzieci. Nie zależy od liczby już pobranych stron.                                                                                     |
| `childrenCount` | Liczba wszystkich bezpośrednich dzieci w bieżącym wyniku, nie liczba wszystkich potomków ani rozmiar bieżącej strony.                                                                        |
| `data`          | Dane produktu opisane poniżej.                                                                                                                                                               |

Oczekujemy zgodności `hasChildren` z `childrenCount > 0`. Po zastosowaniu filtrów
lub limitu poziomów wartości te mogą się zmienić. Przykład: węzeł z dziećmi w pełnym
zbiorze może nie mieć dzieci w wyniku ograniczonym do określonego poziomu.

**DTO nie zawiera zagnieżdżonego `children` ani stanu ładowania interfejsu.**
Każda odpowiedź przekazuje płaską listę węzłów tej samej listy rodzeństwa.

### Dane produktu: `FacilityRow`

| Pole                    | Obecny typ lub zawartość                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `id`                    | `string`: identyfikator produktu, używany m.in. do otwierania szczegółów.                                                          |
| `number`                | `string`: numer widoczny w tabeli.                                                                                                 |
| `status`                | `ACTIVE` albo `ARCHIVAL`.                                                                                                          |
| `group`                 | Jeden z sześciu kodów grup z tabeli filtrów.                                                                                       |
| `type`                  | `string`: kod typu produktu.                                                                                                       |
| `description`           | `string`: opis.                                                                                                                    |
| `commitment`            | `C` albo `U`.                                                                                                                      |
| `contractCurrency`      | `PLN` albo `EUR` w obecnym prototypie.                                                                                             |
| `expiryDate`, `looDate` | `YYYY-MM-DD` albo `null`.                                                                                                          |
| `amounts`               | Warianty `original`, `PLN` i `EUR`, każdy typu `FacilityAmounts`.                                                                  |
| `indicators`            | Siedem tablic opisowych stringów: `creditAccounts`, `currencies`, `borrowers`, `collaterals`, `structure`, `ownership`, `ratings`. |

Pusta tablica wskaźnika oznacza brak dostępnych danych/akcji, przy zachowaniu
informacyjnej ikony. Docelowy kontrakt identyfikatorów, liczników i przejść do
szczegółów tych danych wymaga uzgodnienia. Obecne tablice opisowe są modelem PoC;
nie ustalamy nimi pobierania dużych kolekcji powiązanych z każdym wierszem.

## 5. Odpowiedzi i paginacja

Wspólna odpowiedź strony rodzeństwa:

```ts
interface FacilityChildrenResponse {
  parentKey: string | null;
  nodes: readonly FacilityNodeDto[];
  total: number;
  nextCursor: string | null;
}
```

- `total` to liczba wszystkich elementów **tej listy rodzeństwa** po zastosowaniu
  zapytania. Dla korzeni jest to liczba korzeni, a nie liczba wszystkich węzłów drzewa.
- `nextCursor: null` oznacza koniec tej listy. Nie stosujemy pustego stringa jako
  znacznika końca.
- Każdy rodzic ma własną paginację; korzenie mają osobną paginację z `parentKey: null`.
- Kursor musi być powiązany z rodzicem, zapytaniem i stabilną kolejnością wyniku.
  Kolejny kursor musi przesuwać pobieranie do przodu. Po zmianie zapytania zaczynamy
  od pierwszej strony, bez używania wcześniejszego kursora.
- FE przekazuje kursor dalej bez interpretowania jego zawartości. W symulatorze
  jest to offset zapisany jako string, np. `"1"`; format produkcyjny należy do BE.
- FE dopisuje nowe wystąpienia po `key`, zachowując kolejność odpowiedzi. Duplikaty
  pomija; obecny merge nie aktualizuje danych wcześniej otrzymanego `key`.
  Spójność stron przy zmianach danych wymaga osobnego ustalenia.

Domyślne dane dev mają strony po 50 korzeni i po 1 dziecku. Mała strona dzieci służy
pokazaniu kontynuacji. Duży scenariusz Storybooka ma 80 korzeni, 1000 dzieci pod jednym
rodzicem i strony po 25 elementów. Żadna z tych wielkości nie jest jeszcze limitem BE.

### Dodatkowe pola pierwszej odpowiedzi korzeni

`FacilityRootsResponse` rozszerza stronę rodzeństwa o:

| Pole                    | Znaczenie                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `parentKey`             | Zawsze `null`.                                                                                                                   |
| `asOf`                  | Data aktualności danych; obecnie dzień `YYYY-MM-DD`.                                                                             |
| `summaries`             | Niezależne, przygotowane podsumowania grup, opisane w sekcji 7.                                                                  |
| `view.matchingCount`    | Liczba bezpośrednich dopasowań w całym wyniku zapytania, bez dodawania przodków pokazanych wyłącznie jako kontekst.              |
| `view.contextKeys`      | Klucze przodków potrzebnych do pokazania ścieżki do dopasowań, mimo że sami nie spełniają kryteriów.                             |
| `view.autoExpandedKeys` | Klucze gałęzi potrzebnych do odsłonięcia dopasowań wyszukiwania/filtrów szczegółowych. Dla samego wyboru grupy lista jest pusta. |
| `view.groupCounts`      | Liczniki dla wszystkich sześciu kodów grup, niezależne od pobranych stron.                                                       |
| `view.facilityTypes`    | Słownik typów produktów dostępnych w całym katalogu, niezależny od pobranej strony.                                              |

`groupCounts` w prototypie nie zależy od `q` ani filtrów szczegółowych. Licznik
`LENDING` obejmuje również TFS, więc liczników przy przyciskach nie należy sumować
jako rozłącznych grup. Szczegóły reakcji liczników i słowników na filtry wymagają
potwierdzenia produktowego.

## 6. Wyszukiwanie w niepobranych gałęziach

FE nie może szukać wyłącznie w pobranej części drzewa. Dostawca danych musi ocenić
zapytanie na całym zbiorze i zachować przodków dopasowania jako kontekst.

Przykład z dev: `q=Target` trafia w jeden produkt na poziomie 6. Odpowiedź korzeni
zawiera jeden korzeń, `matchingCount` wynosi 1, a pięciu przodków jest oznaczonych
w `contextKeys`. Kolejne wiersze pobieramy nadal przez strony dzieci.

Obecny symulator zwraca `autoExpandedKeys` w kolejności od niższych gałęzi do
przodków; owner FE odwraca tę listę przed pobieraniem. Produkcyjny format ścieżek
i gwarancję ich kolejności trzeba uzgodnić lub odpowiednio zmienić adapter FE.

Przy szerokim wyniku samo automatyczne odsłanianie może wymagać ręcznej kontynuacji
stron. Obecny kod nie gwarantuje automatycznego znalezienia każdej ścieżki ukrytej
za dalszą stroną rodzeństwa. To istotny temat do rozwiązania przy integracji
wyszukiwania z dużym zbiorem.

Listy `contextKeys` i `autoExpandedKeys` są obecnie metadanymi całego wyniku.
Dla bardzo dużego wyniku również one mogą urosnąć. Musimy ustalić ograniczenie ich
rozmiaru lub inny sposób przekazywania kontekstu/ścieżek, np. oznaczenia przy węzłach
i osobną operację odsłonięcia ścieżki. Te warianty nie są jeszcze zaimplementowane.

## 7. Kwoty, waluty i podsumowania

```ts
interface FacilityAmounts {
  currency: 'PLN' | 'EUR';
  grantedMinor: number;
  utilizedMinor: number;
  availableMinor: number;
  utilization: number | null;
}
```

Kwoty są całkowitymi jednostkami najmniejszymi: `10000` oznacza `100,00` w walucie
z pola `currency`. Obecne formatowanie zakłada dwie cyfry dziesiętne.
`utilization: 0.2` jest prezentowane jako 20%; `null` oznacza brak wartości.

Każdy produkt dostaje gotowe warianty `amounts.original`, `amounts.PLN` i `amounts.EUR`.
FE wybiera wariant; nie przelicza kursu ani nie wylicza samodzielnie dostępnego
limitu z dwóch pozostałych kwot. Źródło kursów, moment przeliczenia i zakres walut
w produkcji wymagają uzgodnienia.

`summaries` to tablica `{ group, amounts: { PLN, EUR } }`, gdzie każdy wariant
ma typ `FacilityAmounts`. Są to niezależne podsumowania dostawcy danych.
**Nie sumujemy kwot rodziców i potomków**, bo mogłoby to policzyć ten sam limit
wielokrotnie. FE sumuje dostarczone podsumowania wybranych grup, każdą pozycję raz.

W prototypie `summaries` nie jest zawężane przez wyszukiwanie ani filtry szczegółowe;
FE wybiera grupy zgodnie z górnymi przyciskami. Przy walucie `original` suma jest
pokazywana w EUR, ponieważ poszczególne wiersze mogą mieć różne waluty.
To obecna decyzja PoC do potwierdzenia produktowego.

Pola kwot mają obecnie typ JS `number`. Dla jednostek najmniejszych i ich sum trzeba
potwierdzić zakres mieszczący się w bezpiecznych liczbach całkowitych JS
(`Number.MAX_SAFE_INTEGER`). Większy zakres wymaga zmiany reprezentacji i adaptera FE.

## 8. Stan wyłącznie po stronie FE oraz błędy

Adapter FE dodaje do DTO `children`, `childrenState` i `nextCursor` dla dzieci.
`childrenState` ma wartości `unloaded`, `loading`, `loaded`, `error`.

- Nowy węzeł z `hasChildren: true` zaczyna z `children: []` i stanem `unloaded`.
- `childrenState: loaded` oznacza zakończenie pobrania strony; pozostały
  `nextCursor` nadal oznacza niekompletną listę dzieci.
- Początkowe `nextCursor: null` w modelu FE nie oznacza kompletności gałęzi,
  jeżeli jej stan to nadal `unloaded`.
- Pusta tablica dzieci nie może zastąpić dostarczonej flagi `hasChildren`.
- Skeletony, callbacki, `childrenState` i `rootPageState` nie są częścią odpowiedzi BE.

Błąd doładowania jednej gałęzi pozostawia otrzymane wiersze i pokazuje możliwość
ponowienia. Anulowanie „Rozwiń wszystko” nie jest prezentowane jako błąd pobrania.
Pusty wynik to poprawna odpowiedź `nodes: []`, `total: 0`, `nextCursor: null`;
błąd operacji musi pozostać odróżnialny od pustego wyniku.

Symulator zgłasza błąd dla nieznanego rodzica lub niepoprawnego kursora, a adapter
mapuje go na ogólny błąd RTK Query. Kody HTTP i format błędów produkcyjnych
nie są jeszcze określone. Nie ma też w obecnym DTO tokena wersji danych/snapshotu.

Lazy loading ogranicza rozmiar pojedynczej odpowiedzi, ale cache rośnie wraz
z pobranymi stronami. „Rozwiń wszystko” może pobrać cały wynik; tabela nie ma obecnie
wirtualizacji ani ustalonego limitu takiej operacji. Duże dane dev sprawdzają
stronicowanie funkcjonalnie, nie są pomiarem wydajności produkcyjnej.

## 9. Pełne przykłady JSON z obecnego symulatora

Poniższe pliki zostały wygenerowane z tych samych funkcji serwisu, z których korzysta FE.
Zawierają wyłącznie dane syntetyczne, wraz z pełnym `data`, kwotami i metadanymi:

- [Pierwsza odpowiedź korzeni](examples/facilities/roots.json): `q: ""`, `filters: {}`;
  6 korzeni, 13 dopasowań w całym drzewie.
- [Pierwsza strona dzieci](examples/facilities/children-page-1.json):
  `parentKey: "lending-3"`, bez kursora; `total: 2`, `nextCursor: "1"`.
- [Druga strona dzieci](examples/facilities/children-page-2.json):
  ten sam rodzic i zapytanie, `cursor: "1"`; `nextCursor: null`.
- [Korzenie po wyszukaniu `Target`](examples/facilities/roots-search.json):
  1 dopasowanie na poziomie 6 oraz metadane przodków.

Przycisk pobrania JSON w `/dev/facilities` eksportuje oryginalną pierwszą odpowiedź
korzeni dla bieżącego zapytania. Plik pozostaje płaską odpowiedzią transportową
również po rozwinięciu tabeli; nie eksportuje całego scalonego cache.

## 10. Co ustalić wspólnie przed podpięciem BE

| Obszar                 | Ustalenie potrzebne do integracji                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Operacje               | Metody HTTP, adresy, kontekst klienta i mapowanie obecnych DTO na model BE.                                                          |
| Tożsamość i hierarchia | Stabilne `key`, powtarzające się produkty, korzenie zaczynające od wyższych poziomów biznesowych.                                    |
| Stronicowanie          | Rozmiary i maksima stron, kolejność rodzeństwa, ważność kursora, zachowanie przy zmianach danych i ewentualny token snapshotu.       |
| Wyszukiwanie           | Dopasowania w niepobranych gałęziach, przodkowie jako kontekst, format i rozmiar metadanych ścieżek, trafienia za dalszymi stronami. |
| Liczniki i sumy        | Zakres względem grup, wyszukiwania i filtrów szczegółowych; brak podwójnego liczenia hierarchii i Lending/TFS.                       |
| Wartości               | Słowniki typów, waluty, kursy, zakres i precyzja kwot, format daty aktualności danych.                                               |
| Powiązane dane         | Dostępność ikon, liczniki/identyfikatory i osobne pobieranie szczegółów.                                                             |
| Błędy i świeżość       | Format błędu, wygasły kursor, odświeżenie lub unieważnienie cache po zmianie danych.                                                 |
| Duża skala             | Limit i zachowanie „Rozwiń wszystko”, narastanie cache, ewentualna wirtualizacja po FE.                                              |

## Źródła w repozytorium

- [Typy danych i odpowiedzi](../src/features/facilities/facilities.types.ts).
- [Filtrowanie i przodkowie jako kontekst](../src/features/facilities/facilities.filters.ts).
- [Operacje symulowanego serwisu](../src/dev/facilities/facilitiesPreview.service.ts).
- [Transport asynchroniczny](../src/dev/facilities/facilitiesPreview.transport.ts).
- [Adapter DTO i scalanie stron w cache](../src/dev/facilities/facilitiesPreview.api.ts).
- [Sterowanie pobieraniem i „Rozwiń wszystko”](../src/dev/facilities/FacilitiesPreviewPage.tsx).
- [ADR 0048 — kontrakt lazy loading](adr/0048-lazy-facilities-preview-data-contract.md).
- [ADR 0050 — filtry grup i lazy loading](adr/0050-group-filters-keep-facilities-lazy.md).
