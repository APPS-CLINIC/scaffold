# ADR 0019 — Tailwind CSS v4 (warstwa utilities) obok CSS modules

- **Status:** Zaakceptowano
- **Data:** 2026-07-15

## Kontekst

Warstwa `@/ui` była stylowana wyłącznie CSS modules jako tymczasowe zaślepki.
[ADR 0013](0013-iwa-components-primereact.md) przewidział, że docelowa
biblioteka **IWA Components (PrimeReact)** żyje w repozytorium z Tailwind
i że „jeśli IWA wymaga Tailwind, włączamy Tailwind". Nowe prymitywy
(`Icon` + `useCustomIcon`) są stylowane utility-first, co wymusiło decyzję:
jak wprowadzić Tailwind, nie psując istniejących styli globalnych i tokenów.

## Decyzja

Włączamy **Tailwind CSS v4** przez plugin `@tailwindcss/vite`, ale w trybie
okrojonym:

- W `src/styles/global.css` importujemy **tylko warstwy `theme` i
  `utilities`** (`@import 'tailwindcss/theme.css' / 'utilities.css'`).
  **Preflight (reset bazowy) świadomie pomijamy** — ręcznie pisane style
  globalne pozostają jedyną warstwą bazową, więc istniejące komponenty
  wyglądają identycznie.
- **Tokeny projektowe pozostają w CSS custom properties** (`--border`,
  `--surface`, `--accent`, …). Z utilities odwołujemy się do nich przez
  wartości arbitralne: `bg-[var(--surface)]`, `border-[var(--border)]`.
- CSS modules i Tailwind **współistnieją** w `src/ui`: istniejące zaślepki
  zostają na CSS modules, nowe prymitywy mogą być Tailwind-only. Kod
  featurów nadal nie pisze własnego CSS.

## Konsekwencje

- Zero zmian wizualnych w istniejącym UI (brak preflightu).
- Nowe prymitywy (np. `Icon`) nie dodają plików CSS — łatwiej je podmienić
  na komponenty IWA.
- Ścieżka integracji z IWA/PrimeReact (Tailwind w ich repo) jest otwarta;
  w razie potrzeby dołożymy `tailwind-merge` do `cx()`.
- Klasy Tailwinda stają się częścią kontraktu wizualnego prymitywów — testy
  mogą asertować kluczowe klasy (np. `rounded-full`).

## Rozważane alternatywy

- **Pełny Tailwind z preflightem.** Reset nadpisałby ręczne style globalne
  i zmienił wygląd istniejących komponentów; niepotrzebne ryzyko.
- **Dalej tylko CSS modules.** Rozjazd z ekosystemem IWA (Tailwind) i więcej
  boilerplate'u przy prostych prymitywach.
- **Tokeny w `@theme` Tailwinda.** Przeniesienie tokenów do składni Tailwinda
  wiązałoby je z vendorem; CSS variables są neutralne i już używane.
