# ADR 0017 — Dostarczanie: Docker + Azure Pipelines + GCP/CDN + brama OKAPI

- **Status:** Zaakceptowano (kierunek; konfiguracja sieci przez spike)
- **Data:** 2026-06-22

## Kontekst

Ze spotkania planistycznego wynika konkretne środowisko dostarczania, inne niż
zakładała wcześniejsza (ogólna) propozycja CI:

- **Repozytorium pracy i backlog: Azure DevOps** („ażurowy", nie Jira/GitHub).
- **CI/CD: Azure Pipelines** (widoczna „ikonka rakiety").
- **Frontend w osobnym kontenerze Docker**, serwowany z **CDN / Google Storage**
  (chmura **GCP**), komunikujący się z backendem przez **bramę OKAPI**.
- Backend to serwis na **Kubernetes**; integracja sieciowa bywa nietrywialna
  („przewierty" przez firewall, proxy).

To koryguje wcześniejsze założenie o GitHub Actions — **CI jest na Azure
Pipelines**.

## Decyzja

- **CI/CD na Azure Pipelines**: `npm ci` → `npm run lint` → `npm run typecheck`
  → `npm test` → `npm run build`, następnie budowa obrazu Docker i publikacja
  artefaktu.
- **Dockerfile** dla frontu (statyczny serwer, np. nginx) w **osobnym
  kontenerze**; artefakty buildu serwowane z **CDN/Google Storage**.
- Adres backendu to **brama OKAPI** — konfigurowana zmienną środowiskową
  (`VITE_API_BASE_URL`, dziś już obecna; docelowo wskazuje OKAPI, nie host
  lokalny).
- Szczegóły sieci (proxy, firewall, mapowanie nazw przez OKAPI) — osobny
  **spike DevOps**; rozważyć wsparcie osoby od infrastruktury.

## Konsekwencje

- Pipeline jakości jest ten sam co lokalnie (ADR 0004) — spójność lokalne↔CI.
- Konteneryzacja izoluje front; cena to konfiguracja sieci OKAPI/CDN/GCP.
- Możliwa przyszła migracja chmury (grupa rozważa Azure) — `VITE_API_BASE_URL` i
  separacja przez OKAPI ograniczają wpływ takiej zmiany.

## Rozważane alternatywy

- **GitHub Actions** (wcześniejsza propozycja). Odrzucone — organizacja używa
  Azure Pipelines.
- **Front i backend w jednym kontenerze.** Rozważone na spotkaniu i odrzucone —
  artefakty frontu i tak serwowane z CDN/GCP, backend na Kubernetes; rekomendacja
  to osobny kontener + OKAPI.
