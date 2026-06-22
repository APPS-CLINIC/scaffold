import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { makeStore } from '@/app/store';
import { bootstrapAuth } from '@/features/auth/auth.bootstrap';
import { parseItemsQuery } from '@/features/urlState/urlState.schema';
import { I18nProvider } from '@/i18n';
import { ToastProvider } from '@/ui';
import { router } from '@/routes/router';
import '@/styles/global.css';

// Preload the URL mirror from the current address so the very first render
// already reflects a deep-linked/shared URL (no flash of default state).
const store = makeStore({
  urlState: { items: parseItemsQuery(new URLSearchParams(window.location.search)) },
});

// Resolve the Entra ID identity once, before the first paint.
bootstrapAuth(store.dispatch);

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <I18nProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </I18nProvider>
    </Provider>
  </StrictMode>,
);
