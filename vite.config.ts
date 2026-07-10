import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

/**
 * Connection test: GET <url> whenever the app is rendered, logging success or
 * failure — the same "Successful connection with BE" / "Error during
 * connection to BE" check that used to live in a component. Two triggers:
 *  (A) client-side — injects a <script> into index.html that runs on every
 *      browser load (dev AND the prod build).
 *  (B) dev-server — pings server-side on every dev-server HTML request.
 *
 * The URL resolves to `${VITE_API_BASE_URL}/hello` (locally
 * http://localhost:8765/hello), or VITE_RENDER_PING_URL if set. When neither
 * is configured the plugin is a no-op.
 */
function renderPingPlugin(url: string, method = 'GET'): Plugin {
  const clientScript =
    `fetch(${JSON.stringify(url)},{method:${JSON.stringify(method)}})` +
    `.then(function(r){if(!r.ok)throw new Error('Status: '+r.status);` +
    `console.log('Successful connection with BE');})` +
    `.catch(function(e){console.error('Error during connection to BE.',e);});`;

  return {
    name: 'render-ping',
    // (A) client-side connection test on every browser render/load
    transformIndexHtml() {
      return [{ tag: 'script', children: clientScript, injectTo: 'body' }];
    },
    // (B) dev-server connection test on every HTML request
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (path === '/' || path.endsWith('.html')) {
          fetch(url, { method })
            .then((r) => {
              if (!r.ok) throw new Error('Status: ' + r.status);
              server.config.logger.info('[render-ping] Successful connection with BE');
            })
            .catch((e) => {
              server.config.logger.error(`[render-ping] Error during connection to BE. ${e}`);
            });
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL?.replace(/\/$/, '');
  const pingUrl = env.VITE_RENDER_PING_URL || (apiBase ? `${apiBase}/hello` : '');

  return {
    plugins: [react(), ...(pingUrl ? [renderPingPlugin(pingUrl)] : [])],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      rollupOptions: {
        output: {
          // Split heavy, rarely-changing vendor code into long-lived cacheable chunks.
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'reselect'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      css: false,
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/**/*.d.ts'],
      },
    },
  };
});
