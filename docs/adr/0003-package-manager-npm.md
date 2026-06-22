# ADR 0003 — npm jako menedżer pakietów

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Chcemy powtarzalnych instalacji, prostego i wszechobecnego narzędzia oraz
jednego ustalonego menedżera pakietów, aby pliki blokad (lockfile) nie
„migotały" między osobami i środowiskami CI.

## Decyzja

Używamy **npm** z zacommitowanym `package-lock.json`. Node jest przypięty przez
[`.nvmrc`](../../.nvmrc) i pole `engines.node` w
[`package.json`](../../package.json) (`>=20.11`).

- Skrypt `prepare` uruchamia `husky`, więc hooki instalują się przy
  `npm install` (zob. [ADR 0004](0004-code-quality-gates.md)).
- Pole **`overrides`** w `package.json` przypina `vite` do jednej wersji w całym
  drzewie (`"vite": "$vite"` — npm wspiera referencję `$<nazwa>` do wersji z
  własnych zależności). Dzięki temu wtyczka `@vitejs/plugin-react-swc` i aplikacja
  używają tej samej instancji Vite — bez tego npm potrafi zainstalować dwie
  wersje Vite, co skutkuje niezgodnością typów `Plugin`/`PluginOption`.
- W CI używamy **`npm ci`** (deterministyczna instalacja ściśle z
  `package-lock.json`).

## Konsekwencje

- npm jest wszechobecny — brak dodatkowego narzędzia do zainstalowania; każdy
  ma go z Node.
- `package-lock.json` + `npm ci` dają powtarzalne, deterministyczne instalacje
  w CI.
- `engines.node` + `.nvmrc` czynią oczekiwaną wersję Node jawną.
- `node_modules` jest płaskie i większe niż w pnpm (brak współdzielonego,
  content-addressed store) — akceptowalny koszt za prostotę i brak zależności od
  dodatkowego narzędzia.
- Pole `overrides` trzeba utrzymać, gdy zmienia się wersja Vite.

## Rozważane alternatywy

- **pnpm** — szybszy, content-addressed store i ścisłe `node_modules`, ale wnosi
  dodatkowe narzędzie do zainstalowania/przypięcia. Tu wybieramy wszechobecność
  npm.
- **Yarn (Berry/PnP)** — sprawny, ale PnP wnosi tarcia w edytorze/narzędziach
  dla scaffoldu, który ma być mało zaskakującym punktem startu.
