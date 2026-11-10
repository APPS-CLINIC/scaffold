import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { TableCellSkeleton } from './TableCellSkeleton';

it('keeps the shared placeholder decorative, with no text or controls to announce', () => {
  const { container } = render(<TableCellSkeleton rowIndex={2} />);
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  expect(container.textContent).toBe('');
  expect(container.querySelector('button, a, input')).toBeNull();
});
