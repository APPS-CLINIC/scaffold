import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MenuList } from './MenuList';

interface IwaItem {
  id: string;
  text: string;
  icon?: ReactNode;
}

interface IwaMenuListProps {
  items: IwaItem[];
  selectedIndex?: number;
  onSelectedIndexChange: (index: number) => void;
}

vi.mock('iwa-react-components', () => ({
  MenuList: ({ items, selectedIndex, onSelectedIndexChange }: IwaMenuListProps) => (
    <div>
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          aria-current={selectedIndex === index ? 'page' : undefined}
          onClick={() => onSelectedIndexChange(index)}
        >
          {item.icon}
          {item.text}
        </button>
      ))}
    </div>
  ),
}));

describe('MenuList', () => {
  it('adapts stable IDs to IWA selected indexes and returns the selected item', async () => {
    const user = userEvent.setup();
    const onItemSelect = vi.fn();
    const items = [
      { id: 'dashboard', text: 'Dashboard' },
      { id: 'clients', text: 'Clients' },
    ];

    render(<MenuList items={items} selectedId="clients" onItemSelect={onItemSelect} />);

    expect(screen.getByRole('button', { name: 'Clients' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(onItemSelect).toHaveBeenCalledWith(items[0]);
  });

  it('merges a caller class name onto the adapter root', () => {
    render(<MenuList items={[]} className="caller-class" aria-label="Example menu" />);
    expect(screen.getByLabelText('Example menu')).toHaveClass('caller-class');
  });
});
