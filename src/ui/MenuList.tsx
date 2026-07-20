import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { MenuList as IwaMenuList } from 'iwa-react-components';
import { cx } from './cx';

export interface MenuListItem {
  id: string;
  text: string;
  icon?: ReactNode;
  slot?: ReactNode;
}

export interface MenuListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  items: readonly MenuListItem[];
  selectedId?: string;
  buttonClassName?: string;
  onItemSelect?: (item: MenuListItem) => void;
}

/**
 * Stable-ID adapter for IWA MenuList's index-based selection contract.
 * Application code never persists or routes by a positional menu index.
 */
export const MenuList = forwardRef<HTMLDivElement, MenuListProps>(function MenuList(
  { items, selectedId, buttonClassName, onItemSelect, className, ...rest },
  ref,
) {
  const selectedIndex = selectedId ? items.findIndex((item) => item.id === selectedId) : undefined;

  return (
    <div ref={ref} className={cx('min-w-0', className)} {...rest}>
      <IwaMenuList
        items={items.map(({ id, text, icon, slot }) => ({ id, text, icon, slot }))}
        selectedIndex={selectedIndex}
        buttonClassName={buttonClassName}
        onSelectedIndexChange={(index: number) => {
          const item = items[index];
          if (item) onItemSelect?.(item);
        }}
      />
    </div>
  );
});
