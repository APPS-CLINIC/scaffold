import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import type * as IwaComponents from 'iwa-react-components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { DATE_DMY_FORMAT_OPTIONS } from '@/i18n/dateFormats';
import { OverdueDate } from './OverdueDate';

type StatusFakeProps = ComponentProps<typeof IwaComponents.Status>;

// The status type is a prop, not visible in what the component renders, so Status
// is overridden to expose it. Spreading the module first keeps every other export
// the graph reaches; `importOriginal` resolves to the aliased double, not the real
// library.
vi.mock('iwa-react-components', async (importOriginal) => ({
  ...(await importOriginal<typeof IwaComponents>()),
  Status: ({ type, label }: StatusFakeProps) => (
    <span data-testid="status" data-type={type}>
      {label}
    </span>
  ),
}));

function formatted(isoDate: string): string {
  return new Intl.DateTimeFormat('en', DATE_DMY_FORMAT_OPTIONS).format(
    new Date(`${isoDate}T12:00:00`),
  );
}

beforeEach(async () => {
  // Overdue is measured against the real clock, so pin it. Only Date is faked:
  // React and Testing Library keep their real timers.
  vi.useFakeTimers({ now: new Date('2026-09-15T12:00:00'), toFake: ['Date'] });
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('OverdueDate', () => {
  it('renders a future date as a plain <time> without the marker', () => {
    render(<OverdueDate value="2026-09-16" locale="en" />);

    expect(screen.queryByTestId('status')).not.toBeInTheDocument();
    expect(screen.getByText(formatted('2026-09-16'))).toHaveAttribute('datetime', '2026-09-16');
  });

  it('renders today as a plain date: due, not overdue', () => {
    render(<OverdueDate value="2026-09-15" locale="en" />);

    expect(screen.queryByTestId('status')).not.toBeInTheDocument();
    expect(screen.getByText(formatted('2026-09-15'))).toHaveAttribute('datetime', '2026-09-15');
  });

  it('marks a past date with the incomplete status whose label carries the days overdue', () => {
    const { rerender } = render(<OverdueDate value="2026-09-10" locale="en" />);

    const status = screen.getByTestId('status');
    expect(status).toHaveAttribute('data-type', 'incomplete');
    expect(status).toHaveTextContent('Overdue by 5 days');
    expect(screen.getByText(formatted('2026-09-10'))).toHaveAttribute('datetime', '2026-09-10');

    rerender(<OverdueDate value="2026-09-14" locale="en" />);
    expect(screen.getByTestId('status')).toHaveTextContent('Overdue by 1 day');
    expect(screen.getByText(formatted('2026-09-14'))).toHaveAttribute('datetime', '2026-09-14');
  });

  it('shows a value that is not an ISO date verbatim, without a <time> or a marker', () => {
    render(<OverdueDate value="2000-02-31" locale="en" />);

    expect(screen.getByText('2000-02-31')).toBeInTheDocument();
    expect(screen.queryByTestId('status')).not.toBeInTheDocument();
    expect(document.querySelector('time')).toBeNull();
  });
});
