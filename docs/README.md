# Documentation

Technical documentation for the BIKS Scaffold project, organized as a
**step-by-step build narrative** plus a set of **Architecture Decision Records
(ADRs)**.

Goal: anyone can read this folder top to bottom and understand not only _what_
the scaffold contains, but _why_ each piece has the shape it does.

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
- **ADRs** are the durable record of individual decisions — each with context,
  decision, and consequences. They are cross-linked from the steps.

## Build steps

| Step | What it establishes                                           |
| ---- | ------------------------------------------------------------- |
| 01   | Tooling, language config, quality gates, process.             |
| 02   | Runtime architecture: state, data, URL-driven view state, UI. |
| 03   | Alignment with the discovery scope: IWA/PrimeReact, i18n.     |

> **Process:** development follows **GitHub Flow** — see
> [`../CONTRIBUTING.md`](../CONTRIBUTING.md) for the branch model, commit
> convention, and PR checklist.

## Architecture Decision Records

The full, indexed list lives in [`adr/README.md`](adr/README.md).
