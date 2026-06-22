# ADR 0018 — Generowanie typów z OpenAPI

- **Status:** Proponowane (decyzja otwarta — do rozstrzygnięcia spike'iem)
- **Data:** 2026-06-22

## Kontekst

Backend dostarczy **Swagger/OpenAPI**. Na spotkaniu padła propozycja narzędzia
do generowania klientów/typów z OpenAPI (**Kubb**, w transkrypcie „Qube/Cube").
Paweł jest ostrożny: nie chce, by generator **ingerował w kod i typy** —
preferuje pełną kontrolę nad typami i widzieć w **linterze**, gdy backend zmieni
kontrakt. Padło też, że trzeba sprawdzić **dostępność narzędzia** w środowisku
korporacyjnym.

To jest **decyzja jeszcze niepodjęta** — rejestrujemy ją jako otwartą.

## Opcje

1. **Bez codegenu** — typy i endpointy RTK Query pisane ręcznie (jak dziś:
   `items.types.ts` + `items.api.ts`). Pełna kontrola, więcej pracy ręcznej.
2. **`@rtk-query/codegen-openapi`** — generuje endpointy bezpośrednio do RTK
   Query, którego już używamy ([ADR 0007](0007-redux-toolkit-and-rtk-query.md)).
3. **Kubb** — generuje typy/klienty z OpenAPI; elastyczny, ale wprowadza własny
   krok generujący kod (obawa Pawła o ingerencję w typy).

## Rekomendacja (do potwierdzenia)

Jeśli wybieramy codegen — preferować **`@rtk-query/codegen-openapi`**, bo
integruje się z naszym stackiem i generuje do osobnych, wersjonowanych plików
(zmiana kontraktu → różnica w typach widoczna w review/linterze, czego oczekuje
Paweł). Generowane pliki traktujemy jako **artefakt** (nie edytujemy ręcznie),
a nasze typy domenowe budujemy na nich.

## Konsekwencje

- Codegen skraca synchronizację z backendem, ale dokłada krok i pliki
  generowane.
- Brak codegenu = pełna kontrola, ale ręczna praca i ryzyko rozjazdu z backendem.
- Decyzję podejmiemy, gdy będzie dostępny Swagger i znana dostępność narzędzi.

## Następny krok

Spike: porównać `@rtk-query/codegen-openapi` vs Kubb na realnym Swaggerze
backendu; zdecydować i zaktualizować status tego ADR (Zaakceptowano /
Zastąpione).
