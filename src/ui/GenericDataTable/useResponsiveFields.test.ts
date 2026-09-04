import { describe, expect, it } from 'vitest';
import type { GenericDataTableFieldConfig } from './GenericDataTable.types';
import { EXPANDER_COLUMN_WIDTH_PX, orderFields, splitFieldsByWidth } from './useResponsiveFields';

// The column-fit engine is pure and imports no component, so these assertions hold
// whatever the IWA table renders. GenericDataTable.test.tsx covers the same rules
// through the vendor DOM; this file keeps them covered when that render is not
// available.
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

describe('orderFields', () => {
  it('returns the configured order when no column order is given', () => {
    expect(idsOf(orderFields(fields))).toEqual(['name', 'status', 'note', 'metadata']);
    expect(idsOf(orderFields(fields, []))).toEqual(['name', 'status', 'note', 'metadata']);
  });

  it('puts listed fields first in their listed order, unlisted ones after', () => {
    expect(idsOf(orderFields(fields, ['status', 'name']))).toEqual([
      'status',
      'name',
      'note',
      'metadata',
    ]);
  });
});

describe('splitFieldsByWidth', () => {
  it('keeps every field as a column when they all fit', () => {
    const split = splitFieldsByWidth(fields, 800);

    expect(idsOf(split.visibleFields)).toEqual(['name', 'status', 'note', 'metadata']);
    expect(split.accordionFields).toEqual([]);
  });

  it('drops overflowing fields to the accordion from the end of the order', () => {
    // 400 - 44 (expander) - 160 (pinned name) leaves 196: status fits, the rest drop.
    const split = splitFieldsByWidth(fields, 400);

    expect(idsOf(split.visibleFields)).toEqual(['name', 'status']);
    expect(idsOf(split.accordionFields)).toEqual(['note', 'metadata']);
  });

  it('takes every later field along once one does not fit, preserving order', () => {
    const widened: readonly GenericDataTableFieldConfig<TestRow>[] = [
      name,
      { ...status, width: 200 },
      { ...note, width: 100 },
      metadata,
    ];

    const split = splitFieldsByWidth(widened, 400);

    expect(idsOf(split.visibleFields)).toEqual(['name']);
    expect(idsOf(split.accordionFields)).toEqual(['status', 'note', 'metadata']);
  });

  it('reserves room for the expander only once the columns overflow', () => {
    const twoFields: readonly GenericDataTableFieldConfig<TestRow>[] = [name, status];

    // Exactly the sum of both widths: nothing overflows, so no expander is budgeted
    // and both stay as columns even though 280 + 44 exceeds the container.
    expect(idsOf(splitFieldsByWidth(twoFields, 280).visibleFields)).toEqual(['name', 'status']);

    // One pixel narrower, and the expander reservation applies: 279 - 44 - 160 = 75
    // leaves no room for status.
    expect(EXPANDER_COLUMN_WIDTH_PX).toBe(44);
    expect(idsOf(splitFieldsByWidth(twoFields, 279).visibleFields)).toEqual(['name']);
  });

  it('renders only the pinned minimum before the container is measured', () => {
    const split = splitFieldsByWidth(fields, null);

    expect(idsOf(split.visibleFields)).toEqual(['name']);
    expect(idsOf(split.accordionFields)).toEqual(['status', 'note', 'metadata']);
  });

  it('keeps one column in a pathologically narrow container', () => {
    const optional: readonly GenericDataTableFieldConfig<TestRow>[] = [status, note];

    const split = splitFieldsByWidth(optional, 10);

    expect(idsOf(split.visibleFields)).toEqual(['status']);
    expect(idsOf(split.accordionFields)).toEqual(['note']);
  });

  it('handles an empty field list', () => {
    expect(splitFieldsByWidth([], 800)).toEqual({ visibleFields: [], accordionFields: [] });
  });
});
