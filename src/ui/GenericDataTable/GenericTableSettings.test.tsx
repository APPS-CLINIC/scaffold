import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { GenericTableSettingsProps } from './GenericDataTable.types';
import { GenericTableSettings } from './GenericTableSettings';

const rows = [{ id: 1 }, { id: 2 }];

function renderSettings(
  props: Partial<
    Pick<
      GenericTableSettingsProps<{ id: number }>,
      'dataContent' | 'expandedRowKeys' | 'onOpenSettings'
    >
  > = {},
) {
  const onExpandedRowKeysChange = vi.fn();
  const handleExport = vi.fn();

  renderWithProviders(
    <GenericTableSettings
      dataContent={rows}
      expandedRowKeys={[]}
      {...props}
      onExpandedRowKeysChange={onExpandedRowKeysChange}
      handleExport={handleExport}
    />,
  );

  return { onExpandedRowKeysChange, handleExport };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('GenericTableSettings', () => {
  it('calls the export handler from the download action', async () => {
    const user = userEvent.setup();
    const { handleExport } = renderSettings();

    await user.click(screen.getByText('Download to Excel'));

    expect(handleExport).toHaveBeenCalledTimes(1);
  });

  it('expands every visible row while some rows are still collapsed', async () => {
    const user = userEvent.setup();
    const { onExpandedRowKeysChange } = renderSettings({ expandedRowKeys: ['1'] });

    const expandAll = screen.getByRole('switch', { name: 'Expand all' });
    expect(expandAll).not.toBeChecked();
    await user.click(expandAll);

    expect(onExpandedRowKeysChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('collapses every row once all visible rows are expanded', async () => {
    const user = userEvent.setup();
    const { onExpandedRowKeysChange } = renderSettings({ expandedRowKeys: ['1', '2'] });

    const expandAll = screen.getByRole('switch', { name: 'Expand all' });
    expect(expandAll).toBeChecked();
    await user.click(expandAll);

    expect(onExpandedRowKeysChange).toHaveBeenCalledWith([]);
  });

  it('disables the expand-all switch while there are no rows', () => {
    renderSettings({ dataContent: undefined });

    expect(screen.getByRole('switch', { name: 'Expand all' })).toBeDisabled();
  });

  it('renders the list settings action first and calls its handler', async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    renderSettings({ onOpenSettings });

    const settings = screen.getByRole('button', { name: 'List settings' });
    const exportAction = screen.getByText('Download to Excel');
    expect(
      settings.compareDocumentPosition(exportAction) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.click(settings);

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('styles the list settings action like the export action, with a decorative icon', () => {
    renderSettings({ onOpenSettings: vi.fn() });

    const settings = screen.getByRole('button', { name: 'List settings' });
    const exportAction = screen.getByText('Download to Excel').parentElement;
    const actionClasses = ['group', 'text-sm', '!text-[#506579]'];
    expect(settings).toHaveClass(...actionClasses);
    expect(exportAction).toHaveClass(...actionClasses);
    expect(settings.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('underlines only the action labels, which follow the icon directly', () => {
    renderSettings({ onOpenSettings: vi.fn() });

    const labels = [screen.getByText('List settings'), screen.getByText('Download to Excel')];
    for (const label of labels) {
      expect(label).toHaveClass('underline', 'group-hover:no-underline');
      expect(label.parentElement).not.toHaveClass('underline');
      expect(label.parentElement?.childNodes).toHaveLength(2);
      expect(label.previousSibling).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('renders no list settings action without a handler', () => {
    renderSettings();

    expect(screen.queryByRole('button', { name: 'List settings' })).not.toBeInTheDocument();
  });
});
