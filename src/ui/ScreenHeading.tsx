import type { ComponentProps } from 'react';
import { ScreenHeading as IwaScreenHeading } from 'iwa-react-components';

export interface ScreenHeadingItem {
  label: string;
  navigateTo: string;
}

export interface ScreenHeadingProps extends Omit<ComponentProps<typeof IwaScreenHeading>, 'items'> {
  items: readonly ScreenHeadingItem[];
}

/**
 * Stable app-facing adapter for IWA's page heading navigation contract.
 *
 * Current IWA releases use `navigateTo`; the local compatibility package
 * still reads `url`. Keeping the legacy alias inside the UI seam lets feature
 * code use one contract and can be removed when the compatibility package is
 * upgraded.
 */
export function ScreenHeading({ items, ...rest }: ScreenHeadingProps) {
  const iwaItems = items.map((item) => ({
    label: item.label,
    navigateTo: item.navigateTo,
    url: item.navigateTo,
  }));

  return <IwaScreenHeading {...rest} items={iwaItems} />;
}
