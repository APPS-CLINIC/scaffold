/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    // Scan the IWA component packages so the Tailwind utility classes they
    // use are generated (Tailwind ignores node_modules by default).
    './node_modules/iwa-react-components/**/*.{js,jsx,mjs,cjs}',
    './node_modules/iwa-react-error-handling/**/*.{js,jsx,mjs,cjs}',
    './node_modules/ing-react-icons/**/*.{js,jsx,mjs,cjs}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        focus: 'var(--focus)',
      },
    },
  },
  plugins: [],
};
