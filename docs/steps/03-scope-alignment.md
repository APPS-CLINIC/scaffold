# Krok 03 — Dostrojenie do scope'u (z discovery)

> **Gałąź:** `docs/scope-alignment` (zbudowana na `docs/app-architecture`)
> **Cel:** uzgodnić scaffold z zakresem aplikacji ustalonym na spotkaniach
> (demo BIX + spotkanie planistyczne) i zarejestrować wynikające decyzje jako
> ADR-y.

Ten krok **nie zmienia rdzenia** architektury — potwierdza go i **dostraja** do
realiów projektu (UI, języki, uwierzytelnianie, model encji, dostarczanie).

## Co potwierdziło discovery (bez zmian)

Stack z [Kroku 01](01-scaffold-and-config.md) i [02](02-app-architecture.md)
pokrywa się z ustaleniami zespołu: **Vite + testy**, **Redux Toolkit + RTK
Query**, **reselect**, **React Router**, **URL jako źródło prawdy** (middleware
synchronizujący URL→stan), **Husky per-commit + Prettier + ESLint**, **Vitest**,
mock z opcją podmiany na realne API. **Wydajność** jest twardym wymogiem (stary
BIX jest wolny) — adresują ją wirtualizacja, cache RTK Query, reselect i
manualne chunki.

## Co dostrajamy (nowe ADR-y)

| ADR | Decyzja | Źródło |
| --- | ------- | ------ |
| [0013](../adr/0013-iwa-components-primereact.md) | Szew `@/ui` celuje w **IWA Components (PrimeReact)**; prymityw Toast; „Hello World z IWĄ" | demo + planowanie |
| [0014](../adr/0014-internationalization-i18n.md) | **i18n** od tej fazy: klucze statyczne na froncie, dane z backendu (potencjalnie) przetłumaczone | demo BIX |
| [0015](../adr/0015-authentication-entra-id.md) | **Azure Entra ID** + SSO/MFA; slice `auth`, `prepareHeaders` | planowanie |
| [0016](../adr/0016-entity-parametrized-views.md) | Widoki **parametryzowane encją** (klient vs grupa, 1..N) + tokeny kolorów | demo BIX |
| [0017](../adr/0017-delivery-docker-azure-pipelines.md) | **Azure Pipelines + Docker + GCP/CDN + brama OKAPI** (koryguje wcześniejszy pomysł GitHub Actions) | planowanie |
| [0018](../adr/0018-openapi-type-generation.md) | **Codegen z OpenAPI** — decyzja otwarta (spike) | planowanie |

## Wpływ na narzędzia i proces

- **Backlog: Azure DevOps** (nie Jira). Hierarchia Epic → Feature → User Story →
  Task, plus **Spike** i **Bug**.
- **CI/CD: Azure Pipelines** (zob. ADR 0017), nie GitHub Actions.
- **Spike'i** wynikające z discovery: DevOps (Docker/OKAPI/GCP/firewall), Entra
  ID/SSO, dostęp i integracja IWA, codegen OpenAPI, przyszłość raportów Power BI.

## Decyzje otwarte (do potwierdzenia z zespołem/biznesem)

- RTK Query vs samo React Query (decyzja Pawła po demo BIX) — scaffold zakłada
  RTK Query.
- Zakres URL-state (które widoki; krótkie/zaszyte URL-e) — pytanie do biznesu.
- Codegen OpenAPI: Kubb vs `@rtk-query/codegen-openapi` ([ADR 0018](../adr/0018-openapi-type-generation.md)).
- Tailwind tak/nie (zależne od IWA — [ADR 0013](../adr/0013-iwa-components-primereact.md)).

## Proces

Krok ląduje jako gałąź `docs/scope-alignment`, na szczycie Kroku 02, przez
Pull Request — zob. [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
