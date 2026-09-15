import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { makeStore, type RootState } from '@/app/store';
import type { GenericDataTableConfig, GenericDataTableFieldConfig } from '@/ui';
import { useTableColumnSettings } from './useTableColumnSettings';

interface TestRow {
  id: number;
  name: string;
  status: string;
  note: string | null;
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

const testTableConfig: GenericDataTableConfig<TestRow> & { id: string } = {
  id: 'test',
  dataKey: 'id',
  fields: [name, status, note],
};

function renderSettings(preloadedState?: Partial<RootState>) {
  const store = makeStore(preloadedState);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const rendered = renderHook(() => useTableColumnSettings(testTableConfig), { wrapper });

  return { store, ...rendered };
}

const storedColumns = (store: ReturnType<typeof makeStore>) =>
  store.getState().tableSettings.tables.test?.columns;

describe('useTableColumnSettings', () => {
  it('returns the input configuration itself when nothing is stored', () => {
    const { result, rerender } = renderSettings();

    expect(result.current.config).toBe(testTableConfig);
    expect(result.current.columns).toEqual(['name', 'status', 'note']);

    const { config, columns } = result.current;
    rerender();
    expect(result.current.config).toBe(config);
    expect(result.current.columns).toBe(columns);
  });

  it('applies a stored subset and order to the fields', () => {
    const { result } = renderSettings({
      tableSettings: { tables: { test: { columns: ['note', 'name'] } } },
    });

    expect(result.current.config).not.toBe(testTableConfig);
    expect(result.current.config.id).toBe('test');
    expect(result.current.config.dataKey).toBe('id');
    expect(result.current.config.fields).toEqual([note, name]);
    expect(result.current.columns).toEqual(['note', 'name']);
  });

  it('drops stored names the configuration does not know', () => {
    const { result } = renderSettings({
      tableSettings: { tables: { test: { columns: ['ghost', 'status', 'phantom'] } } },
    });

    expect(result.current.config.fields).toEqual([status]);
    expect(result.current.columns).toEqual(['status']);
  });

  it('falls back to the configuration when nothing stored resolves', () => {
    const { result } = renderSettings({
      tableSettings: { tables: { test: { columns: ['ghost'] } } },
    });

    expect(result.current.config).toBe(testTableConfig);
    expect(result.current.columns).toEqual(['name', 'status', 'note']);
  });

  it('saves a customized column list and re-resolves the configuration', () => {
    const { result, store } = renderSettings();

    act(() => result.current.saveColumns(['status', 'name']));

    expect(storedColumns(store)).toEqual(['status', 'name']);
    expect(result.current.config.fields).toEqual([status, name]);
    expect(result.current.columns).toEqual(['status', 'name']);
  });

  it('removes the entry instead of saving a list equal to the default', () => {
    const { result, store } = renderSettings({
      tableSettings: { tables: { test: { columns: ['note'] } } },
    });

    act(() => result.current.saveColumns(['name', 'status', 'note']));

    expect(storedColumns(store)).toBeUndefined();
    expect(result.current.config).toBe(testTableConfig);
  });

  it('treats a reordered full list as a customization', () => {
    const { result, store } = renderSettings();

    act(() => result.current.saveColumns(['note', 'status', 'name']));

    expect(storedColumns(store)).toEqual(['note', 'status', 'name']);
    expect(result.current.columns).toEqual(['note', 'status', 'name']);
  });

  it('restores the defaults', () => {
    const { result, store } = renderSettings({
      tableSettings: { tables: { test: { columns: ['note'] }, other: { columns: ['id'] } } },
    });

    act(() => result.current.restoreDefaults());

    expect(storedColumns(store)).toBeUndefined();
    expect(store.getState().tableSettings.tables.other?.columns).toEqual(['id']);
    expect(result.current.config).toBe(testTableConfig);
    expect(result.current.columns).toEqual(['name', 'status', 'note']);
  });
});
