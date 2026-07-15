---
description: 'Documentation and ADR rules for docs/'
applyTo: 'docs/**/*.md'
---

# Documentation rules (`docs/`)

- Documentation in `docs/` is written in **Polish** (the root `README.md` is
  English). Match the language of the file you are editing.
- `docs/adr/` holds Architecture Decision Records — one decision per file,
  named `NNNN-kebab-title.md`, using the structure of ADR 0000: **Status**,
  **Data**, **Kontekst**, **Decyzja**, **Konsekwencje**, **Rozważane
  alternatywy**.
- ADRs are **append-only**: never edit the substance of an accepted ADR. A
  changed decision gets a _new_ ADR that supersedes the old one; the old
  ADR's status is updated to „Zastąpione przez ADR-XXXX".
- Every new ADR must be registered in the index table in
  `docs/adr/README.md` (number, linked title, status).
- ADR numbers are never reused — continue from the highest number ever used,
  including deleted ones.
- `docs/steps/` is the ordered build narrative; each step is self-contained
  and links to the ADRs it introduces. Update the relevant step when a change
  alters what a step establishes.
- Any architecturally significant change in a PR (new dependency category,
  new pattern, changed seam) requires an accompanying ADR.
