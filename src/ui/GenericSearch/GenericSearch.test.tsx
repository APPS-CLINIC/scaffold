import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericSearch } from './GenericSearch';

function type(field: HTMLElement, text: string) {
  fireEvent.change(field, { target: { value: text } });
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
  return { onSearch, setValue, field: screen.getByPlaceholderText('Search') };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GenericSearch', () => {
  it('shows the applied search', () => {
    const { field } = renderSearch('carrefour');

    expect(field).toHaveValue('carrefour');
  });

  it('searches once typing pauses', () => {
    const { onSearch, field } = renderSearch();

    type(field, 'orlen');
    wait(299);
    expect(onSearch).not.toHaveBeenCalled();

    wait(1);
    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('orlen');
  });

  it('waits for the last keystroke, so a burst of typing searches once', () => {
    const { onSearch, field } = renderSearch();

    type(field, 'orl');
    wait(200);
    type(field, 'orle');
    wait(200);
    type(field, 'orlen');
    wait(300);

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('orlen');
  });

  it('searches the trimmed text and keeps the field as typed', () => {
    const { onSearch, setValue, field } = renderSearch();

    type(field, '  orlen  ');
    wait(300);
    expect(onSearch).toHaveBeenCalledWith('orlen');

    setValue('orlen');
    expect(field).toHaveValue('  orlen  ');
  });

  it('searches from three characters and drops the search when the text gets shorter', () => {
    const { onSearch, setValue, field } = renderSearch();

    type(field, 'or');
    wait(300);
    expect(onSearch).not.toHaveBeenCalled();

    type(field, 'orl');
    wait(300);
    expect(onSearch).toHaveBeenLastCalledWith('orl');
    setValue('orl');

    type(field, 'or');
    wait(300);
    expect(onSearch).toHaveBeenLastCalledWith('');
    setValue('');
    expect(field).toHaveValue('or');
  });

  it('does not search again while the searched text stays the same', () => {
    const { onSearch, field } = renderSearch('orl');

    type(field, 'orl ');
    wait(300);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('follows a search changed from outside, e.g. by Back', () => {
    const { onSearch, setValue, field } = renderSearch('orlen');

    setValue('carrefour');
    wait(300);

    expect(field).toHaveValue('carrefour');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('empties the search when the field is cleared', () => {
    const { onSearch, field } = renderSearch('orlen');

    type(field, '');
    wait(300);

    expect(field).toHaveValue('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('calls the latest onSearch when a parent re-renders with a new callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(<GenericSearch value="" onSearch={first} placeholder="Search" />);

    type(screen.getByPlaceholderText('Search'), 'orlen');
    wait(100);
    view.rerender(<GenericSearch value="" onSearch={second} placeholder="Search" />);
    wait(200);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('orlen');
  });
});
