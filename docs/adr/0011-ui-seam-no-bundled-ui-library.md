# ADR 0011 — Szew UI: brak dołączonej biblioteki UI

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Ten scaffold ma trafiać do organizacji, która ma już **własną wewnętrzną
bibliotekę UI**. Zaszycie na stałe konkretnego design systemu (MUI, Chakra, …)
oznaczałoby późniejsze wyrywanie go i dotykanie każdej funkcji. Ale funkcje wciąż
potrzebują *jakiegoś* `Button`, `TextInput`, `Select`, by budować już dziś.

## Decyzja

Wprowadzamy **szew UI (UI seam)**: cienką warstwę-zaślepkę w
[`src/ui`](../../src/ui/README.md), z której wszystko importuje przez `@/ui`.

- `src/ui/index.ts` eksportuje `Button`, `TextInput`, `Select` itd. z jawnymi
  **kontraktami propsów**. Obecne implementacje to minimalne zaślepki z
  lokalnymi modułami CSS.
- **Cały** `src/features/**` i `src/routes/**` importują z `@/ui` — nigdy
  bezpośrednio z paczki vendora.
- Aby przyjąć prawdziwą bibliotekę, zastąp implementacje w `src/ui`
  re-eksportami/wrapperami komponentów organizacji, **zachowując eksportowane
  nazwy i kontrakty propsów**. Żaden kod funkcji się nie zmienia.

## Konsekwencje

- Vendor UI jest wymienialny w **jednym folderze**; reszta kodu jest od niego
  odizolowana.
- Funkcje można budować i testować już dziś na zaślepkach.
- Kontrakty propsów szwu muszą być honorowane przez podpinaną bibliotekę —
  wrapper jest potrzebny, gdy API komponentu organizacji się różni.
- Zaślepki są celowo nieostylowane/minimalne; `ui.module.css` usuwa się, gdy
  prawdziwa biblioteka wnosi własne stylowanie.

## Rozważane alternatywy

- **Import biblioteki UI bezpośrednio w funkcjach.** Wiąże każdą funkcję z jednym
  vendorem; drogie do zmiany.
- **Przyjęcie konkretnego design systemu teraz.** Zakłada wybór, którego
  organizacja-odbiorca prawdopodobnie dokonała już inaczej.
