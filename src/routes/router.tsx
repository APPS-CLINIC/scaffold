import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { navTabs } from './navTabs';
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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
