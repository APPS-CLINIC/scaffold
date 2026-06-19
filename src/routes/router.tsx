import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { ItemsPage } from './pages/ItemsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/items" replace /> },
      { path: 'items', element: <ItemsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
