import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DialogHeading } from './DialogHeading';

describe('DialogHeading', () => {
  it('renders the text as a level-two heading', () => {
    render(<DialogHeading text="Customize filters" />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Customize filters' }),
    ).toBeInTheDocument();
  });

  it('names the dialog it sits in', () => {
    render(
      <div role="dialog" aria-labelledby="the-library-heading">
        <DialogHeading text="Customize filters" />
      </div>,
    );

    expect(screen.getByRole('dialog', { name: 'Customize filters' })).toBeInTheDocument();
  });

  it('starts at the left by default and centres between the close button bands on request', () => {
    const { rerender } = render(<DialogHeading text="Restoring default settings" />);
    expect(screen.getByRole('heading')).toHaveClass('pl-6', 'pr-14');
    expect(screen.getByRole('heading')).not.toHaveClass('text-center');

    rerender(<DialogHeading text="Restoring default settings" centered />);
    expect(screen.getByRole('heading')).toHaveClass('px-14', 'text-center');
  });

  it('draws the line under it only when divided', () => {
    const { rerender } = render(<DialogHeading text="Customize filters" />);
    expect(screen.getByRole('heading')).not.toHaveClass('border-b');

    rerender(<DialogHeading text="Customize filters" divided />);
    expect(screen.getByRole('heading')).toHaveClass('border-b');
  });

  it('merges a caller class name last', () => {
    render(<DialogHeading text="Customize filters" className="text-xl" />);

    expect(screen.getByRole('heading')).toHaveClass('text-xl');
    expect(screen.getByRole('heading')).not.toHaveClass('text-2xl');
  });
});
