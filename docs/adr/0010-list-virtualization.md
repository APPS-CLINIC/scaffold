# ADR 0010 — Wirtualizacja list + paginacja po stronie serwera

- **Status:** Zaakceptowano (wzorzec — przykładowa implementacja usunięta)
- **Data:** 2026-06-22

## Kontekst

Aplikacja renderuje duże listy. Renderowanie każdego wiersza do DOM wysadza
zużycie pamięci oraz koszt layoutu/paintu; pobieranie wszystkich wierszy naraz
wysadza sieć i store. Potrzebujemy, by zarówno **DOM**, jak i **payload**
pozostały ograniczone niezależnie od rozmiaru zbioru danych.

## Decyzja

To jest **rekomendowany wzorzec** — scaffold nie dołącza już przykładowej
implementacji ani zależności wirtualizacji. Gdy dodajesz dużą listę, łączysz
dwie uzupełniające się techniki:

- **Wirtualizacja wierszy** z **@tanstack/react-virtual** (instalujesz ją
  wtedy), więc liczba zamontowanych węzłów wiersza jest **O(viewport)**, a nie
  O(zbioru danych). W DOM jest tylko widoczne okno (plus niewielki overscan).
- **Paginacja po stronie serwera** w zapytaniu: generyczny, walidowany przez
  Zod `listQuerySchema` niesie już `page`/`pageSize` (zob.
  [ADR 0008](0008-zod-total-parsing-of-search-params.md)), więc każde żądanie
  pobiera jedną ograniczoną stronę, cache'owaną per-argument przez RTK Query.

Te dwie można połączyć z listenerem **prefetchu następnej strony**
([ADR 0009](0009-reselect-and-listener-middleware.md)), by paginacja była
natychmiastowa.

## Konsekwencje

- Rozmiar DOM i payload na stronę są oba ograniczone → płynne przewijanie i
  szybki pierwszy paint nawet dla bardzo dużych zbiorów danych.
- Wysokość/pomiar wiersza muszą być obsłużone przez wirtualizator; w pełni
  dynamiczne, nieprzewidywalne wysokości wierszy wymagają dodatkowej troski
  (pomiar).
- Łączna liczba musi pochodzić z serwera, aby renderować poprawne afordancje
  scrollbara/paginacji.

## Rozważane alternatywy

- **Renderuj wszystkie wiersze.** Proste, ale nieograniczony DOM → zacięcia i
  wysadzenia pamięci.
- **Nieskończone przewijanie bez wirtualizacji.** Ogranicza sieć, ale nie DOM —
  liczba węzłów wciąż rośnie bez ograniczeń.
- **Paginacja po stronie klienta na pełnym fetchu.** Ogranicza DOM na stronę, ale
  nie początkowy payload; nie skaluje się do dużych zbiorów danych.
