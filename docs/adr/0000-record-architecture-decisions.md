# ADR 0000 — Prowadzenie rekordów decyzji architektonicznych

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Scaffold to z definicji stos decyzji podjętych za kogoś: które narzędzie build,
jak ścisły jest system typów, gdzie żyje stan, jak URL ma się do UI. Gdy te
decyzje są niewidoczne, każdy nowy współtwórca rozważa je od nowa, a na pytanie
„dlaczego to tak działa?" nie ma innej odpowiedzi niż `git blame`.

Chcemy, aby *uzasadnienie* było trwałym artefaktem pierwszej klasy — nie
zakopanym w czatach, wątkach PR-ów czy czyjejś pamięci.

## Decyzja

Prowadzimy **rekordy decyzji architektonicznych** w `docs/adr/`, jeden plik
Markdown na decyzję, numerowane kolejno (`0001`, `0002`, …).

Każdy ADR korzysta z tego lekkiego szablonu:

```markdown
# ADR NNNN — <krótki tytuł>

- **Status:** Proponowane | Zaakceptowano | Zastąpione przez ADR-XXXX | Wycofane
- **Data:** RRRR-MM-DD

## Kontekst
Co wymusza tę decyzję? Ograniczenia, wymagania, kompromisy w grze.

## Decyzja
Co postanowiliśmy, powiedziane wprost.

## Konsekwencje
Co staje się łatwiejsze, co trudniejsze, z czym musimy teraz żyć.

## Rozważane alternatywy
Co jeszcze rozważaliśmy i dlaczego tego nie wybraliśmy.
```

Konwencje:

- ADR-y są **niezmienne po zaakceptowaniu.** Aby zmienić decyzję, napisz nowy
  ADR i ustaw status starego na *Zastąpione przez ADR-XXXX*.
- Istotne decyzje powinny być linkowane z odpowiedniego dokumentu w
  [`docs/steps/`](../steps/).

## Konsekwencje

- Nowi współtwórcy mogą przeczytać *dlaczego*, zamiast je odtwarzać.
- PR-y zmieniające architekturę powinny dodawać lub zastępować ADR, co utrzymuje
  zapis aktualnym.
- Niewielki narzut na każdą istotną decyzję — akceptowany jako tania polisa.

## Rozważane alternatywy

- **Jeden plik `ARCHITECTURE.md`.** Rozrasta się w nierecenzowalnego molocha i
  traci kontekst/status pojedynczych decyzji.
- **Tylko komunikaty commitów / opisy PR-ów.** Nieodkrywalne; przywiązane do
  platformy hostującej; łatwe do zgubienia.
