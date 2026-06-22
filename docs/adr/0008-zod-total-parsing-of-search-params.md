# ADR 0008 — Totalne parsowanie search params przez Zod

- **Status:** Zaakceptowano
- **Data:** 2026-06-22

## Kontekst

Search params to **niezaufane wejście**: użytkownicy ręcznie edytują URL-e,
udostępniają nieaktualne linki, a zakładki przeżywają zmiany schematu. Jeśli
parsowanie może rzucić wyjątek lub dać zły typ, jeden zły URL wykłada widok.
Chcemy, by parsowanie było **totalne** — każde możliwe wejście mapuje się na
poprawny, typowany obiekt zapytania.

## Decyzja

Definiujemy zapytanie przez **Zod** i czynimy każde pole **`.catch()` z
wartością domyślną**, w
[`urlState.schema.ts`](../../src/features/urlState/urlState.schema.ts):

```ts
export const itemsQuerySchema = z.object({
  q:        z.string().catch(''),
  status:   z.enum(['all', 'active', 'inactive']).catch('all'),
  sort:     z.enum(['name', 'value', 'createdAt']).catch('createdAt'),
  dir:      z.enum(['asc', 'desc']).catch('desc'),
  page:     z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(10).max(200).catch(50),
});
```

Wyprowadzone, bez duplikacji:

- `defaultItemsQuery = itemsQuerySchema.parse({})` — domyślne pochodzą *ze*
  schematu, więc jest jedno źródło prawdy.
- `parseItemsQuery(params)` zamienia `URLSearchParams` w poprawne `ItemsQuery`.
- `serializeItemsQuery(query)` zapisuje parametry z powrotem, **pomijając każdą
  wartość równą domyślnej**, trzymając URL-e krótkimi i udostępnialnymi
  (`/items` zamiast `/items?q=&status=all&page=1&...`).

## Konsekwencje

- Zniekształcony lub nieaktualny URL **nigdy nie wyłoży** aplikacji — złe pola
  spadają do wartości domyślnych pole po polu.
- `ItemsQuery` jest wyprowadzony ze schematu (`z.infer`), więc typ i walidacja
  runtime nie mogą się rozjechać.
- Kanoniczne, minimalne URL-e, bo domyślne są usuwane przy serializacji.
- Koercja jest celowa (`z.coerce.number`) — parametry-stringi stają się
  typowanymi liczbami z wymuszonymi granicami (`min`/`max`).

## Rozważane alternatywy

- **Ręczne parsowanie `URLSearchParams`.** Rozwlekłe i łatwe do pomyłki; brak
  jednego miejsca na domyślne/granice.
- **Walidator rzucający wyjątki (np. samo `.parse` bez `.catch`).** Jeden zły URL
  staje się error boundary; przeciwieństwo tego, czego chcemy dla
  udostępnialnych linków.
- **Tylko typy TypeScript.** Typy znikają w runtime; niezaufane wejście wymaga
  walidacji *runtime*.
