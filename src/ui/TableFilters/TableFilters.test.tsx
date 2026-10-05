import type { ComponentProps } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as IwaComponents from 'iwa-react-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { tableFilter } from './tableFilter';
import { TableFilters } from './TableFilters';
import type { TableFilterField, TableFilterProps, TableFilterValues } from './TableFilters.types';

type ChipInputProps = ComponentProps<typeof IwaComponents.ChipInput>;
type DialogProps = ComponentProps<typeof IwaComponents.CustomizableDialog>;
type ButtonProps = ComponentProps<typeof IwaComponents.Button>;

// Removing a chip and the dialog frame go through the props handed to the library; that
// markup differs between the test double and the real library. Chips are recorded by param.
const chipInputs: { current: Record<string, ChipInputProps> } = { current: {} };
const dialogProps: { current: DialogProps | null } = { current: null };
const buttonProps: { current: Record<string, ButtonProps> } = { current: {} };

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    ChipInput: (props: ChipInputProps) => {
      const param: unknown = props.chips[0]?.value;
      if (typeof param === 'string') chipInputs.current[param] = props;
      return <actual.ChipInput {...props} />;
    },
    CustomizableDialog: (props: DialogProps) => {
      dialogProps.current = props;
      return <actual.CustomizableDialog {...props} />;
    },
    Button: (props: ButtonProps) => {
      buttonProps.current[props.label] = props;
      return <actual.Button {...props} />;
    },
  };
});

beforeEach(() => {
  chipInputs.current = {};
  dialogProps.current = null;
  buttonProps.current = {};
});

/** A plain text field holding comma-separated values, so the dialog runs without vendor markup. */
function CommaFilter({ inputId, param, values, onChange }: TableFilterProps & { suffix: string }) {
  return (
    <input
      id={inputId}
      value={(values[param] ?? []).join(',')}
      onChange={(event) =>
        onChange({ [param]: event.target.value ? event.target.value.split(',') : [] })
      }
    />
  );
}
CommaFilter.useSummary = (
  values: TableFilterValues,
  { param, suffix }: { param: string; suffix: string },
) => `${(values[param] ?? []).join(' + ')}${suffix}`;

const statusLabel = i18n.t('customers.table.field.status');
const typeLabel = i18n.t('customers.table.field.type');

const fields: readonly TableFilterField[] = [
  {
    field: 'status',
    labelKey: 'customers.table.field.status',
    filter: tableFilter(CommaFilter, { suffix: '' }),
  },
  { field: 'kkf', labelKey: 'customers.table.field.kkf' },
  {
    field: 'type',
    labelKey: 'customers.table.field.type',
    filterParam: 'customerType',
    filter: tableFilter(CommaFilter, { suffix: '!' }),
  },
];

function renderFilters(values: TableFilterValues, tableFields = fields) {
  const onChange = vi.fn();
  render(<TableFilters fields={tableFields} values={values} onChange={onChange} />);
  return onChange;
}

const openDialog = async () => {
  await userEvent.click(screen.getByRole('button', { name: i18n.t('table.filters.open') }));
  return screen.getByRole('dialog', { name: i18n.t('table.filters.title') });
};

function chip(param: string): ChipInputProps {
  const props = chipInputs.current[param];
  if (props === undefined) throw new Error(`No chip for ${param}`);
  return props;
}

/** Each applied-filter list item holds exactly the given chip text, in order. */
function expectChips(texts: readonly string[]) {
  const list = screen.getByRole('list', { name: i18n.t('table.filters.applied') });
  const items = Array.from(list.children);
  expect(items).toHaveLength(texts.length);
  texts.forEach((text, index) => within(items[index] as HTMLElement).getByText(text));
}

const rowLabels = (dialog: HTMLElement) =>
  Array.from(dialog.querySelectorAll('label')).map((label) => label.textContent);

describe('TableFilters', () => {
  it('shows no chips and no clear link while no filter applies', () => {
    renderFilters({ kkf: ['123'], other: ['x'] });

    expect(screen.queryByRole('list', { name: i18n.t('table.filters.applied') })).toBeNull();
    expect(screen.queryByText(i18n.t('table.filters.clear', { count: 1 }))).toBeNull();
  });

  it('shows one chip per applied filter, in field order, and clears them all at once', async () => {
    const onChange = renderFilters({
      customerType: ['SME'],
      status: ['ARCHIVAL', 'ACTIVE'],
      kkf: ['1'],
      type: ['ignored'],
    });

    expectChips([`${statusLabel}: ARCHIVAL + ACTIVE`, `${typeLabel}: SME!`]);

    await userEvent.click(screen.getByText(i18n.t('table.filters.clear', { count: 2 })));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it('removes only the filter whose chip is removed', () => {
    const onChange = renderFilters({ status: ['ACTIVE'], customerType: ['SME'] });

    act(() => chip('status').onChange([]));

    expect(onChange).toHaveBeenCalledWith({ customerType: ['SME'] });
  });

  it('offers one row per filterable field, in the order of the fields', async () => {
    renderFilters({}, [...fields].reverse());

    const dialog = await openDialog();

    expect(rowLabels(dialog)).toEqual([typeLabel, statusLabel]);
  });

  it('saves the edited filters at once, without empty ones, and closes', async () => {
    const onChange = renderFilters({ status: ['ACTIVE'] });
    const dialog = await openDialog();

    expect(within(dialog).getByLabelText(statusLabel)).toHaveValue('ACTIVE');
    fireEvent.change(within(dialog).getByLabelText(statusLabel), { target: { value: '' } });
    fireEvent.change(within(dialog).getByLabelText(typeLabel), {
      target: { value: 'SME,CORPORATE' },
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: i18n.t('table.filters.save') }),
    );

    expect(onChange).toHaveBeenCalledWith({ customerType: ['SME', 'CORPORATE'] });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('discards the draft on cancel, so the next opening starts from the applied filters', async () => {
    const onChange = renderFilters({ status: ['ACTIVE'] });
    let dialog = await openDialog();

    fireEvent.change(within(dialog).getByLabelText(statusLabel), { target: { value: 'ARCHIVAL' } });
    await userEvent.click(
      within(dialog).getByRole('button', { name: i18n.t('table.filters.cancel') }),
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();

    dialog = await openDialog();
    expect(within(dialog).getByLabelText(statusLabel)).toHaveValue('ACTIVE');
  });

  it.each([
    ['false', false],
    ['an updater', (visible: boolean) => !visible],
  ] as const)(
    'closes the dialog without saving when the library hides it with %s',
    async (_, next) => {
      const onChange = renderFilters({ status: ['ACTIVE'] });
      const dialog = await openDialog();
      fireEvent.change(within(dialog).getByLabelText(statusLabel), {
        target: { value: 'ARCHIVAL' },
      });

      act(() => dialogProps.current?.onSetVisibility(next));

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    },
  );

  it('puts focus on the first field when the dialog opens', async () => {
    renderFilters({}, [...fields].reverse());

    const dialog = await openDialog();

    expect(within(dialog).getByLabelText(typeLabel)).toHaveFocus();
  });

  it.each(['Save', 'Cancel'] as const)(
    'gives focus back to "Customize filters" after %s',
    async (action) => {
      renderFilters({ status: ['ACTIVE'] });
      const dialog = await openDialog();

      await userEvent.click(
        within(dialog).getByRole('button', {
          name: i18n.t(action === 'Save' ? 'table.filters.save' : 'table.filters.cancel'),
        }),
      );

      expect(screen.getByRole('button', { name: i18n.t('table.filters.open') })).toHaveFocus();
    },
  );

  it('opens an 824 x 660 dialog whose rows scroll under a fixed heading and footer', async () => {
    renderFilters({});
    const dialog = await openDialog();

    expect(dialogProps.current?.headingProps).toBeUndefined();
    expect(
      within(dialog).getByRole('heading', { level: 2, name: i18n.t('table.filters.title') }),
    ).toBeInTheDocument();
    expect(dialogProps.current?.className).toContain('!w-[824px]');
    expect(dialogProps.current?.className).toContain('!h-[660px]');
    expect(buttonProps.current[i18n.t('table.filters.cancel')]).toMatchObject({
      style: 'outline',
      size: 'medium',
    });
    expect(buttonProps.current[i18n.t('table.filters.save')]).toMatchObject({
      style: 'filled',
      size: 'medium',
    });

    const rows = within(dialog).getByLabelText(statusLabel).closest('.overflow-y-auto');
    expect(rows).toHaveClass('[scrollbar-width:none]', '[&::-webkit-scrollbar]:hidden');
  });
});
