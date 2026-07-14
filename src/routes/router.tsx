import { createBrowserRouter } from 'react-router-dom';
import { ErrorLayout } from './ErrorLayout';
import { RootLayout } from './RootLayout';
import { navTabs } from './navTabs';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SectionPage } from './pages/SectionPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      // One placeholder subpage per top-bar tab (except Start, served above).
      ...navTabs
        .filter((tab) => tab.path !== '/')
        .map((tab) => ({
          path: tab.path,
          element: <SectionPage titleKey={tab.labelKey} />,
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
