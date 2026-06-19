import { Outlet } from 'react-router-dom';
import { UrlStateSync } from '@/features/urlState/UrlStateSync';
import styles from './RootLayout.module.css';

/**
 * App shell. `UrlStateSync` lives here (inside the router context) so the
 * URL -> Redux mirror is active on every route.
 */
export function RootLayout() {
  return (
    <div className={styles.shell}>
      <UrlStateSync />
      <header className={styles.header}>
        <strong>Scaffold</strong>
        <span className={styles.subtitle}>React · Vite · Redux Toolkit · URL-driven state</span>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
