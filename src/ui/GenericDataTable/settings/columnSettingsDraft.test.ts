import { describe, expect, it } from 'vitest';
import {
  canAddRow,
  canRemoveRow,
  columnSettingsDraftReducer,
  createColumnSettingsDraft,
  isDraftValid,
  selectAvailableFields,
  selectDraftColumns,
  type ColumnSettingsDraft,
} from './columnSettingsDraft';

type Field = 'name' | 'status' | 'grid' | 'note';

const allFields: readonly Field[] = ['name', 'status', 'grid', 'note'];

function fieldsOf(draft: ColumnSettingsDraft<Field>): (Field | null)[] {
  return draft.rows.map((row) => row.field);
}

function marksOf(draft: ColumnSettingsDraft<Field>): boolean[] {
  return draft.rows.map((row) => row.invalid);
}

describe('createColumnSettingsDraft', () => {
  it('creates one unmarked row per column, in order, with sequential keys', () => {
    const draft = createColumnSettingsDraft(allFields, ['grid', 'name']);

    expect(draft.rows).toEqual([
      { key: 0, field: 'grid', added: false, invalid: false },
      { key: 1, field: 'name', added: false, invalid: false },
    ]);
    expect(draft.nextKey).toBe(2);
    expect(draft.allFields).toBe(allFields);
  });

  it('drops names the configuration does not know', () => {
    const columns = ['name', 'legacy', 'status'] as Field[];
    const draft = createColumnSettingsDraft(allFields, columns);

    expect(fieldsOf(draft)).toEqual(['name', 'status']);
  });
});

describe('columnSettingsDraftReducer', () => {
  it('appends an empty added row and stops at the size of the universe', () => {
    let draft = createColumnSettingsDraft(allFields, ['name', 'status', 'grid']);
    expect(canAddRow(draft)).toBe(true);

    draft = columnSettingsDraftReducer(draft, { type: 'rowAdded' });
    expect(draft.rows.at(-1)).toEqual({ key: 3, field: null, added: true, invalid: false });
    expect(draft.nextKey).toBe(4);
    expect(canAddRow(draft)).toBe(false);

    const capped = columnSettingsDraftReducer(draft, { type: 'rowAdded' });
    expect(capped).toBe(draft);
  });

  it('removes a row by key and keeps the last one', () => {
    let draft = createColumnSettingsDraft(allFields, ['name', 'status']);
    expect(canRemoveRow(draft)).toBe(true);

    draft = columnSettingsDraftReducer(draft, { type: 'rowRemoved', key: 0 });
    expect(draft.rows).toEqual([{ key: 1, field: 'status', added: false, invalid: false }]);
    expect(canRemoveRow(draft)).toBe(false);

    const kept = columnSettingsDraftReducer(draft, { type: 'rowRemoved', key: 1 });
    expect(kept).toBe(draft);
  });

  it('changes the field of one row only', () => {
    const draft = createColumnSettingsDraft(allFields, ['name', 'status']);

    const changed = columnSettingsDraftReducer(draft, {
      type: 'rowFieldChanged',
      key: 1,
      field: 'grid',
    });
    expect(fieldsOf(changed)).toEqual(['name', 'grid']);

    const cleared = columnSettingsDraftReducer(changed, {
      type: 'rowFieldChanged',
      key: 1,
      field: null,
    });
    expect(fieldsOf(cleared)).toEqual(['name', null]);
  });

  it('keeps the added mark with its row through field changes and moves', () => {
    let draft = createColumnSettingsDraft(allFields, ['name', 'status']);
    draft = columnSettingsDraftReducer(draft, { type: 'rowAdded' });
    draft = columnSettingsDraftReducer(draft, { type: 'rowFieldChanged', key: 2, field: 'grid' });
    draft = columnSettingsDraftReducer(draft, { type: 'rowMoved', from: 2, to: 0 });

    expect(draft.rows.map((row) => [row.field, row.added])).toEqual([
      ['grid', true],
      ['name', false],
      ['status', false],
    ]);
  });

  it('moves a row down, up, and ignores a no-op or out-of-range move', () => {
    const draft = createColumnSettingsDraft(allFields, ['name', 'status', 'grid']);

    const down = columnSettingsDraftReducer(draft, { type: 'rowMoved', from: 0, to: 2 });
    expect(fieldsOf(down)).toEqual(['status', 'grid', 'name']);

    const up = columnSettingsDraftReducer(down, { type: 'rowMoved', from: 2, to: 0 });
    expect(fieldsOf(up)).toEqual(['name', 'status', 'grid']);

    expect(columnSettingsDraftReducer(draft, { type: 'rowMoved', from: 1, to: 1 })).toBe(draft);
    expect(columnSettingsDraftReducer(draft, { type: 'rowMoved', from: 1, to: 3 })).toBe(draft);
    expect(columnSettingsDraftReducer(draft, { type: 'rowMoved', from: -1, to: 0 })).toBe(draft);
  });

  it('never mutates the previous draft', () => {
    const draft = columnSettingsDraftReducer(
      createColumnSettingsDraft(allFields, ['name', 'status']),
      { type: 'rowAdded' },
    );
    const rowsBefore = draft.rows.map((row) => ({ ...row }));

    columnSettingsDraftReducer(draft, { type: 'rowMoved', from: 0, to: 1 });
    columnSettingsDraftReducer(draft, { type: 'rowAdded' });
    columnSettingsDraftReducer(draft, { type: 'rowRemoved', key: 0 });
    columnSettingsDraftReducer(draft, { type: 'rowFieldChanged', key: 0, field: 'grid' });
    columnSettingsDraftReducer(draft, { type: 'submitted' });

    expect(draft.rows).toEqual(rowsBefore);
  });

  it('marks the rows that are empty on Save, and only once', () => {
    let draft = createColumnSettingsDraft(allFields, ['name']);
    draft = columnSettingsDraftReducer(draft, { type: 'rowAdded' });

    const submitted = columnSettingsDraftReducer(draft, { type: 'submitted' });
    expect(marksOf(submitted)).toEqual([false, true]);
    expect(columnSettingsDraftReducer(submitted, { type: 'submitted' })).toBe(submitted);
  });

  it('leaves a draft without empty rows untouched on Save', () => {
    const draft = createColumnSettingsDraft(allFields, ['name']);

    expect(columnSettingsDraftReducer(draft, { type: 'submitted' })).toBe(draft);
  });

  it('starts a row added after Save unmarked', () => {
    let draft = createColumnSettingsDraft(allFields, ['name']);
    draft = columnSettingsDraftReducer(draft, { type: 'rowAdded' });
    draft = columnSettingsDraftReducer(draft, { type: 'submitted' });
    draft = columnSettingsDraftReducer(draft, { type: 'rowRemoved', key: 1 });

    draft = columnSettingsDraftReducer(draft, { type: 'rowAdded' });

    expect(draft.rows.map((row) => [row.key, row.invalid])).toEqual([
      [0, false],
      [2, false],
    ]);
  });

  it('keeps a mark while its row stays empty and clears it once a field is picked', () => {
    let draft = createColumnSettingsDraft(allFields, ['name']);
    draft = columnSettingsDraftReducer(draft, { type: 'rowAdded' });
    draft = columnSettingsDraftReducer(draft, { type: 'submitted' });

    draft = columnSettingsDraftReducer(draft, { type: 'rowFieldChanged', key: 1, field: null });
    expect(marksOf(draft)).toEqual([false, true]);

    draft = columnSettingsDraftReducer(draft, { type: 'rowFieldChanged', key: 1, field: 'grid' });
    expect(marksOf(draft)).toEqual([false, false]);
  });
});

describe('selectors', () => {
  it('lists the filled rows in order as the columns', () => {
    let draft = createColumnSettingsDraft(allFields, ['grid', 'name']);
    draft = columnSettingsDraftReducer(draft, { type: 'rowAdded' });

    expect(selectDraftColumns(draft)).toEqual(['grid', 'name']);
  });

  it('is valid only while no row is empty', () => {
    const draft = createColumnSettingsDraft(allFields, ['grid', 'name']);
    expect(isDraftValid(draft)).toBe(true);

    const withEmpty = columnSettingsDraftReducer(draft, { type: 'rowAdded' });
    expect(isDraftValid(withEmpty)).toBe(false);

    const filled = columnSettingsDraftReducer(withEmpty, {
      type: 'rowFieldChanged',
      key: 2,
      field: 'note',
    });
    expect(isDraftValid(filled)).toBe(true);
  });

  it('offers a row the unused fields plus its own, in configuration order', () => {
    let draft = createColumnSettingsDraft(allFields, ['grid', 'name']);
    draft = columnSettingsDraftReducer(draft, { type: 'rowAdded' });

    expect(selectAvailableFields(draft, 0)).toEqual(['status', 'grid', 'note']);
    expect(selectAvailableFields(draft, 1)).toEqual(['name', 'status', 'note']);
    expect(selectAvailableFields(draft, 2)).toEqual(['status', 'note']);
  });
});
