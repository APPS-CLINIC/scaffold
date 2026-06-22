# Rekordy decyzji architektonicznych

**Rekord decyzji architektonicznej (ADR — Architecture Decision Record)**
opisuje pojedynczą, istotną architektonicznie decyzję: kontekst, który ją
wymusił, podjętą decyzję oraz wynikające z niej konsekwencje. ADR-y są
**tylko do dopisywania** — raz zaakceptowany ADR nie jest edytowany; jeśli
decyzja się zmienia, nowy ADR zastępuje stary (a status starego zostaje
zaktualizowany, by wskazywał na nowy).

Zob. [ADR 0000](0000-record-architecture-decisions.md), aby zrozumieć, po co w
ogóle prowadzimy ADR-y; użyj go też jako szablonu dla nowych rekordów.

## Legenda statusów

- **Zaakceptowano** — obowiązuje; odzwierciedlone w kodzie.
- **Proponowane** — w trakcie dyskusji.
- **Zastąpione przez ADR-XXXX** — zastąpione późniejszą decyzją.
- **Wycofane** — już nieaktualne.

## Spis

### Krok 01 — Scaffold i konfiguracja

| ADR                                                      | Tytuł                                            | Status      |
| -------------------------------------------------------- | ------------------------------------------------ | ----------- |
| [0000](0000-record-architecture-decisions.md)            | Prowadzenie rekordów decyzji architektonicznych  | Zaakceptowano |
| [0001](0001-build-tooling-vite-swc.md)                   | Vite 6 + SWC jako narzędzia build i dev          | Zaakceptowano |
| [0002](0002-typescript-strict-and-project-config.md)     | Ścisły TypeScript z referencjami projektów       | Zaakceptowano |
| [0003](0003-package-manager-npm.md)                      | npm jako menedżer pakietów                        | Zaakceptowano |
| [0004](0004-code-quality-gates.md)                       | Bramki jakości: ESLint + Prettier + Husky + lint-staged | Zaakceptowano |
| [0005](0005-testing-vitest-testing-library.md)           | Vitest + Testing Library do testów               | Zaakceptowano |

### Krok 02 — Architektura aplikacji

| ADR                                                      | Tytuł                                            | Status      |
| -------------------------------------------------------- | ------------------------------------------------ | ----------- |
| [0006](0006-url-as-single-source-of-truth.md)            | URL jako jedyne źródło prawdy dla stanu widoku    | Zaakceptowano |
| [0007](0007-redux-toolkit-and-rtk-query.md)              | Redux Toolkit + RTK Query do stanu i cache       | Zaakceptowano |
| [0008](0008-zod-total-parsing-of-search-params.md)       | Totalne parsowanie search params przez Zod       | Zaakceptowano |
| [0009](0009-reselect-and-listener-middleware.md)         | Selektory reselect + listener middleware         | Zaakceptowano |
| [0010](0010-list-virtualization.md)                      | Wirtualizacja list + paginacja po stronie serwera| Zaakceptowano |
| [0011](0011-ui-seam-no-bundled-ui-library.md)            | Szew UI — brak dołączonej biblioteki UI          | Zaakceptowano |
| [0012](0012-routing-react-router-v7.md)                  | Routing z React Router v7                        | Zaakceptowano |
