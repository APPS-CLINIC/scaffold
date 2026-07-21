import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NavigationIcon } from './NavigationIcon';

function ConfiguredIcon({ className }: { className?: string }) {
  return <svg data-testid="configured-icon" className={className} />;
}

describe('NavigationIcon', () => {
  it('renders the configured icon and stays decorative', () => {
    render(<NavigationIcon icon={ConfiguredIcon} />);
    expect(screen.getByTestId('configured-icon')).toBeInTheDocument();
    expect(screen.getByTestId('configured-icon').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('merges caller styling for controls such as the expand action', () => {
    render(<NavigationIcon icon={ConfiguredIcon} className="rotate-180" />);
    expect(screen.getByTestId('configured-icon').parentElement).toHaveClass('rotate-180');
  });
});
