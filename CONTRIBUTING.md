# Współtworzenie (Contributing)

To repozytorium pracuje w modelu **GitHub Flow** — lekkim podejściu opartym na
trunku, w którym `main` jest zawsze gotowy do wdrożenia, a cała praca odbywa się
na krótko żyjących gałęziach, scalanych po review przez Pull Requesty.

> Nie znasz jeszcze architektury? Zacznij od [`docs/README.md`](docs/README.md).
> Uzasadnienie decyzji projektowych znajdziesz w rekordach decyzji
> architektonicznych w [`docs/adr/`](docs/adr/README.md).

## Model gałęzi (GitHub Flow)

```
 main  ──●─────────●─────────────●────────●──►   (zawsze zielony, zawsze wdrażalny)
          \         \             ▲        ▲
           \         \            │ PR     │ PR
            ●──●──●    ●──●──●─────┘        │
        docs/scaffold-and-config           │
                       feature/items-export┘
```

Zasady modelu:

1. **`main` jest chroniony i zawsze gotowy do wydania.** Nigdy nie commituj
   bezpośrednio na niego.
2. **Każda zmiana zaczyna się od gałęzi** odbitej od najnowszego `main`.
3. **Otwórz Pull Request wcześnie.** To miejsce na dyskusję i CI.
4. **CI musi być zielone** (lint, typecheck, testy, build) przed scaleniem.
5. **Co najmniej jedna akceptująca recenzja** przed scaleniem.
6. **Scalaj przez squash**, żeby `main` miał jeden czytelny, semantyczny commit
   na zmianę.
7. **Usuń gałąź** po scaleniu. Gałęzie są tanie i krótko żyjące.

### Nazewnictwo gałęzi

`<typ>/<krótkie-podsumowanie-kebab>` — to samo słownictwo `<typ>` co w commitach:

| Typ         | Do czego                                            | Przykład                          |
| ----------- | --------------------------------------------------- | --------------------------------- |
| `feat/`     | funkcja widoczna dla użytkownika                    | `feat/items-csv-export`           |
| `fix/`      | poprawka błędu                                      | `fix/pagination-off-by-one`       |
| `chore/`    | narzędzia, zależności, konfiguracja, hydraulika     | `chore/bump-vite-6`               |
| `docs/`     | wyłącznie dokumentacja                              | `docs/scaffold-and-config`        |
| `refactor/` | zmiana kodu bez zmiany zachowania                   | `refactor/extract-url-state-hook` |
| `test/`     | wyłącznie testy                                     | `test/items-toolbar`              |

Trzymaj gałęzie **małe i jednocelowe** — gałąź powinna odpowiadać jednemu PR-owi
i jednej recenzowalnej myśli.

## Konwencja commitów (Conventional Commits)

```
<typ>(<opcjonalny zakres>): <podsumowanie w trybie rozkazującym>

<opcjonalne ciało — „dlaczego", zawijane ok. 72 kolumn>

<opcjonalna stopka — BREAKING CHANGE:, refs #123>
```

Przykłady:

```
feat(items): add CSV export to the toolbar
fix(url-state): reset page to 1 when a filter changes
docs(adr): record the URL-as-source-of-truth decision
chore: bump vite to 6.1 via overrides
```

Typy: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `build`,
`ci`, `style`, `revert`. To słownictwo czyni historię łatwą do przeszukiwania
(grep) i otwiera drogę do automatycznych changelogów/semver w przyszłości.

## Lokalne bramki jakości

Te same kontrole, które uruchamia CI, są dostępne lokalnie, a najważniejsze z
nich odpalają się automatycznie przy commicie dzięki **Husky** + **lint-staged**
(zob. [`docs/adr/0004-code-quality-gates.md`](docs/adr/0004-code-quality-gates.md)):

```bash
npm install         # raz, aby zainstalować zależności i hooki Git (prepare)
npm run lint        # ESLint
npm run typecheck   # tsc (build projektu, bez emisji)
npm test            # Vitest
npm run build       # typecheck + build produkcyjny
npm run format      # Prettier --write
```

Przy `git commit` lint-staged auto-poprawia i formatuje wyłącznie zastagowane
pliki, więc zielony commit lokalnie to już większość drogi do zielonego PR-a.

## Lista kontrolna Pull Requesta

- [ ] Gałąź nazwana `<typ>/<podsumowanie>` i odbita od najnowszego `main`.
- [ ] Commity zgodne z Conventional Commits.
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` — wszystko
      przechodzi.
- [ ] Zmiany zachowania są pokryte testami.
- [ ] Istotne architektonicznie decyzje są zapisane jako
      [ADR](docs/adr/README.md).
- [ ] Opis PR-a wyjaśnia **dlaczego**, a nie tylko co.
