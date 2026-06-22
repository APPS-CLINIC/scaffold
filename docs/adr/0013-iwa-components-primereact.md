# ADR 0013 — IWA Components (PrimeReact) jako biblioteka UI za szwem `@/ui`

- **Status:** Zaakceptowano (kierunek; szczegóły zależne od dostępu do repo IWA)
- **Data:** 2026-06-22
- **Powiązane:** rozwija [ADR 0011](0011-ui-seam-no-bundled-ui-library.md)

## Kontekst

[ADR 0011](0011-ui-seam-no-bundled-ui-library.md) ustanowił szew UI (`@/ui`) bez
wskazania konkretnej biblioteki. Ze spotkania planistycznego wynika, że
wewnętrzną biblioteką organizacji są **IWA Components** (ING), zbudowane na
**PrimeReact** (+ PrimeIcons, PrimeFlex), w repozytorium z **Tailwind**,
**React Router** i **Toastify** (notyfikacje).

Otwarta pozostaje kwestia, **co dokładnie dostarczy zespół IWA**: gotowe
„organizmy" (całe formatki) czy tylko atomy/molekuły. Padła decyzja, że do czasu
integracji będziemy komponenty **tymczasowo nadpisywać** („nawet brzydko, żeby
działało, a później podepniemy pod normalną IWĘ").

## Decyzja

Celem szwu `@/ui` są **IWA Components (PrimeReact)**:

- Kontrakty propsów w `@/ui` projektujemy tak, by docelowo były re-eksportami /
  cienkimi wrapperami komponentów IWA, a nie generycznych zaślepek.
- Pierwsze zadanie integracyjne: **„Hello World z IWĄ"** — renderowanie jednego
  realnego komponentu IWA, by zweryfikować dostęp, proxy i build.
- Dokładamy do szwu prymityw **Toast/Notification** (odpowiednik Toastify /
  PrimeReact Toast).
- Jeśli IWA wymaga **Tailwind**, włączamy Tailwind + `tailwind-merge`
  (mamy już `src/ui/cx.ts` jako punkt zaczepienia).
- Dopóki nie ma dostępu do repo IWA — zaślepki zostają zgodne z kontraktem; po
  uzyskaniu dostępu podmieniamy implementacje w jednym folderze.

## Konsekwencje

- Reszta kodu (`features/**`, `routes/**`) pozostaje niezależna od PrimeReact —
  wymiana zaślepek na IWA dzieje się w `@/ui`.
- Trzeba uzyskać **dostęp obserwatora do repo CMS2/IWA** (osobny spike).
- Ryzyko: jeśli IWA da tylko atomy/molekuły, część „organizmów" budujemy sami —
  kontrakty `@/ui` muszą to wytrzymać.
- Możliwe wymieszanie styli (Tailwind + PrimeFlex) — do zweryfikowania przy
  integracji.

## Rozważane alternatywy

- **Własny design system.** Duplikuje IWA; niezgodne ze standardem organizacji.
- **Bezpośredni import PrimeReact w funkcjach.** Łamie szew z ADR 0011 i wiąże
  kod z konkretnym vendorem.
