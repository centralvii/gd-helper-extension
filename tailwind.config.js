/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./sidepanel.html",
    "./checklist.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        // Палитра GreenData — единый источник: CSS-переменные в src/index.css
        gd: {
          bg:       'var(--gd-bg)',
          surface:  'var(--gd-surface)',
          card:     'var(--gd-card)',
          sidebar:  'var(--gd-sidebar)',
          green:    'var(--gd-green)',
          'green-dark':  'var(--gd-green-dark)',
          'green-light': 'var(--gd-green-light)',
          'green-mid':   '#6ee7b7',
          text:     'var(--gd-text)',
          muted:    'var(--gd-muted)',
          faint:    'var(--gd-faint)',
          border:   'var(--gd-border)',
          'border-green': 'var(--gd-border-green)',
          warn:     '#f59e0b',
          error:    '#e11d48',
          info:     '#0284c7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        // Тонкие тени (в Tailwind v3 отсутствуют — без них shadow-xs/2xs не генерировались)
        '2xs':       '0 1px 0 rgba(15, 23, 42, 0.04)',
        'xs':        '0 1px 2px rgba(15, 23, 42, 0.05)',
        'gd':        '0 1px 4px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.04)',
        'gd-green':  '0 0 0 2px rgba(5,150,105,0.18), 0 4px 14px rgba(5,150,105,0.15)',
        'gd-card':   '0 2px 12px rgba(15,23,42,0.06)',
        'gd-header': '0 1px 0 var(--gd-border), 0 2px 8px rgba(15,23,42,0.04)',
      },
      // fade-in / slide-up / slide-down и keyframes icon* определены в src/index.css
      animation: {
        'toast-in':   'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'icon-pop':   'iconPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'icon-spin':  'iconSpin 0.4s ease-in-out both',
        'icon-shake': 'iconShake 0.4s ease both',
        'icon-bounce':'iconBounce 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-subtle': 'pulseSubtle 2.2s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(14,165,233,0)' },
          '50%':      { boxShadow: '0 0 0 3px rgba(14,165,233,0.18)' },
        },
        toastIn: {
          '0%':   { opacity: '0', transform: 'translateY(-14px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
