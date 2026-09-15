import { useLocation } from 'react-router-dom';
import { resolveNavigation } from '@/routes/navigation';
import { SectionPage } from '@/routes/pages/SectionPage';
import { useCustomerId } from './useCustomerId';

/** Keeps future customer descendants inside the persistent customer layout. */
export function CustomerDetailFallbackPage() {
  useCustomerId();
  const { pathname } = useLocation();
  const activeItem = resolveNavigation(pathname).route.activePath.at(-1);

  return (
    <SectionPage titleKey={activeItem?.labelKey ?? 'customers.details.title'} headingLevel={2} />
  );
}
