import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TextFilter } from './TextFilter';
import type { TableFilterValues } from './TableFilters.types';

describe('TextFilter', () => {
  it('reports the typed text and treats blank text as no filter', () => {
    const onChange = vi.fn();
    render(
      <>
        <span id="rating-label">Rating</span>
        <TextFilter
          inputId="rating"
          labelId="rating-label"
          param="lendingRating"
          values={{ lendingRating: ['BBB'] }}
          onChange={onChange}
        />
      </>,
    );
    const input = screen.getByLabelText('Rating');

    expect(input).toHaveValue('BBB');
    expect(input).toHaveAttribute('maxLength', '200');

    fireEvent.change(input, { target: { value: 'A A' } });
    expect(onChange).toHaveBeenLastCalledWith({ lendingRating: ['A A'] });

    fireEvent.change(input, { target: { value: '   ' } });
    expect(onChange).toHaveBeenLastCalledWith({ lendingRating: [] });
  });

  it('summarises the trimmed text', () => {
    const summary = (values: TableFilterValues) =>
      renderHook(() => TextFilter.useSummary(values, { param: 'rating' })).result.current;

    expect(summary({ rating: ['  BBB '] })).toBe('BBB');
    expect(summary({})).toBe('');
  });
});
