# ADR 0014 — Internacjonalizacja (i18n)

- **Status:** Zaakceptowano
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

Wprowadzamy warstwę i18n od początku, na bibliotece **`react-i18next`** (na
`i18next`):

- Katalog `src/i18n` z konfiguracją i18next i plikami tłumaczeń (`pl`, `en`);
  domyślny język `pl`, `fallbackLng: 'pl'`. Komponenty tłumaczą przez
  `useTranslation()`.
- **Klucze płaskie, kropkowane** (`keySeparator: false`), interpolacja `{{var}}`.
  Type-safety kluczy przez augmentację `src/i18n/i18next.d.ts` (literówka =
  błąd kompilacji).
- **Statyczne teksty UI przez klucze** (żadnych literałów w komponentach).
- Dla **danych z backendu** zakładamy, że backend zwraca treść w języku
  użytkownika; front nie tłumaczy danych domenowych.

## Konsekwencje

- Komponenty od startu używają kluczy, więc dołożenie EN nie wymaga refaktoru.
- Trzeba ustalić kontrakt z backendem: **które pola przychodzą przetłumaczone**.
- Niewielki narzut na każdą etykietę (klucz zamiast literału) — akceptowany.

## Rozważane alternatywy

- **Własna, ręczna warstwa i18n.** Reinventing — react-i18next robi
  interpolację, liczbę mnogą, detekcję języka i lazy-loading sprawdzonym kodem.
- **formatjs / @lingui.** Dobre alternatywy; react-i18next wybrany jako
  najpopularniejszy w ekosystemie React.
- **i18n później.** Odrzucone — wymusiłoby przepisanie wszystkich widoków
  (decyzja „trzeba na tej fazie").
- **Tłumaczenie danych domenowych na froncie.** Kosztowne i kruche; dane lepiej
  tłumaczyć u źródła.
