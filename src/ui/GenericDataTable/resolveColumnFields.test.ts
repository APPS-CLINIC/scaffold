import { describe, expect, it } from 'vitest';
import type { GenericDataTableFieldConfig } from './GenericDataTable.types';
import { resolveColumnFields } from './resolveColumnFields';

interface TestRow {
  id: number;
  name: string;
  status: string;
  note: string | null;
  metadata: string;
}

const name: GenericDataTableFieldConfig<TestRow> = {
  field: 'name',
  labelKey: 'customers.table.field.fullName',
  width: 160,
  alwaysVisible: true,
};
const status: GenericDataTableFieldConfig<TestRow> = {
  field: 'status',
  labelKey: 'customers.table.field.status',
  width: 120,
};
const note: GenericDataTableFieldConfig<TestRow> = {
  field: 'note',
  labelKey: 'customers.table.field.grid',
  width: 140,
};
const metadata: GenericDataTableFieldConfig<TestRow> = {
  field: 'metadata',
  labelKey: 'customers.table.field.kkf',
  width: 180,
};

const fields: readonly GenericDataTableFieldConfig<TestRow>[] = [name, status, note, metadata];

const idsOf = (list: readonly GenericDataTableFieldConfig<TestRow>[]) =>
  list.map((field) => field.field);

describe('resolveColumnFields', () => {
  it('returns the configured fields themselves when no column list is given', () => {
    expect(resolveColumnFields(fields, undefined)).toBe(fields);
  });

  it('reorders the configured fields to match the column list', () => {
    const resolved = resolveColumnFields(fields, ['status', 'metadata', 'name', 'note']);

    expect(idsOf(resolved)).toEqual(['status', 'metadata', 'name', 'note']);
    // The field configs are the configured objects, not copies.
    expect(resolved[0]).toBe(status);
    expect(resolved[2]).toBe(name);
  });

  it('keeps only the listed fields', () => {
    expect(idsOf(resolveColumnFields(fields, ['note', 'name']))).toEqual(['note', 'name']);
  });

  it('drops names the config does not know', () => {
    expect(idsOf(resolveColumnFields(fields, ['status', 'ghost', 'name']))).toEqual([
      'status',
      'name',
    ]);
  });

  it('drops repeated names, keeping the first occurrence', () => {
    expect(idsOf(resolveColumnFields(fields, ['status', 'name', 'status', 'name']))).toEqual([
      'status',
      'name',
    ]);
  });

  it('falls back to the configured fields when nothing resolves', () => {
    expect(resolveColumnFields(fields, [])).toBe(fields);
    expect(resolveColumnFields(fields, ['ghost', 'phantom'])).toBe(fields);
  });

  it('returns the configured fields themselves when the list equals the default', () => {
    expect(resolveColumnFields(fields, ['name', 'status', 'note', 'metadata'])).toBe(fields);
    // Unknown and repeated names do not break the equality either.
    expect(
      resolveColumnFields(fields, ['name', 'ghost', 'status', 'note', 'metadata', 'name']),
    ).toBe(fields);
  });

  it('returns a new array when the list differs from the default', () => {
    expect(resolveColumnFields(fields, ['name', 'status', 'note'])).not.toBe(fields);
    expect(resolveColumnFields(fields, ['status', 'name', 'note', 'metadata'])).not.toBe(fields);
  });
});
