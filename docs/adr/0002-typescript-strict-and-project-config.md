# ADR 0002 — Ścisły TypeScript z referencjami projektów

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

To aplikacja data-heavy, w której wiele błędów to błędy kształtu danych —
niezdefiniowany wiersz, źle wpisane pole zapytania, nieaktualny enum. Chcemy,
aby kompilator wyłapał jak najwięcej z tego, a sprawdzanie typów w
edytorze/CLI było szybkie i obejmowało zarówno kod aplikacji (globalne DOM), jak
i pliki konfiguracyjne Node (inne globalne).

## Decyzja

Uruchamiamy TypeScript w **trybie ścisłym plus dodatkowe flagi bezpieczeństwa**,
podzielony przez **referencje projektów (project references)**.

[`tsconfig.json`](../../tsconfig.json) to plik-rozwiązanie bez własnych źródeł;
referuje dwa projekty liściowe:

- [`tsconfig.app.json`](../../tsconfig.app.json) — aplikacja `src`, `lib`
  zawiera DOM, globalne przeglądarki.
- [`tsconfig.node.json`](../../tsconfig.node.json) — `vite.config.ts`, biblioteki
  i globalne Node.

Poza `"strict": true` projekt aplikacji włącza dodatkowo:

- **`noUncheckedIndexedAccess`** — `arr[i]` jest `T | undefined`. Kluczowe przy
  dostępie do wierszy w wirtualizacji/paginacji.
- **`noUnusedLocals` / `noUnusedParameters`** — martwy kod to błąd.
- **`noFallthroughCasesInSwitch`**, **`noImplicitOverride`**,
  **`noUncheckedSideEffectImports`**.
- **`verbatimModuleSyntax`** — wymusza jawne `import type`, co nie pozwala
  importom typów przeciekać do wyjścia JS i współgra z regułą ESLint
  `consistent-type-imports` (zob. [ADR 0004](0004-code-quality-gates.md)).
- **`moduleResolution: "bundler"`** + alias ścieżki `@/* → ./src/*`, zgodnie z
  Vite.

`npm run typecheck` to `tsc -b`, który buduje referowane projekty z przyrostowymi
cache'ami `.tsbuildinfo`.

## Konsekwencje

- Duża klasa błędów runtime staje się błędem kompilacji.
- `noUncheckedIndexedAccess` wymusza jawną obsługę „może brakować" — bardziej
  rozwlekle, ale uczciwie, zwłaszcza wokół dostępu do list/wierszy.
- Kod aplikacji i Node nie mogą przypadkiem użyć swoich globalnych.
- Buildy przyrostowe utrzymują `typecheck` szybkim po pierwszym przebiegu.

## Rozważane alternatywy

- **Jeden luźny `tsconfig.json`.** Prostszy, ale miesza typy lib
  przeglądarka/Node i rezygnuje z siatki bezpieczeństwa ścisłych flag.
- **Sam `strict`, bez dodatkowych flag.** Pozostawia niesprawdzony dostęp
  indeksowy i martwy kod — dokładnie te błędy, na które ta aplikacja jest
  podatna.
