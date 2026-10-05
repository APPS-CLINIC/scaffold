import type { ComponentProps } from 'react';
import { render, waitFor } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import { Dialog } from 'primereact/dialog';
import { expect, it, vi } from 'vitest';
import { tableFilter } from './tableFilter';
import { TableFilterDialog } from './TableFilterDialog';
import type { FilterableTableField, TableFilterProps } from './TableFilters.types';

type DialogProps = ComponentProps<typeof IwaComponents.CustomizableDialog>;

// The IWA dialog is a PrimeReact dialog, whose focus trap moves focus to the close button
// when it opens; the test double has no trap, so this file renders the PrimeReact one.
vi.mock('iwa-react-components', async (importOriginal) => ({
  ...(await importOriginal<typeof IwaComponents>()),
  CustomizableDialog: ({ headingProps, visibility, onSetVisibility, children }: DialogProps) => (
    <Dialog
      unstyled
      header={headingProps?.text}
      visible={visibility}
      onHide={() => onSetVisibility(false)}
    >
      {children}
    </Dialog>
  ),
}));

function PlainFilter({ inputId }: TableFilterProps) {
  return <input id={inputId} />;
}
PlainFilter.useSummary = () => '';

const fields: readonly FilterableTableField[] = [
  {
    field: 'status',
    labelKey: 'customers.table.field.status',
    filter: tableFilter(PlainFilter, {}),
  },
  { field: 'type', labelKey: 'customers.table.field.type', filter: tableFilter(PlainFilter, {}) },
];

it('keeps focus on the first field after the dialog has set its own initial focus', async () => {
  const { getAllByRole } = render(
    <TableFilterDialog fields={fields} values={{}} onSave={vi.fn()} onCancel={vi.fn()} />,
  );

  await waitFor(() => expect(getAllByRole('textbox')[0]).toHaveFocus());
  // The dialog checks focus again once its opening transition has ended.
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(getAllByRole('textbox')[0]).toHaveFocus();
});
