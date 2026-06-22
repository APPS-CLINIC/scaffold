# ADR 0014 — Internacjonalizacja (i18n)

- **Status:** Zaakceptowano (kierunek; biblioteka i szczegóły do ustalenia)
- **Data:** 2026-06-22

## Kontekst

Stary BIX **nie ma wersji językowej** — część interfejsu jest po polsku, część
po angielsku. W banku pojawiają się osoby anglojęzyczne, więc nowy BIX
**ma mieć wersję EN/PL**. Na spotkaniu padło wprost, że strukturę i18n trzeba
przygotować **już na tej fazie**, bo wpływa na sposób budowy komponentów.

Rozróżnienie z dyskusji:

- **Statyczne UI** (nazwy kolumn, tytuły, etykiety) — klucze trzymane **na
  froncie**.
- **Dane z backendu** — potencjalnie przychodzą **już przetłumaczone**
  (np. nazwy spółek, dane bankowe nie podlegają tłumaczeniu; opisówki typu
  „facility" — do rozważenia po stronie backendu).

## Decyzja

Wprowadzamy warstwę i18n od początku:

- Katalog `src/i18n` z providerem i plikami tłumaczeń (`pl`, `en`); domyślny
  język + przełącznik.
- **Statyczne teksty UI przez klucze** (żadnych literałów w komponentach).
- Dla **danych z backendu** zakładamy, że backend zwraca treść w języku
  użytkownika; front nie tłumaczy danych domenowych.
- Decyzja o konkretnej bibliotece (np. `react-i18next` / `formatjs`) — w osobnej
  historyjce; struktura ma być od niej maksymalnie niezależna.

## Konsekwencje

- Komponenty od startu używają kluczy, więc dołożenie EN nie wymaga refaktoru.
- Trzeba ustalić kontrakt z backendem: **które pola przychodzą przetłumaczone**.
- Niewielki narzut na każdą etykietę (klucz zamiast literału) — akceptowany.

## Rozważane alternatywy

- **i18n później.** Odrzucone — wymusiłoby przepisanie wszystkich widoków
  (decyzja „trzeba na tej fazie").
- **Tłumaczenie danych domenowych na froncie.** Kosztowne i kruche; dane lepiej
  tłumaczyć u źródła.
