# ADR 0000 — Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

A scaffold is, by definition, a stack of decisions made on someone else's behalf: which build tool, how strict the type system is, where state lives, how the URL relates to the UI. When these decisions are invisible, every new contributor reconsiders them from scratch, and the only answer to "why does it work this way?" is `git blame`.

We want the _rationale_ to be a durable, first-class artifact — not buried in chats, PR threads, or someone's memory.

## Decision

We keep **architecture decision records** in `docs/adr/`, one Markdown file per decision, numbered sequentially (`0001`, `0002`, …).

Each ADR uses this lightweight template:

```markdown
# ADR NNNN — <short title>

- **Status:** Proposed | Accepted | Superseded by ADR-XXXX | Deprecated
- **Date:** YYYY-MM-DD

## Context

What forces this decision? Constraints, requirements, trade-offs in play.

## Decision

What we decided, stated plainly.

## Consequences

What becomes easier, what becomes harder, what we now have to live with.

## Alternatives considered

What else we considered and why we didn't choose it.
```

Conventions:

- ADRs are **immutable once accepted.** To change a decision, write a new
  ADR and set the old one's status to _Superseded by ADR-XXXX_.
- Significant decisions should be linked from the relevant document in
  [`docs/steps/`](../steps/).

## Consequences

- New contributors can read the _why_ instead of reconstructing it.
- PRs that change the architecture should add or supersede an ADR, which keeps
  the record current.
- A small overhead for every significant decision — accepted as cheap insurance.

## Alternatives considered

- **A single `ARCHITECTURE.md` file.** Grows into an unreviewable behemoth and
  loses the context/status of individual decisions.
- **Commit messages / PR descriptions only.** Undiscoverable; tied to the
  hosting platform; easy to lose.
