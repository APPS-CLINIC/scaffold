import type { ComponentProps } from 'react';
import { act, render, screen } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tableFilter } from './tableFilter';
import type { TableFilterProps, TableFilterValues } from './TableFilters.types';

type ChipInputProps = ComponentProps<typeof IwaComponents.ChipInput>;

// Removing a chip goes through the props handed to the library; its remove control is vendor
// markup that differs between the test double and the real library.
const captured: { chipInput: ChipInputProps | null } = { chipInput: null };

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    ChipInput: (props: ChipInputProps) => {
      captured.chipInput = props;
      return <actual.ChipInput {...props} />;
    },
  };
});

beforeEach(() => {
  captured.chipInput = null;
});

function chipInput(): ChipInputProps {
  if (captured.chipInput === null) throw new Error('ChipInput was not rendered');
  return captured.chipInput;
}

function PrefixFilter({ inputId, param, values, prefix }: TableFilterProps & { prefix: string }) {
  return <output id={inputId}>{`${prefix}${(values[param] ?? []).join(',')}`}</output>;
}
PrefixFilter.useSummary = (
  values: TableFilterValues,
  { param, prefix }: { param: string; prefix: string },
) => `${prefix}${(values[param] ?? []).join(' + ')}`;

const declaration = tableFilter(PrefixFilter, { prefix: '#' });

describe('tableFilter', () => {
  it('renders the control with its configured props and the dialog props', () => {
    render(
      declaration.render({
        inputId: 'status',
        labelId: 'status-label',
        param: 'status',
        values: { status: ['A', 'B'] },
        onChange: vi.fn(),
      }),
    );

    expect(screen.getByText('#A,B')).toHaveAttribute('id', 'status');
  });

  it('renders a chip that reads "label: summary" and reports its removal', () => {
    const onRemove = vi.fn();
    render(
      declaration.renderChip({
        label: 'Status',
        param: 'status',
        values: { status: ['A', 'B'] },
        onRemove,
      }),
    );

    expect(screen.getByText('Status: #A + B')).toBeInTheDocument();
    expect(chipInput().chips).toEqual([{ label: 'Status: #A + B', value: 'status' }]);

    act(() => chipInput().onChange([]));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
