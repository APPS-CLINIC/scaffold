import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ErrorLayout } from './ErrorLayout';
import { RootLayout } from './RootLayout';
import { navTabs } from './navTabs';
import { getNavigationSectionDefaultPath } from './navigation';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SectionPage } from './pages/SectionPage';
import { getPageRouteLoader, getSectionDetailRoutes } from './pageRoutes/pageRouteRegistry';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      // Navigation metadata is configured once. Each section is one nested
      // route tree: the bare section path is its index route (redirecting to
      // the default destination when the section has items), navigation items
      // are static child segments, and section-owned detail routes (e.g.
      // ':id') follow — React Router ranks static segments above dynamic
      // ones, so '/customers/all' always outranks '/customers/:id'.
      ...navTabs
        .filter((section) => section.path !== '/')
        .map((section) => ({
          path: section.path,
          children: [
            section.items.length > 0
              ? {
                  index: true,
                  element: <Navigate to={getNavigationSectionDefaultPath(section)} replace />,
                }
              : { index: true, element: <SectionPage titleKey={section.labelKey} /> },
            ...section.items.map((item) => {
              const lazy = getPageRouteLoader(section.key, item.id);

              return lazy
                ? { path: item.segment, lazy }
                : { path: item.segment, element: <SectionPage titleKey={item.labelKey} /> };
            }),
            ...getSectionDetailRoutes(section.key).map(({ path, lazy }) => ({ path, lazy })),
          ],
        })),
    ],
  },
  // Error routes live OUTSIDE RootLayout on purpose: no top bar, menu or
  // footer — they render on ErrorLayout's full-width/height canvas instead.
  // /403 and /404 are navigable directly (e.g. after an API 403), and the
  // catch-all renders the 404 for any unknown URL. NOTE: keep exactly one
  // '*' route in the whole config — a leftover '*' inside RootLayout's
  // children would shadow this one and pull the 404 back into the layout.
  {
    element: <ErrorLayout />,
    children: [
      { path: '/403', element: <ForbiddenPage /> },
      { path: '/404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
