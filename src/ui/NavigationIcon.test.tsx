import type { SVGAttributes } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NavigationIcon } from './NavigationIcon';

vi.mock('ing-react-icons', () => ({
  Hide: (props: SVGAttributes<SVGSVGElement>) => <svg data-testid="hide-icon" {...props} />,
  Settings: (props: SVGAttributes<SVGSVGElement>) => <svg data-testid="settings-icon" {...props} />,
}));

describe('NavigationIcon', () => {
  it('uses the known IWA item icon and stays decorative', () => {
    render(<NavigationIcon name="default" />);
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    expect(screen.getByTestId('settings-icon').parentElement).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('visually reverses the known IWA hide icon for the expand action', () => {
    render(<NavigationIcon name="expand" aria-label="ignored decorative label" />);
    expect(screen.getByTestId('hide-icon').parentElement).toHaveClass('rotate-180');
  });
});
