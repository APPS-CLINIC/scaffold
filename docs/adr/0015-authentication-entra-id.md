# ADR 0015 — Uwierzytelnianie przez Azure Entra ID

- **Status:** Zaakceptowano (kierunek; implementacja przez spike)
- **Data:** 2026-06-22

## Kontekst

Konta użytkowników to integracja z **Azure Entra ID** (odpowiednik Active
Directory). Ze spotkania: tożsamość zalogowanego pracownika korporacji jest
dostępna w nagłówkach (Entra ID), które brama nam przekazuje; wtedy
**weryfikujemy tożsamość i użytkownik zwykle nie musi się logować**. Jeśli nie
jest zalogowany — przekierowanie na **SSO** (z **MFA**). Stan
uwierzytelnienia/konta ma być **trzymany w stanie aplikacji** (Redux).

To duży temat (SSO, MFA, sieć korporacyjna) — wymaga osobnego **spike'a**.

## Decyzja

Uwierzytelnianie opieramy o Entra ID, a w scaffoldzie przygotowujemy szkielet:

- **Slice `auth`** w Redux: tożsamość użytkownika, status sesji, role/uprawnienia.
- **Bootstrap tożsamości** z nagłówków przekazywanych przez bramę (OKAPI —
  [ADR 0017](0017-delivery-docker-azure-pipelines.md)); brak/niewygaśnięcie →
  przekierowanie na SSO.
- `baseApi` ustawia nagłówki uwierzytelnienia przez **`prepareHeaders`**.
- Uprawnienia (różne zespoły mają różny dostęp, np. do pipeline'ów) mapujemy na
  role w slice `auth` i bramkujemy nimi widoki/akcje.

## Konsekwencje

- Komponenty czytają tożsamość/uprawnienia ze store (spójnie z resztą
  architektury — [ADR 0007](0007-redux-toolkit-and-rtk-query.md)).
- Konkretny mechanizm SSO/MFA i przepływ nagłówków ustala spike (zależny od
  konfiguracji sieci/bramy).
- Trzeba zaplanować ścieżkę „niezalogowany" i odświeżanie/wygasanie sesji.

## Rozważane alternatywy

- **Własny logowanie/hasła.** Niedozwolone — standard korporacyjny to Entra ID/SSO.
- **Tożsamość tylko lokalnie w komponencie.** Brak współdzielenia z API i
  widokami; niespójne z architekturą Redux.
