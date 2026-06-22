# Dokumentacja

Dokumentacja techniczna projektu Scaffold, zorganizowana jako **narracja
budowy krok po kroku** oraz zestaw **rekordów decyzji architektonicznych
(ADR — Architecture Decision Records)**.

Cel: każdy może przeczytać ten folder od góry do dołu i zrozumieć nie tylko
*co* zawiera scaffold, ale i *dlaczego* każdy element ma taki, a nie inny
kształt.

## Jak zorganizowana jest dokumentacja

```
docs/
├─ README.md            ← jesteś tutaj (spis treści)
├─ steps/               ← budowa opowiedziana jako uporządkowane, samodzielne kroki
│  ├─ 01-scaffold-and-config.md
│  └─ 02-app-architecture.md
└─ adr/                 ← „dlaczego": jedna decyzja na plik, niezmienna po akceptacji
   ├─ README.md
   ├─ 0000-record-architecture-decisions.md
   └─ ...
```

- **Kroki (steps)** to przewodnik. Czytaj po kolei, aby zbudować model mentalny.
- **ADR-y** to trwały zapis pojedynczych decyzji — każdy z kontekstem, decyzją
  i konsekwencjami. Są odnośnikowane z kroków.

## Kroki budowy

| Krok | Gałąź                         | Co ustanawia                                                   |
| ---- | ----------------------------- | ------------------------------------------------------------- |
| 01   | `docs/scaffold-and-config`    | Narzędzia, konfiguracja języka, bramki jakości, proces.       |
| 02   | `docs/app-architecture`       | Architektura runtime: stan, dane, stan widoku w URL, UI.      |

> **Proces:** rozwój zgodnie z **GitHub Flow** — zob.
> [`../CONTRIBUTING.md`](../CONTRIBUTING.md), gdzie opisano model gałęzi,
> konwencję commitów i listę kontrolną PR.

## Rekordy decyzji architektonicznych

Pełna, zindeksowana lista znajduje się w [`adr/README.md`](adr/README.md).
