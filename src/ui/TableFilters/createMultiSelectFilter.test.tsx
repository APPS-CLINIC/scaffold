import type { ComponentProps } from 'react';
import { render, renderHook } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { createMultiSelectFilter } from './createMultiSelectFilter';
import type { LoadedFilterOptions } from './TableFilters.types';

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
    state?: 'loading' | 'failed';
  }
  const useTeamOptions = ({ city, state }: TeamProps): LoadedFilterOptions =>
    state === undefined
      ? { options: [{ value: `${city}-1`, label: `Team ${city}` }], loading: false, failed: false }
      : { options: [], loading: state === 'loading', failed: state === 'failed' };
  const TeamFilter = createMultiSelectFilter(useTeamOptions, { selectionLimit: 100 });

  function renderTeamFilter(props: Partial<TeamProps> = {}) {
    render(
      <TeamFilter
        inputId="team"
        labelId="team-label"
        param="teamId"
        values={{ teamId: ['waw-1'] }}
        onChange={vi.fn()}
        city="waw"
        {...props}
      />,
    );
  }

  it('offers the options its hook returns for the declared props', () => {
    renderTeamFilter();

    expect(multiSelectProps()).toMatchObject({
      inputId: 'team',
      value: ['waw-1'],
      options: [{ value: 'waw-1', label: 'Team waw' }],
      selectionLimit: 100,
      loading: false,
    });
  });

  it('shows a spinner while the options load', () => {
    renderTeamFilter({ state: 'loading' });

    expect(multiSelectProps()).toMatchObject({
      loading: true,
      emptyMessage: i18n.t('table.filters.loading'),
    });
  });

  it('says so in the open list when the options could not be loaded', () => {
    renderTeamFilter({ state: 'failed' });

    expect(multiSelectProps()).toMatchObject({
      loading: false,
      emptyMessage: i18n.t('table.filters.loadFailed'),
      emptyFilterMessage: i18n.t('table.filters.loadFailed'),
    });
  });

  it('summarises the values with the same options', () => {
    const { result } = renderHook(() =>
      TeamFilter.useSummary({ teamId: ['waw-1', 'gone'] }, { param: 'teamId', city: 'waw' }),
    );

    expect(result.current).toBe('Team waw, gone');
  });

  it('summarises the values as loading until the options arrive', () => {
    const { result } = renderHook(() =>
      TeamFilter.useSummary(
        { teamId: ['waw-1'] },
        { param: 'teamId', city: 'waw', state: 'loading' },
      ),
    );

    expect(result.current).toBe(i18n.t('table.filters.loading'));
  });
});
