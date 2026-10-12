import { describe, expect, it } from 'vitest';
import {
  isFilterableField,
  pickTableFilters,
  replaceTableFilters,
  tableFilterParam,
} from './tableFilterValues';
import type { TableFilterDeclaration, TableFilterField } from './TableFilters.types';

const declaration: TableFilterDeclaration = {
  render: () => <span />,
  renderChip: () => <span />,
};

describe('table filter values', () => {
  it('tells fields with a filter from fields without one', () => {
    const plain: TableFilterField = { field: 'kkf', labelKey: 'customers.table.field.kkf' };
    const filterable: TableFilterField = {
      field: 'status',
      labelKey: 'customers.table.field.status',
      filter: declaration,
    };

    expect(isFilterableField(plain)).toBe(false);
    expect(isFilterableField(filterable)).toBe(true);
  });

  it('filters by the field name unless the field names its own param', () => {
    expect(tableFilterParam({ field: 'status' })).toBe('status');
    expect(tableFilterParam({ field: 'groupName', filterParam: 'groupId' })).toBe('groupId');
  });

  it("picks the non-empty values of the given fields' params, dotted parts included", () => {
    expect(
      pickTableFilters(
        {
          status: ['ACTIVE'],
          type: [],
          groupId: ['17'],
          'reviewDate.from': ['2026-02-01'],
          'reviewDate.to': [],
          reviewDateLimit: ['x'],
          owner: ['mine'],
        },
        [
          { field: 'type' },
          { field: 'status' },
          { field: 'groupName', filterParam: 'groupId' },
          { field: 'reviewDate' },
        ],
      ),
    ).toEqual({ status: ['ACTIVE'], groupId: ['17'], 'reviewDate.from': ['2026-02-01'] });
  });

  it('never mistakes an Object.prototype member for a filter value', () => {
    expect(pickTableFilters({}, [{ field: 'constructor' }, { field: 'toString' }])).toEqual({});
  });

  it("replaces the given fields' params and keeps the others", () => {
    expect(
      replaceTableFilters(
        { status: ['ACTIVE'], 'reviewDate.from': ['2026-02-01'], owner: ['mine'] },
        [{ field: 'status' }, { field: 'reviewDate' }],
        { 'reviewDate.to': ['2026-03-31'], other: ['ignored'] },
      ),
    ).toEqual({ owner: ['mine'], 'reviewDate.to': ['2026-03-31'] });
  });
});
