import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PrimeReactProvider } from 'primereact/api';
import { RouterProvider } from 'react-router-dom';
import { store } from '@/app/store';
import '@/i18n';
import { ToastProvider } from '@/ui';
import { router } from '@/routes/router';
// PrimeReact styles (theme + core + icons) must load before global.css so
// Tailwind utilities can override them. Swap the theme for the IWA/brand one.
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import '@/styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <PrimeReactProvider>
      <Provider store={store}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </Provider>
    </PrimeReactProvider>
  </StrictMode>,
);
