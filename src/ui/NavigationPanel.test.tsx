import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NavigationPanel } from './NavigationPanel';

interface IwaNavigationPanelProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

vi.mock('iwa-react-components', () => ({
  NavigationPanel: ({ title, children, footer }: IwaNavigationPanelProps) => (
    <section aria-label={title}>
      {children}
      <footer>{footer}</footer>
    </section>
  ),
}));

describe('NavigationPanel', () => {
  it('passes content to IWA and composes a header action', () => {
    render(
      <NavigationPanel
        title="Navigation"
        headerAction={<button type="button">Collapse</button>}
        footer={<span>Footer</span>}
      >
        <span>Items</span>
      </NavigationPanel>,
    );

    expect(screen.getByRole('region', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
