import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PrimeReactProvider } from 'primereact/api';
import { RouterProvider } from 'react-router-dom';
import { makeStore } from '@/app/store';
import {
  createLocalStorageTableSettingsStorage,
  createTableSettingsState,
  startTableSettingsPersistence,
} from '@/features/tableSettings';
import { createUrlState } from '@/features/urlState/urlState.slice';
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
const root = createRoot(container);

const tableSettingsStorage = createLocalStorageTableSettingsStorage();
const store = makeStore({
  urlState: createUrlState(window.location.pathname, window.location.search),
  tableSettings: createTableSettingsState(tableSettingsStorage.read()),
});
startTableSettingsPersistence(tableSettingsStorage);

async function renderApplication() {
  const previewDataProfile = import.meta.env.VITE_PREVIEW_DATA_PROFILE?.trim();

  if (import.meta.env.DEV && import.meta.env.MODE !== 'test' && previewDataProfile) {
    const { seedPreviewData } = await import('@/dev/previewData/previewData');
    await seedPreviewData(store, previewDataProfile);
  }

  root.render(
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
}

void renderApplication();
