import type { ComponentProps } from 'react';
import { render, renderHook } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMultiSelectFilter } from './createMultiSelectFilter';
import type { TableFilterOption } from './TableFilters.types';

type MultiSelectProps = ComponentProps<typeof IwaComponents.MultiSelect>;

// The multiselect is driven through the props handed to the library: its panel is vendor
// markup that differs between the test double and the real library.
const captured: { multiSelect: MultiSelectProps | null } = { multiSelect: null };

vi.mock('iwa-react-components', async (importOriginal) => {
  const actual = await importOriginal<typeof IwaComponents>();
  return {
    ...actual,
    MultiSelect: (props: MultiSelectProps) => {
      captured.multiSelect = props;
      return <actual.MultiSelect {...props} />;
    },
  };
});

beforeEach(() => {
  captured.multiSelect = null;
});

function multiSelectProps(): MultiSelectProps {
  if (captured.multiSelect === null) throw new Error('MultiSelect was not rendered');
  return captured.multiSelect;
}

describe('createMultiSelectFilter', () => {
  interface TeamProps {
    city: string;
  }
  const useTeamOptions = ({ city }: TeamProps): readonly TableFilterOption[] => [
    { value: `${city}-1`, label: `Team ${city}` },
  ];
  const TeamFilter = createMultiSelectFilter(useTeamOptions, { selectionLimit: 100 });

  it('offers the options its hook returns for the declared props', () => {
    render(
      <TeamFilter
        inputId="team"
        labelId="team-label"
        param="teamId"
        values={{ teamId: ['waw-1'] }}
        onChange={vi.fn()}
        city="waw"
      />,
    );

    expect(multiSelectProps()).toMatchObject({
      inputId: 'team',
      value: ['waw-1'],
      options: [{ value: 'waw-1', label: 'Team waw' }],
      selectionLimit: 100,
    });
  });

  it('summarises the values with the same options', () => {
    const { result } = renderHook(() =>
      TeamFilter.useSummary({ teamId: ['waw-1', 'gone'] }, { param: 'teamId', city: 'waw' }),
    );

    expect(result.current).toBe('Team waw, gone');
  });
});
