# Krok 01 — Scaffold i konfiguracja

> **Cel:** ustanowić toolchain, konfigurację języka, bramki jakości oraz proces
> projektowy — fundament, na którym buduje każdy kolejny krok.

Ten krok dokumentuje *warstwę konfiguracji* scaffoldu: wszystko, co rządzi tym,
jak kod jest budowany, typowany, sprawdzany, testowany i współtworzony — zanim
powstanie jakakolwiek architektura aplikacji (to [Krok 02](02-app-architecture.md)).

## Co ustanawia ten krok

| Obszar             | Pliki                                                                  | ADR |
| ------------------ | --------------------------------------------------------------------- | --- |
| Build / dev / HMR  | `vite.config.ts`, `index.html`                                        | [0001](../adr/0001-build-tooling-vite-swc.md) |
| Konfiguracja języka| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`           | [0002](../adr/0002-typescript-strict-and-project-config.md) |
| Menedżer pakietów  | `package.json`, `package-lock.json`, `.nvmrc`                        | [0003](../adr/0003-package-manager-npm.md) |
| Bramki jakości     | `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.husky/pre-commit` | [0004](../adr/0004-code-quality-gates.md) |
| Testy              | `vite.config.ts` (`test`), `vitest.setup.ts`                         | [0005](../adr/0005-testing-vitest-testing-library.md) |
| Środowisko / edytor| `.env.example`, `.gitignore`, `.vscode/extensions.json`              | —   |
| Proces             | `CONTRIBUTING.md`                                                     | —   |

## Jak elementy do siebie pasują

```
            ┌──────────────┐
   git commit ─▶│ hook Husky │─▶ lint-staged ─▶ eslint --fix + prettier --write
            └──────────────┘                      (tylko zastagowane pliki)

   npm run dev   ─▶ Vite + SWC ──▶ HMR
   npm run build ─▶ tsc -b (typecheck) ─▶ vite build ─▶ dist/ (chunki vendora)
   npm test      ─▶ Vitest (jsdom) ─▶ Testing Library
```

- **Vite** to jeden silnik serwera dev, buildu produkcyjnego *oraz* (przez
  `vitest/config`) runnera testów — jedna konfiguracja, brak rozjazdu.
- **TypeScript** działa ściśle, podzielony na projekty `app` (przeglądarka) i
  `node` (konfiguracja) pod jednym `tsconfig.json`.
- **ESLint + Prettier** mają osobne zadania (jakość vs formatowanie) i nie
  walczą ze sobą dzięki zastosowaniu `eslint-config-prettier` na końcu.
- **Husky + lint-staged** czynią kontrole zastagowanych plików automatycznymi
  przy commicie.
- **npm** przypina toolchain (`package-lock.json`, `engines`, `.nvmrc`).

Uzasadnienie każdego wyboru żyje w jego ADR — ten dokument jest mapą; ADR-y są
terenem.

## Weryfikacja kroku

Czysty checkout powinien przejść każdą bramkę:

```bash
npm install       # instaluje zależności + hooki Git (prepare → husky)
npm run lint      # ESLint, bez błędów
npm run typecheck # tsc -b, bez błędów
npm test          # Vitest, zielono
npm run build     # typecheck + build produkcyjny do dist/
```

Jeśli wszystkie pięć przejdzie, fundament jest solidny i [Krok 02 — Architektura
aplikacji](02-app-architecture.md) może na nim budować.

## Proces

Rozwój zgodnie z **GitHub Flow**: `main` pozostaje zawsze wdrażalny, a ten krok
ląduje jako gałąź `docs/scaffold-and-config` przez Pull Request. Pełny model
gałęzi, konwencja commitów i lista kontrolna PR są w
[`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
