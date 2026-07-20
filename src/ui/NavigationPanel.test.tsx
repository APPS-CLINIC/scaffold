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
  it('passes the title, content and footer to IWA', () => {
    render(
      <NavigationPanel title="Navigation" footer={<span>Collapse</span>}>
        <span>Items</span>
      </NavigationPanel>,
    );

    expect(screen.getByRole('region', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Collapse')).toBeInTheDocument();
  });
});
