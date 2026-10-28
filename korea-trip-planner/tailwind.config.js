/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Geist Variable"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      colors: {
        gd: {
          bg: 'var(--gd-bg)', accent: 'var(--gd-accent)', text: 'var(--gd-text)',
          muted: 'var(--gd-muted)', faint: 'var(--gd-faint)', success: 'var(--gd-success)',
          red: 'var(--gd-red)', orange: 'var(--gd-orange)',
        },
        accent: {
          50: '#f0f2ff', 100: '#e2e6ff', 200: '#c7cdfe', 300: '#a5aefc', 400: '#838ef0',
          500: '#6672e3', 600: '#4f5bd5', 700: '#3f4bc4', 800: '#343e9f', 900: '#2d357d',
        },
        slate: {
          50: '#f6f7fc', 100: '#eceef8', 200: '#dde0ef', 300: '#c3c8de', 400: '#8a90aa',
          500: '#6b7290', 600: '#5e6582', 700: '#444a68', 800: '#2a2f4d', 900: '#1b1f3b',
        },
      },
    },
  },
  plugins: [],
};
