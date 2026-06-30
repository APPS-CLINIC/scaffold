# ADR 0006 — URL jako jedyne źródło prawdy dla stanu widoku

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Dla widoku listy data-heavy „odpytywalny" stan widoku — tekst wyszukiwania,
filtry, sortowanie (pole/kierunek), paginacja — musi być **udostępnialny,
zakładkowalny i przetrwać przeładowanie**. Jeśli ten stan żyje tylko w stanie
komponentu lub w Redux, skopiowany link go traci, a przycisk „wstecz" robi coś
niewłaściwego.

## Decyzja

Czynimy **URL jedynym źródłem prawdy** dla odpytywalnego stanu widoku, ze ściśle
**jednokierunkowym** przepływem do Redux:

```
 zapis                                odczyt
 useListQueryState.setQuery(...)       useAppSelector(selectListQuery)
        │                                        ▲
        ▼                                        │
 setSearchParams ─▶ URL React Router ─▶ <UrlStateSync/> ─▶ slice urlState (lustro)
```

- **Zapisy** przechodzą przez `useListQueryState().setQuery()`
  ([`useListQueryState.ts`](../../src/features/urlState/useListQueryState.ts)),
  który serializuje do search params przez `setSearchParams`.
- Zmiana URL wraca przez
  [`UrlStateSync`](../../src/features/urlState/UrlStateSync.tsx) — zamontowany
  raz w layoucie głównym — który parsuje parametry i odzwierciedla je w slice
  `urlState`.
- **Odczyty** dzieją się z lustra przez selektory reselect (zob.
  [ADR 0009](0009-reselect-and-listener-middleware.md)).

**Nie ma wiązania dwukierunkowego**: store nigdy nie zapisuje z powrotem do URL,
więc nie ma pętli synchronizacji.

Aby uniknąć błysku stanu domyślnego przy linkach głębokich, `main.tsx` wczytuje
lustro z `window.location` *przed* pierwszym renderem.

## Konsekwencje

- Każdy widok to udostępnialny, przeładowywalny link; przyciski wstecz/dalej
  „po prostu działają".
- Jeden kierunek przepływu danych → brak pętli sprzężenia, łatwo rozumować.
- Lustro umożliwia „dopalacze" Redux (selektory łączące stan URL z cache/UI;
  listener middleware reagujące na zmiany URL — np. prefetch).
- Niewielka pośredniość: zapis to „nawiguj, potem obserwuj", nie bezpośrednie
  ustawienie stanu. Strażnik w `UrlStateSync` (porównanie płytkie) czyni to
  tanim.

## Rozważane alternatywy

- **Stan tylko w Redux/komponencie.** Traci udostępnialność, przeładowanie i
  historię.
- **Wiązanie dwukierunkowe URL↔store.** Zaprasza pętle synchronizacji i
  niejednoznaczne właścicielstwo.
- **Loadery routera jako jedyny stan.** Działa, ale to lustro Redux pozwala
  selektorom/middleware łączyć stan URL z cache i stanem UI.
