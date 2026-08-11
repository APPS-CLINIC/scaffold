# Documentation

Technical documentation for the Scaffold project, organized as a
**step-by-step build narrative** plus a set of **Architecture Decision
Records (ADRs)**.

Goal: anyone can read this folder top to bottom and understand not only
_what_ the scaffold contains, but also _why_ each piece is shaped the way
it is.

## How the documentation is organized

```
docs/
├─ README.md            ← you are here (table of contents)
├─ steps/               ← the build told as ordered, self-contained steps
│  ├─ 01-scaffold-and-config.md
│  ├─ 02-app-architecture.md
│  └─ 03-scope-alignment.md
└─ adr/                 ← the "why": one decision per file, immutable once accepted
   ├─ README.md
   ├─ 0000-record-architecture-decisions.md
   └─ ...
```

- **Steps** are the guide. Read them in order to build a mental model.
- **ADRs** are the permanent record of individual decisions — each with
  context, decision, and consequences. They are referenced from the steps.

## Build steps

| Step | What it establishes                                           |
| ---- | ------------------------------------------------------------- |
| 01   | Tooling, language configuration, quality gates, process.      |
| 02   | Runtime architecture: state, data, view state in the URL, UI. |
| 03   | Alignment with the discovery scope: IWA/PrimeReact, i18n.     |

> **Process:** see [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — the branching
> model (`develop` = integration, `main` = release), the commit convention,
> and the PR checklist.

## Architecture Decision Records

The full, indexed list lives in [`adr/README.md`](adr/README.md).

## Feature implementation notes

- [Contextual sidebar navigation](contextual-sidebar-navigation.md) — typed
  configuration, URL behavior, IWA composition, icon selection, and extension
  guide.
- [Generic data table and customer list](generic-data-table-and-customer-list.md)
  — typed per-cell configuration, expandable detail allowlists, server-driven
  queries, URL state, RTK Query ownership, and development preview data.

## Pull request delivery notes

- [PR #4 — Configurable contextual sidebar navigation](pull-requests/0004-contextual-sidebar-navigation.md)
  — ready-to-use squash commit message.
