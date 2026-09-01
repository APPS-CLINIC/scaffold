import { useLocation, useParams } from 'react-router-dom';
import { resolveNavigation } from '@/routes/navigation';
import { SectionPage } from '@/routes/pages/SectionPage';

/** Keeps future customer descendants inside the persistent customer layout. */
export function CustomerDetailFallbackPage() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const activeItem = id ? resolveNavigation(pathname).route.activePath.at(-1) : undefined;

  return (
    <SectionPage titleKey={activeItem?.labelKey ?? 'customers.details.title'} headingLevel={2} />
  );
}
