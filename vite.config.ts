import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

/**
 * Pings an endpoint whenever the app is rendered. Two triggers:
 *  (A) client-side — injects a <script> into index.html that fetches the
 *      endpoint on every browser load (works in dev AND the prod build).
 *  (B) dev-server — pings the endpoint server-side on every request that
 *      serves the HTML document (npm run dev only).
 *
 * The endpoint comes from VITE_RENDER_PING_URL; when it is unset the plugin
 * is a no-op, so nothing is injected and no request is made.
 */
function renderPingPlugin(url: string, method = 'POST'): Plugin {
  return {
    name: 'render-ping',
    // (A) client-side ping on every browser render/load
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          children: `fetch(${JSON.stringify(url)},{method:${JSON.stringify(method)},keepalive:true}).catch(()=>{});`,
          injectTo: 'body',
        },
      ];
    },
    // (B) dev-server ping when the HTML document is requested
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (path === '/' || path.endsWith('.html')) {
          fetch(url, { method }).catch(() => {});
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const pingUrl = env.VITE_RENDER_PING_URL;

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
