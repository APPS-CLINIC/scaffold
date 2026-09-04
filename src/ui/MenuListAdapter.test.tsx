import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MenuListAdapter, type MenuListAdapterItem } from './MenuListAdapter';

interface CapturedMenuListProps {
  items: readonly MenuListAdapterItem[];
  selectedIndex?: number;
  buttonClassName?: string;
  onSelectedIndexChange: (index: number) => void;
}

const { menuListSpy } = vi.hoisted(() => ({ menuListSpy: vi.fn() }));

// The adapter owns two mappings and nothing else: a stable id becomes the positional
// index IWA MenuList expects, and a reported index becomes the selected item. Capturing
// the props instead of rendering markup keeps those assertions independent of the
// library's DOM, which this repo does not control.
vi.mock('iwa-react-components', () => ({
  MenuList: (props: CapturedMenuListProps) => {
    menuListSpy(props);
    return null;
  },
}));

const lastProps = () => menuListSpy.mock.calls.at(-1)?.[0] as CapturedMenuListProps;

const items: MenuListAdapterItem[] = [
  { id: 'dashboard', text: 'Dashboard' },
  { id: 'clients', text: 'Clients' },
];

describe('MenuListAdapter', () => {
  it('maps a stable ID to the positional index IWA selects by', () => {
    render(<MenuListAdapter items={items} selectedId="clients" />);

    expect(lastProps().selectedIndex).toBe(1);
    expect(lastProps().items.map((item) => item.id)).toEqual(['dashboard', 'clients']);
  });

  it('leaves the selection unset when no ID is given', () => {
    render(<MenuListAdapter items={items} />);

    expect(lastProps().selectedIndex).toBeUndefined();
  });

  it('reports the selected item back by identity, not by index', () => {
    const onItemSelect = vi.fn();
    render(<MenuListAdapter items={items} onItemSelect={onItemSelect} />);

    lastProps().onSelectedIndexChange(0);

    expect(onItemSelect).toHaveBeenCalledWith(items[0]);
  });

  it('ignores an index outside the item list', () => {
    const onItemSelect = vi.fn();
    render(<MenuListAdapter items={items} onItemSelect={onItemSelect} />);

    lastProps().onSelectedIndexChange(7);

    expect(onItemSelect).not.toHaveBeenCalled();
  });

  it('forwards the button class name to the menu', () => {
    render(<MenuListAdapter items={items} buttonClassName="menu-button" />);

    expect(lastProps().buttonClassName).toBe('menu-button');
  });

  it('merges a caller class name onto the adapter root', () => {
    render(<MenuListAdapter items={[]} className="caller-class" aria-label="Example menu" />);

    expect(screen.getByLabelText('Example menu')).toHaveClass('min-w-0', 'caller-class');
  });
});
