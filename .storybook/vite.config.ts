import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/** The catalogue shares app styling/aliases without loading app proxy or test-only aliases. */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  server: { watch: { ignored: ['**/storybook-static/**'] } },
});
