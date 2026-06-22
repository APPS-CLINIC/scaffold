# ADR 0016 — Widoki parametryzowane encją (klient i grupy)

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Z demo BIX: widok **klienta** oraz widoki **grupy kapitałowej** i **grupy
własnej** prezentują w gruncie rzeczy te same dane — różnica polega na tym, że
grupa agreguje **wiele podmiotów**, a klient to jeden. Padł wprost wniosek
techniczny: „pisząc front-end można **sparametryzować** go i już na starcie być
przygotowanym, że pod spodem będzie **więcej niż jeden** klient; tak samo
endpointy mogłyby od razu zakładać, że listujemy **grupę**, a nie pojedynczy
podmiot".

Dodatkowo BIX koduje typ encji **kolorem** (klient, grupa kapitałowa — niebiesko,
grupa własna — fioletowo). Grupy własne są **edytowalne** (CRUD: tworzenie,
dodawanie/usuwanie podmiotów; podmiot należy do maks. jednej grupy — 1:1).

## Decyzja

Modelujemy widoki danych jako **parametryzowane typem encji i liczebnością 1..N**:

- Warstwa danych (zapytania/selektory) i komponenty prezentacyjne przyjmują
  **kolekcję podmiotów** (klient = kolekcja jednoelementowa).
- **Typ encji** (`client` | `capitalGroup` | `ownGroup`) jest pierwszorzędnym
  parametrem; kolory/akcenty wynikają z **design tokenów** w `@/ui`, nie z
  literałów w komponentach.
- Operacje **edycyjne grup własnych** (CRUD + ograniczenie 1:1) projektujemy jako
  mutacje RTK Query z unieważnianiem tagów
  ([ADR 0007](0007-redux-toolkit-and-rtk-query.md)).

## Konsekwencje

- Jeden zestaw komponentów obsługuje klienta i grupy — mniej duplikacji,
  spójna prezentacja.
- Endpointy i typy od początku zakładają liczebność N — brak kosztownego
  refaktoru, gdy dojdą grupy.
- Trzeba zaprojektować tokeny kolorów per typ encji w szwie UI
  ([ADR 0013](0013-iwa-components-primereact.md)).

## Rozważane alternatywy

- **Osobne widoki/komponenty dla klienta i grup.** Duplikacja i rozjazd
  prezentacji (problem starego BIX).
- **Parametryzacja dopiero przy dodawaniu grup.** Wymusza późniejszy refaktor
  warstwy danych i komponentów.
