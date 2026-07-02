# Contributing

This repository works in the **GitHub Flow** model — a lightweight, trunk-based
approach in which `main` is always ready to deploy and all work happens on
short-lived branches, merged after review via Pull Requests.

> Not familiar with the architecture yet? Start with
> [`docs/README.md`](docs/README.md). The rationale for the design decisions is
> in the Architecture Decision Records in [`docs/adr/`](docs/adr/README.md).

## Branch model (GitHub Flow)

```
 main  ──●─────────●─────────────●────────●──►   (always green, always deployable)
          \         \             ▲        ▲
           \         \            │ PR     │ PR
            ●──●──●    ●──●──●─────┘        │
        docs/scaffold-and-config           │
                       feature/items-export┘
```

Model rules:

1. **`main` is protected and always release-ready.** Never commit directly to it.
2. **Every change starts from a branch** cut from the latest `main`.
3. **Open a Pull Request early.** It is the place for discussion and CI.
4. **CI must be green** (lint, typecheck, tests, build) before merging.
5. **At least one approving review** before merging.
6. **Merge via squash**, so `main` gets one readable, semantic commit per change.
7. **Delete the branch** after merging. Branches are cheap and short-lived.

### Branch naming

`<type>/<short-kebab-summary>` — the same `<type>` vocabulary as in commits:

| Type        | For                                     | Example                           |
| ----------- | --------------------------------------- | --------------------------------- |
| `feat/`     | a user-visible feature                  | `feat/items-csv-export`           |
| `fix/`      | a bug fix                               | `fix/pagination-off-by-one`       |
| `chore/`    | tooling, dependencies, config, plumbing | `chore/bump-vite-6`               |
| `docs/`     | documentation only                      | `docs/scaffold-and-config`        |
| `refactor/` | a code change with no behavior change   | `refactor/extract-url-state-hook` |
| `test/`     | tests only                              | `test/items-toolbar`              |

Keep branches **small and single-purpose** — a branch should map to one PR and
one reviewable idea.

## Commit convention (Conventional Commits)

```
<type>(<optional scope>): <imperative summary>

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
`ci`, `style`, `revert`. This vocabulary makes history easy to grep and opens
the door to automated changelogs/semver in the future.

## Local quality gates

The same checks CI runs are available locally, and the most important ones fire
automatically on commit thanks to **Husky** + **lint-staged** (see
[`docs/adr/0004-code-quality-gates.md`](docs/adr/0004-code-quality-gates.md)):

```bash
npm install         # once, to install dependencies and Git hooks (prepare)
npm run lint        # ESLint
npm run typecheck   # tsc (project build, no emit)
npm test            # Vitest
npm run build       # typecheck + production build
npm run format      # Prettier --write
```

On `git commit`, lint-staged auto-fixes and formats only the staged files, so a
green commit locally is most of the way to a green PR.

## Pull Request checklist

- [ ] Branch named `<type>/<summary>` and cut from the latest `main`.
- [ ] Commits follow Conventional Commits.
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` — all
      pass.
- [ ] Behavior changes are covered by tests.
- [ ] Architecturally significant decisions are recorded as
      [ADRs](docs/adr/README.md).
- [ ] The PR description explains **why**, not just what.
