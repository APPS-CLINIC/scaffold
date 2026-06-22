# ADR 0001 — Vite 6 + SWC jako narzędzia build i dev

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Potrzebujemy łańcucha narzędzi build/dev dla przeglądarkowej aplikacji SPA,
który zapewni szybką pętlę zwrotną (HMR), sensowny build produkcyjny z podziałem
kodu i pierwszorzędne wsparcie TypeScript + JSX — bez ręcznego pisania
konfiguracji bundlera.

## Decyzja

Używamy **Vite 6** z **`@vitejs/plugin-react-swc`**.

Konkretnie, z [`vite.config.ts`](../../vite.config.ts):

- **SWC** (Rust) kompiluje React/TSX zamiast Babela — szybszy zimny start i HMR.
- **Alias ścieżki** `@ → ./src` jest zdefiniowany raz tutaj i powtórzony w
  `tsconfig.app.json`, więc importy to `@/features/...`, a nie `../../../`.
- **Cel buildu `es2022`** z włączonymi **sourcemapami**.
- **Ręczne chunki vendora** dzielą rzadko zmieniające się zależności na trwałe,
  cache'owalne pliki:
  - `react-vendor`: `react`, `react-dom`, `react-router-dom`
  - `redux-vendor`: `@reduxjs/toolkit`, `react-redux`, `reselect`
- Konfiguracja jest importowana z **`vitest/config`**, więc ten sam plik
  konfiguruje też runner testów (zob.
  [ADR 0005](0005-testing-vitest-testing-library.md)).

## Konsekwencje

- Bardzo szybki serwer dev i HMR; minimalna konfiguracja do utrzymania.
- Powracający użytkownik po wdrożeniu pobiera ponownie tylko chunki aplikacji, a
  nie cały bundel vendora — ale listę ręcznych chunków trzeba aktualizować, gdy
  zmieniają się kluczowe zależności.
- Jeden obiekt konfiguracji obsługuje build i testy, eliminując rozjazd między
  nimi.

## Rozważane alternatywy

- **Create React App** — praktycznie nieutrzymywane; wolne; nieprzejrzysta
  konfiguracja.
- **Next.js** — znakomity, ale wnosi SSR/routing/konwencje serwera, których ta
  data-heavy SPA nie potrzebuje; cięższy model mentalny.
- **Webpack od zera** — maksymalna kontrola, maksymalny koszt utrzymania.
- **Oparty na Babelu `@vitejs/plugin-react`** — OK, ale SWC jest szybsze, a nie
  używamy transformacji wyłącznych dla Babela.
