import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TABLE_SETTINGS_STORAGE_KEY,
  createLocalStorageTableSettingsStorage,
  createTableSettingsState,
  startTableSettingsPersistence,
  type TableSettingsStorage,
} from '@/features/tableSettings';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import i18n from '@/i18n';
import { installCustomerApiTestTransport } from '@/test/customerApiTestTransport';
import { renderWithProviders } from '@/test/renderWithProviders';
import { mockTableContainerWidth } from '@/test/tableLayout';
import { CustomersView } from './CustomersView';
import { customerTableConfig } from './customerTable';

const appendToHead = document.head.appendChild.bind(document.head);
const defaultColumns: readonly string[] = customerTableConfig.fields.map((field) => field.field);
const columnsWithout = (removed: string) => defaultColumns.filter((field) => field !== removed);
const labelKeyOf = new Map(
  customerTableConfig.fields.map((field) => [field.field as string, field.labelKey] as const),
);
const labelsOf = (columns: readonly string[]) =>
  columns.map((column) => {
    const labelKey = labelKeyOf.get(column);
    return labelKey === undefined ? column : i18n.t(labelKey);
  });

function createMemoryStorage(): Storage {
  const items = new Map<string, string>();

  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
}

function LocationProbe() {
  const { search } = useLocation();
  return <output aria-label="Current customer URL">{search}</output>;
}

let memoryStorage: Storage;
let tableSettingsStorage: TableSettingsStorage;
let stopPersistence: (() => void) | undefined;

// Hydrated from storage before the first render and written by the listener,
// exactly as the app shell wires it.
function renderPage(initialEntry = '/customers/all') {
  return renderWithProviders(
    <>
      <UrlStateSync />
      <CustomersView />
      <LocationProbe />
    </>,
    {
      initialEntries: [initialEntry],
      preloadedState: { tableSettings: createTableSettingsState(tableSettingsStorage.read()) },
    },
  );
}

function storePayload(columns: readonly string[]) {
  memoryStorage.setItem(
    TABLE_SETTINGS_STORAGE_KEY,
    JSON.stringify({ version: 1, tables: { customers: { columns } } }),
  );
}

const currentSearch = () =>
  new URLSearchParams(
    screen.getByRole('status', { name: 'Current customer URL' }).textContent ?? '',
  );
const settingsDialog = () => screen.getByRole('dialog', { name: 'List settings' });
const columnRows = () => within(settingsDialog()).getAllByRole('listitem');
const rowNames = () => columnRows().map((row) => row.textContent);
const usedColumns = () => within(settingsDialog()).getByText(/^Used columns:/).textContent;
const columnHeaderNames = () =>
  screen.getAllByRole('columnheader').map((header) => header.textContent?.trim());
const expandedRegions = () => screen.queryAllByRole('region', { name: /collapse details for/i });

beforeEach(async () => {
  // Wide enough for nine columns; the rest of the fields stay in the accordion.
  mockTableContainerWidth(1380);
  installCustomerApiTestTransport();
  vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T): T => {
    if (node instanceof HTMLStyleElement) return node;
    return appendToHead(node) as T;
  });
  memoryStorage = createMemoryStorage();
  tableSettingsStorage = createLocalStorageTableSettingsStorage(memoryStorage);
  stopPersistence = startTableSettingsPersistence(tableSettingsStorage);
  await i18n.changeLanguage('en');
});

afterEach(() => {
  // The listener middleware is a module singleton: an orphaned registration
  // would keep writing from every later store.
  stopPersistence?.();
  stopPersistence = undefined;
  vi.unstubAllGlobals();
});

describe('CustomersView column settings', () => {
  it('removes a column through the dialog, persists the choice and closes the open rows', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');
    expect(screen.getByRole('columnheader', { name: 'KKF' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /expand details for arcelormittal/i }));
    expect(expandedRegions()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'List settings' }));
    expect(usedColumns()).toBe('Used columns: 26 of 26');
    expect(rowNames()).toEqual(labelsOf(defaultColumns));
    expect(rowNames()[1]).toBe('KKF');

    await user.click(within(settingsDialog()).getByRole('button', { name: 'Remove column 2' }));
    await user.click(within(settingsDialog()).getByRole('button', { name: 'Save' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'KKF' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Customer name' })).toBeInTheDocument();
    expect(expandedRegions()).toHaveLength(0);
    expect(tableSettingsStorage.read()).toEqual({
      version: 1,
      tables: { customers: { columns: columnsWithout('kkf') } },
    });
  });

  it('clears the URL sort once the sorted column is removed', async () => {
    const user = userEvent.setup();
    renderPage('/customers/all?sort=kkf&dir=desc');
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');
    expect(currentSearch().get('sort')).toBe('kkf');

    await user.click(screen.getByRole('button', { name: 'List settings' }));
    await user.click(within(settingsDialog()).getByRole('button', { name: 'Remove column 2' }));
    await user.click(within(settingsDialog()).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(currentSearch().get('sort')).toBeNull();
      expect(currentSearch().get('dir')).toBeNull();
    });
    expect(screen.queryByRole('columnheader', { name: 'KKF' })).not.toBeInTheDocument();
  });

  it('renders the stored columns from the first render on', async () => {
    const user = userEvent.setup();
    storePayload(['status', 'fullName']);
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    expect(columnHeaderNames()).toEqual(['Status', 'Customer name']);
    expect(screen.queryAllByRole('button', { name: /expand details for/i })).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'List settings' }));
    expect(rowNames()).toEqual(['Status', 'Customer name']);
    expect(usedColumns()).toBe('Used columns: 2 of 26');
  });

  it('restores the default columns after confirmation and empties the storage', async () => {
    const user = userEvent.setup();
    storePayload([...columnsWithout('kkf'), 'kkf']);
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');
    expect(screen.queryByRole('columnheader', { name: 'KKF' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /expand details for arcelormittal/i }));
    expect(expandedRegions()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'List settings' }));
    await user.click(within(settingsDialog()).getByRole('button', { name: 'Restore defaults' }));
    const confirm = screen.getByRole('dialog', { name: 'Restoring default settings' });
    await user.click(within(confirm).getByRole('button', { name: 'Restore defaults' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(columnHeaderNames()[1]).toBe('KKF');
    expect(expandedRegions()).toHaveLength(0);
    expect(tableSettingsStorage.read()).toBeUndefined();
    expect(memoryStorage.length).toBe(0);
  });

  it('starts every opening from the saved columns, never from an abandoned draft', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('ARCELORMITTAL WARSAW SP. Z O.O.');

    await user.click(screen.getByRole('button', { name: 'List settings' }));
    await user.click(within(settingsDialog()).getByRole('button', { name: 'Remove column 2' }));
    await user.click(within(settingsDialog()).getByRole('button', { name: 'Save' }));

    await user.click(screen.getByRole('button', { name: 'List settings' }));
    await user.click(within(settingsDialog()).getByRole('button', { name: 'Add column' }));
    expect(columnRows()).toHaveLength(26);
    await user.click(within(settingsDialog()).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'List settings' }));
    expect(rowNames()).toEqual(labelsOf(columnsWithout('kkf')));
    expect(usedColumns()).toBe('Used columns: 25 of 26');
  });
});
