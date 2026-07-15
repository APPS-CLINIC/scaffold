# Step 03 — Scope alignment (with discovery)

> **Goal:** align the scaffold with the application scope agreed in the
> meetings (BIX demo + planning meeting) and record the resulting decisions as
> ADRs.

This step **does not change the core** of the architecture — it confirms it and
**tunes** it to the realities of the project (UI, languages, authentication,
entity model, delivery).

## What discovery confirmed (no changes)

The stack from [Step 01](01-scaffold-and-config.md) and
[02](02-app-architecture.md) matches the team's agreements: **Vite + tests**,
**Redux Toolkit + RTK Query**, **reselect**, **React Router**, **URL as the
source of truth** (URL→state sync middleware), **Husky per-commit + Prettier +
ESLint**, **Vitest**, a mock with the option to swap in the real API.
**Performance** is a hard requirement (the old BIX is slow) — addressed by
virtualization, the RTK Query cache, reselect, and manual chunks.

## What we are tuning (new ADRs)

| ADR                                              | Decision                                                                                         | Source          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | --------------- |
| [0013](../adr/0013-iwa-components-primereact.md) | The `@/ui` seam targets **IWA Components (PrimeReact)**; Toast primitive; "Hello World with IWA" | demo + planning |
| [0014](../adr/0014-internationalization-i18n.md) | **i18n** from this phase on: static keys on the frontend, backend data (potentially) translated  | BIX demo        |

## Impact on tooling and process

- **Backlog: Azure DevOps** (not Jira). Hierarchy Epic → Feature → User Story →
  Task, plus **Spike** and **Bug**.
- **CI/CD: Azure Pipelines**, not GitHub Actions.
- **Spikes** arising from discovery: DevOps (Docker/OKAPI/GCP/firewall), Entra
  ID/SSO, IWA access and integration, OpenAPI codegen, the future of Power BI
  reports.

## Open decisions (to be confirmed with the team/business)

- RTK Query vs plain React Query (Paweł's decision after the BIX demo) — the
  scaffold assumes RTK Query.
- URL-state scope (which views; short/encoded URLs) — a question for the
  business.
- OpenAPI codegen: Kubb vs `@rtk-query/codegen-openapi`.
- Tailwind yes/no (dependent on IWA — [ADR 0013](../adr/0013-iwa-components-primereact.md)).

## Process

This step lands as the `docs/scope-alignment` branch, on top of Step 02, via a
Pull Request — see [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
