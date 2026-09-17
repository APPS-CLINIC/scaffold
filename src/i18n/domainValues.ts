/**
 * Backend domain vocabularies are English-only identifiers; translations for
 * display live in the message catalogs. Normalization is defensive: unknown
 * labels — and non-string values — resolve to no match, so adapters degrade
 * to `null` instead of crashing on unexpected payloads.
 */
export function normalizeDomainValue(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
