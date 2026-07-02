# Step 03 — Scope alignment (from discovery)

> **Goal:** align the scaffold with the application scope agreed in the meetings
> (the BIKS demo + the planning meeting) and record the resulting decisions as
> ADRs.

This step **does not change the core** of the architecture — it confirms it and
**tunes** it to the realities of the project (UI, languages, authentication,
entity model, delivery).

## What discovery confirmed (no changes)

The stack from [Step 01](01-scaffold-and-config.md) and
[02](02-app-architecture.md) matches the team's agreements: **Vite + tests**,
**Redux Toolkit + RTK Query**, **reselect**, **React Router**, **URL as the
source of truth** (middleware syncing URL→state), **Husky per-commit with
Prettier and ESLint**, **Vitest**, and mocks with the option to swap in the real
API. **Performance** is a hard requirement (the old BIKS is slow) — addressed by
virtualization, RTK Query caching, reselect, and manual chunks.

## What we tune (new ADRs)

| ADR                                              | Decision                                                                                             | Source          |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------- |
| [0013](../adr/0013-iwa-components-primereact.md) | The `@/ui` seam targets **IWA UI Components (PrimeReact)**; we contribute upstream to IWA            | demo + planning |
| [0014](../adr/0014-internationalization-i18n.md) | **i18n** from this phase: static keys on the frontend, backend data (potentially) already translated | BIKS demo       |

## Impact on tooling and process

- **Backlog: Azure DevOps** (not Jira). Hierarchy Epic → Feature → User Story →
  Task, plus **Spike** and **Bug**.
- **CI/CD: Azure Pipelines**, not GitHub Actions.
- **Spikes** arising from discovery: DevOps (Docker/OKAPI/GCP/firewall), Entra
  ID/SSO, IWA access and integration, OpenAPI codegen, the future of Power BI
  reports.

## Open decisions (to confirm with the team/business)

- RTK Query vs plain React Query (Paweł's decision after the BIKS demo) — the
  scaffold assumes RTK Query.
- URL-state scope (which views; short/encoded URLs) — a question for the business.
- OpenAPI codegen: Kubb vs `@rtk-query/codegen-openapi`.
- Tailwind yes/no (depends on IWA — [ADR 0013](../adr/0013-iwa-components-primereact.md)).

## Process

This step lands as a `docs/scope-alignment` branch, on top of Step 02, via
Pull Request — see [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
