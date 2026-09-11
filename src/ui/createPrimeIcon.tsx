import type { ComponentType, HTMLAttributes } from 'react';
import { PrimeIcon, type PrimeIconName } from './PrimeIcon';

/** Creates a stable PrimeIcons component reference for config-driven navigation. */
export function createPrimeIcon(
  name: PrimeIconName,
): ComponentType<HTMLAttributes<HTMLSpanElement>> {
  function ConfiguredPrimeIcon(props: HTMLAttributes<HTMLSpanElement>) {
    return <PrimeIcon {...props} name={name} />;
  }

  ConfiguredPrimeIcon.displayName = `PrimeIcon(${name})`;
  return ConfiguredPrimeIcon;
}
