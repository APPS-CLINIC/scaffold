# ADR 0004 — Bramki jakości: ESLint + Prettier + Husky + lint-staged

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Konwencje jakości utrzymują się tylko wtedy, gdy są egzekwowane automatycznie.
Chcemy, by **formatowanie** nie było tematem do dyskusji, **lint** łapał
rzeczywiste problemy poprawności, i żeby o obu nie dało się zapomnieć — bez
spowalniania każdego commita.

## Decyzja

Warstwujemy cztery narzędzia o jasnych, nienakładających się odpowiedzialnościach:

- **Prettier** odpowiada wyłącznie za formatowanie. Konfiguracja w
  [`.prettierrc.json`](../../.prettierrc.json): pojedyncze cudzysłowy, średniki,
  przecinki końcowe, `printWidth: 100`, wcięcie 2 spacje. Zachowanie edytora
  jest spójne dzięki [`.editorconfig`](../../.editorconfig).
- **ESLint (flat config)** odpowiada za jakość kodu, w
  [`eslint.config.js`](../../eslint.config.js): zalecane zestawy reguł JS +
  `typescript-eslint`, plus:
  - `react-hooks/rules-of-hooks` (error) i `exhaustive-deps` (warn),
  - `react-refresh/only-export-components` dla bezpieczeństwa HMR,
  - `@typescript-eslint/consistent-type-imports` (inline `import type`), co
    egzekwuje dyscyplinę `verbatimModuleSyntax` z
    [ADR 0002](0002-typescript-strict-and-project-config.md),
  - `no-unused-vars` z furtką ignorowania `^_`.
  - **`eslint-config-prettier` jest stosowany na końcu**, więc ESLint nigdy nie
    walczy z Prettierem o formatowanie.
- **Husky** zarządza hookami Git; [`.husky/pre-commit`](../../.husky/pre-commit)
  uruchamia `npx lint-staged`. Hooki instalują się przez skrypt `prepare`.
- **lint-staged** ([`package.json`](../../package.json)) uruchamia `eslint --fix`,
  a potem `prettier --write` na zastagowanych `*.{ts,tsx}` oraz `prettier
  --write` na zastagowanych `*.{json,css,md,html}` — czyli tylko na plikach,
  których dotknąłeś.

## Konsekwencje

- Commit jest auto-poprawiony i sformatowany dla zastagowanych plików, zanim
  wyląduje, więc lokalne commity są już blisko zielonego CI.
- Każde narzędzie ma jedno zadanie, więc się nie kłócą (zwłaszcza ESLint vs
  Prettier).
- Hook `pre-commit` to jedyne miejsce do aktualizacji, gdy zmienia się menedżer
  pakietów (zob. [ADR 0003](0003-package-manager-npm.md)).
- Hooki można obejść przez `--no-verify`; dlatego prawdziwą bramką wciąż jest CI
  (powinien tam działać ten sam `npm run lint`/`typecheck`/`test`/`build`).

## Rozważane alternatywy

- **ESLint również do formatowania.** Wolniej i więcej szumu; Prettier to
  formatter stworzony do tego celu — stąd ścisły podział.
- **Biome** (jedno szybkie narzędzie do lint+format) — kuszące, ale ekosystem
  wtyczek ESLint dla TypeScript/React jest wciąż bogatszy dla scaffoldu.
- **Brak hooka pre-commit, tylko CI.** Spycha trywialne błędy formatowania do CI
  i spowalnia pętlę.
