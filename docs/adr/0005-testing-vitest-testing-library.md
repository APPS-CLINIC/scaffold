# ADR 0005 — Vitest + Testing Library do testów

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Chcemy runnera testów, który dzieli konfigurację Vite z aplikacją (brak drugiego
potoku build do synchronizowania), działa szybko i obsługuje zarówno czyste
testy logiki (parsowanie schematu, mock zapytania), jak i testy
komponentów/interakcji.

## Decyzja

Używamy **Vitest** z **@testing-library/react** + **user-event** oraz
**@testing-library/jest-dom**.

Z bloku `test` w [`vite.config.ts`](../../vite.config.ts):

- **`environment: 'jsdom'`** do testów komponentów opartych na DOM.
- **`globals: true`**, więc `describe/it/expect` nie wymagają importów; pasujące
  typy są podpięte przez `tsconfig.app.json` `types: ["vitest/globals", ...]`.
- **`setupFiles: ['./vitest.setup.ts']`** rejestruje matchery jest-dom.
- **`restoreMocks: true`** izoluje testy, automatycznie resetując mocki.
- **Pokrycie** przez `@vitest/coverage-v8`, włączając `src/**` i wykluczając
  testy, `main.tsx` oraz pliki `.d.ts`.

Testy żyją obok kodu, który pokrywają (`*.test.ts(x)`), a komponenty są
renderowane przez wspólny helper, `src/test/renderWithProviders.tsx`, który
podpina store Redux i router (zob.
[Krok 02](../steps/02-app-architecture.md)).

## Konsekwencje

- Jedna konfiguracja napędza dev, build i testy — brak równoległej konfiguracji
  Jest/Babel.
- Współlokalizowane testy trzymają pokrycie blisko kodu i łatwe do znalezienia.
- Fabryka store (`makeStore`) czyni każdy test hermetycznym — świeży store na
  test, opcjonalnie ze stanem wstępnym.

## Rozważane alternatywy

- **Jest** — dojrzały, ale wymaga własnej transformacji/konfiguracji i jest
  wolniejszy z Vite/ESM/TS; powiela to, co Vite już wie.
- **Tylko Playwright/Cypress.** Świetne do end-to-end, ale zbyt ciężkie i wolne
  jako główna warstwa unit/komponent; uzupełniające, nie zastępcze.
