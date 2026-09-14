export interface ColumnDraftRow<K extends string> {
  key: number;
  field: K | null;
  /** Added in this editing session: its field is picked with a Select until Save. */
  added: boolean;
  /** Was empty when Save was attempted; picking a field clears it. */
  invalid: boolean;
}

export interface ColumnSettingsDraft<K extends string> {
  /** Every field the table can show, in configuration order. */
  allFields: readonly K[];
  rows: readonly ColumnDraftRow<K>[];
  nextKey: number;
}

export type ColumnSettingsDraftAction<K extends string> =
  | { type: 'rowAdded' }
  | { type: 'rowRemoved'; key: number }
  | { type: 'rowFieldChanged'; key: number; field: K | null }
  | { type: 'rowMoved'; from: number; to: number }
  | { type: 'submitted' };

/** Names absent from `allFields` are dropped, so the draft never holds a stale column. */
export function createColumnSettingsDraft<K extends string>(
  allFields: readonly K[],
  columns: readonly K[],
): ColumnSettingsDraft<K> {
  const known = new Set(allFields);
  const rows = columns
    .filter((field) => known.has(field))
    .map((field, index) => ({ key: index, field, added: false, invalid: false }));

  return { allFields, rows, nextKey: rows.length };
}

export function canAddRow<K extends string>(draft: ColumnSettingsDraft<K>): boolean {
  return draft.rows.length < draft.allFields.length;
}

export function canRemoveRow<K extends string>(draft: ColumnSettingsDraft<K>): boolean {
  return draft.rows.length > 1;
}

export function isDraftValid<K extends string>(draft: ColumnSettingsDraft<K>): boolean {
  return draft.rows.every((row) => row.field !== null);
}

/** The filled rows, in order — what Save hands to the owner. */
export function selectDraftColumns<K extends string>(draft: ColumnSettingsDraft<K>): readonly K[] {
  return draft.rows.flatMap((row) => (row.field === null ? [] : [row.field]));
}

/** `allFields` in configuration order minus the fields chosen by the other rows. */
export function selectAvailableFields<K extends string>(
  draft: ColumnSettingsDraft<K>,
  rowKey: number,
): readonly K[] {
  const takenByOthers = new Set(
    draft.rows.flatMap((row) => (row.key === rowKey || row.field === null ? [] : [row.field])),
  );

  return draft.allFields.filter((field) => !takenByOthers.has(field));
}

function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const moved = [...items];
  const [item] = moved.splice(from, 1);
  if (item === undefined) return moved;
  moved.splice(to, 0, item);

  return moved;
}

export function columnSettingsDraftReducer<K extends string>(
  draft: ColumnSettingsDraft<K>,
  action: ColumnSettingsDraftAction<K>,
): ColumnSettingsDraft<K> {
  switch (action.type) {
    case 'rowAdded':
      if (!canAddRow(draft)) return draft;

      return {
        ...draft,
        rows: [...draft.rows, { key: draft.nextKey, field: null, added: true, invalid: false }],
        nextKey: draft.nextKey + 1,
      };
    case 'rowRemoved':
      if (!canRemoveRow(draft)) return draft;

      return { ...draft, rows: draft.rows.filter((row) => row.key !== action.key) };
    case 'rowFieldChanged':
      return {
        ...draft,
        rows: draft.rows.map((row) =>
          row.key === action.key
            ? { ...row, field: action.field, invalid: row.invalid && action.field === null }
            : row,
        ),
      };
    case 'rowMoved': {
      const { from, to } = action;
      const inRange = (index: number) => index >= 0 && index < draft.rows.length;
      if (from === to || !inRange(from) || !inRange(to)) return draft;

      return { ...draft, rows: moveItem(draft.rows, from, to) };
    }
    case 'submitted':
      if (!draft.rows.some((row) => row.field === null && !row.invalid)) return draft;

      return {
        ...draft,
        rows: draft.rows.map((row) => (row.field === null ? { ...row, invalid: true } : row)),
      };
  }
}
