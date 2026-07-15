# Contributing

This repository uses a lightweight branching model with two long-lived
branches: **`develop`** (integration — day-to-day work lands here) and
**`main`** (release — always production-ready). All work happens on
short-lived branches cut from `develop` and merged back after review via
Pull Requests.

> New to the architecture? Start with [`docs/README.md`](docs/README.md).
> The rationale behind design decisions lives in the architecture decision
> records in [`docs/adr/`](docs/adr/README.md).

## Branching model

```
 main    ──●──────────────────●─────────────────●──►  (release, always production-ready)
            \                 ▲                 ▲
             \                │ release PR      │ release PR
 develop  ────●───●───────●───●────●────────●───●──►  (integration, always green)
                   \       ▲        \        ▲
                    \      │ PR      \       │ PR
                     ●──●──┘          ●──●───┘
              feat/items-csv-export   fix/pagination-off-by-one
```

Rules of the model:

1. **`main` is protected and always releasable.** Nothing lands on it except
   release PRs from `develop`.
2. **`develop` is the integration branch** — protected and kept green (CI)
   at all times.
3. **Every change starts on a branch** cut from the latest `develop` and
   returns to `develop` via a Pull Request.
4. **Open a Pull Request early.** That is where discussion and CI happen.
5. **CI must be green** (lint, typecheck, tests, build) before merging.
6. **At least one approving review** before merging.
7. **Merge via squash** so `develop` has one clean, semantic commit per
   change.
8. **A release is a PR from `develop` to `main`**, merged without squash
   (merge commit) so the released history stays intact and taggable.
9. **Delete the feature branch** after merging. Branches are cheap and
   short-lived.

### Branch naming

`<type>/<short-kebab-summary>` — the same `<type>` vocabulary as in commits:

| Type        | What for                                       | Example                           |
| ----------- | ---------------------------------------------- | --------------------------------- |
| `feat/`     | user-facing feature                            | `feat/items-csv-export`           |
| `fix/`      | bug fix                                        | `fix/pagination-off-by-one`       |
| `chore/`    | tooling, dependencies, configuration, plumbing | `chore/bump-vite-6`               |
| `docs/`     | documentation only                             | `docs/scaffold-and-config`        |
| `refactor/` | code change without behavior change            | `refactor/extract-url-state-hook` |
| `test/`     | tests only                                     | `test/items-toolbar`              |

Keep branches **small and single-purpose** — a branch should map to one PR
and one reviewable idea.

## Commit convention (Conventional Commits)

```
<type>(<optional scope>): <summary in the imperative mood>

<optional body — the "why", wrapped at ~72 columns>

<optional footer — BREAKING CHANGE:, refs #123>
```

Examples:

```
feat(items): add CSV export to the toolbar
fix(url-state): reset page to 1 when a filter changes
docs(adr): record the URL-as-source-of-truth decision
chore: bump vite to 6.1 via overrides
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `build`,
`ci`, `style`, `revert`. This vocabulary makes the history easy to search
(grep) and paves the way for automated changelogs/semver in the future.

### Language

**The entire repository is written in English** — code, commits, and
documentation alike: naming (identifiers), comments, JSDoc, and test
descriptions are English-only. Polish appears only in the `pl` locale
messages (`src/i18n/messages/pl.ts`).

## Local quality gates

The same checks that CI runs are available locally, and the most important
ones fire automatically on commit thanks to **Husky** + **lint-staged**
(see [`docs/adr/0004-code-quality-gates.md`](docs/adr/0004-code-quality-gates.md)):

```bash
npm install         # once, to install dependencies and Git hooks (prepare)
npm run lint        # ESLint
npm run typecheck   # tsc (project build, no emit)
npm test            # Vitest
npm run build       # typecheck + production build
npm run format      # Prettier --write
```

On `git commit`, lint-staged auto-fixes and formats only the staged files, so
a green commit locally is already most of the way to a green PR.

## Pull Request checklist

- [ ] Branch named `<type>/<summary>` and cut from the latest `develop`.
- [ ] Commits follow Conventional Commits.
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` — all
      pass.
- [ ] Behavior changes are covered by tests.
- [ ] Architecturally significant decisions are recorded as
      [ADRs](docs/adr/README.md).
- [ ] The PR description explains the **why**, not just the what.
