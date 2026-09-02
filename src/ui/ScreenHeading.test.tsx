import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScreenHeading } from './ScreenHeading';

interface IwaScreenHeadingItem {
  label: string;
  navigateTo?: string;
  url?: string;
}

vi.mock('iwa-react-components', () => ({
  ScreenHeading: ({
    pageName,
    items,
    className,
    dataTestId,
  }: {
    pageName: string;
    items: IwaScreenHeadingItem[];
    className?: string;
    dataTestId?: string;
  }) => (
    <header className={className} data-testid={dataTestId}>
      <h1>{pageName}</h1>
      {items.map((item) => (
        <a key={item.label} href={item.url} data-navigate-to={item.navigateTo}>
          {item.label}
        </a>
      ))}
    </header>
  ),
}));

describe('ScreenHeading', () => {
  it('passes the current IWA destination and contains legacy compatibility in the seam', () => {
    render(
      <ScreenHeading
        pageName="Customer"
        items={[{ label: 'My customers', navigateTo: '/customers/all' }]}
        className="customer-heading"
        dataTestId="customer-heading"
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Customer' })).toBeInTheDocument();
    expect(screen.getByTestId('customer-heading')).toHaveClass('customer-heading');
    expect(screen.getByRole('link', { name: 'My customers' })).toHaveAttribute(
      'data-navigate-to',
      '/customers/all',
    );
    expect(screen.getByRole('link', { name: 'My customers' })).toHaveAttribute(
      'href',
      '/customers/all',
    );
  });
});
