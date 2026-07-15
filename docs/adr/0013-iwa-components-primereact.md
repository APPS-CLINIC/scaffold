# ADR 0013 — IWA Components (PrimeReact) as the UI library behind the `@/ui` seam

- **Status:** Accepted (direction; details depend on access to the IWA repo)
- **Date:** 2026-06-22

## Context

The UI seam (`@/ui`) was established without committing to a specific library. From the planning meeting it follows that
the organization's internal library is **IWA Components** (ING), built on
**PrimeReact** (+ PrimeIcons, PrimeFlex), in a repository with **Tailwind**,
**React Router**, and **Toastify** (notifications).

What remains open is **exactly what the IWA team will deliver**: ready-made
"organisms" (entire forms) or only atoms/molecules. The decision was made that until
integration we will **temporarily override** the components ("even if it's ugly, as long as it
works, and later we'll hook it up to the real IWA").

## Decision

The target of the `@/ui` seam is **IWA Components (PrimeReact)**:

- We design the prop contracts in `@/ui` so that they eventually become re-exports /
  thin wrappers around IWA components, not generic stubs.
- The first integration task: **"Hello World with IWA"** — rendering a single
  real IWA component to verify access, proxy, and build.
- We add a **Toast/Notification** primitive to the seam (the equivalent of Toastify /
  PrimeReact Toast).
- If IWA requires **Tailwind**, we enable Tailwind + `tailwind-merge`
  (we already have `src/ui/cx.ts` as an anchor point).
- Until we have access to the IWA repo — the stubs stay contract-compliant; once
  access is granted, we swap the implementations in a single folder.

## Consequences

- The rest of the code (`features/**`, `routes/**`) remains independent of PrimeReact —
  swapping the stubs for IWA happens in `@/ui`.
- We need to obtain **observer access to the CMS2/IWA repo** (a separate spike).
- Risk: if IWA delivers only atoms/molecules, we build some of the "organisms" ourselves —
  the `@/ui` contracts must withstand that.
- Possible style mixing (Tailwind + PrimeFlex) — to be verified during
  integration.

## Alternatives considered

- **Our own design system.** Duplicates IWA; inconsistent with the organization's standard.
- **Importing PrimeReact directly in features.** Breaks the `@/ui` seam and couples
  the code to a specific vendor.
