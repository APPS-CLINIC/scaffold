import { act, render } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import type { AutoCompleteChangeEvent } from 'primereact/autocomplete';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericSearch } from './GenericSearch';

type SearchProps = ComponentProps<typeof IwaComponents.SearchWithAutocomplete>;

const { searchSpy } = vi.hoisted(() => ({ searchSpy: vi.fn() }));

// The field's markup is IWA's own, so the search is driven through the props it hands the field.
vi.mock('iwa-react-components', async (importOriginal) => ({
  ...(await importOriginal<typeof IwaComponents>()),
  SearchWithAutocomplete: (props: SearchProps) => {
    searchSpy(props);
    return null;
  },
}));

const lastField = () => searchSpy.mock.calls.at(-1)?.[0] as SearchProps;

function change(value: unknown) {
  act(() => {
    lastField().onChange?.({ value } as AutoCompleteChangeEvent);
  });
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function renderSearch(value = '') {
  const onSearch = vi.fn();
  const view = render(<GenericSearch value={value} onSearch={onSearch} placeholder="Search" />);
  const setValue = (next: string) =>
    view.rerender(<GenericSearch value={next} onSearch={onSearch} placeholder="Search" />);
  return { onSearch, setValue };
}

beforeEach(() => {
  vi.useFakeTimers();
  searchSpy.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GenericSearch', () => {
  it('shows the applied search and the placeholder', () => {
    renderSearch('carrefour');

    expect(lastField().value).toBe('carrefour');
    expect(lastField().placeholder).toBe('Search');
  });

  it('searches once typing pauses', () => {
    const { onSearch } = renderSearch();

    change('orlen');
    wait(299);
    expect(onSearch).not.toHaveBeenCalled();

    wait(1);
    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('orlen');
  });

  it('waits for the last keystroke, so a burst of typing searches once', () => {
    const { onSearch } = renderSearch();

    change('orl');
    wait(200);
    change('orle');
    wait(200);
    change('orlen');
    wait(300);

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('orlen');
  });

  it('searches the trimmed text and keeps the field as typed', () => {
    const { onSearch, setValue } = renderSearch();

    change('  orlen  ');
    wait(300);
    expect(onSearch).toHaveBeenCalledWith('orlen');

    setValue('orlen');
    expect(lastField().value).toBe('  orlen  ');
  });

  it('searches from three characters and drops the search when the text gets shorter', () => {
    const { onSearch, setValue } = renderSearch();

    change('or');
    wait(300);
    expect(onSearch).not.toHaveBeenCalled();

    change('orl');
    wait(300);
    expect(onSearch).toHaveBeenLastCalledWith('orl');
    setValue('orl');

    change('or');
    wait(300);
    expect(onSearch).toHaveBeenLastCalledWith('');
    setValue('');
    expect(lastField().value).toBe('or');
  });

  it('does not search again while the searched text stays the same', () => {
    const { onSearch } = renderSearch('orl');

    change('orl ');
    wait(300);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('follows a search changed from outside, e.g. by Back', () => {
    const { onSearch, setValue } = renderSearch('orlen');

    setValue('carrefour');
    wait(300);

    expect(lastField().value).toBe('carrefour');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('empties the field and the search when the field is cleared', () => {
    const { onSearch } = renderSearch('orlen');

    change(undefined);
    wait(300);

    expect(lastField().value).toBe('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('calls the latest onSearch when a parent re-renders with a new callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(<GenericSearch value="" onSearch={first} placeholder="Search" />);

    change('orlen');
    wait(100);
    view.rerender(<GenericSearch value="" onSearch={second} placeholder="Search" />);
    wait(200);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('orlen');
  });
});
