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
        // Aurora Glass — холодная нейтральная шкала с лёгким индиго-оттенком
        slate: {
          50:  '#f6f7fb',
          100: '#eef1fa',
          200: '#e2e6f2',
          300: '#cdd2e4',
          400: '#a9afcb',
          500: '#8a90aa',
          600: '#5e6582',
          700: '#3a4060',
          800: '#262a4a',
          900: '#1b1f3b',
          950: '#11142a',
        },
        // Единственный акцент — индиго (#4F5BD5 = accent-600)
        accent: {
          50:  '#eef0fd',
          100: '#e0e3fb',
          200: '#c7ccf7',
          300: '#a4abf0',
          400: '#7f88e6',
          500: '#5f6adb',
          600: '#4f5bd5',
          700: '#3f4bc4',
          800: '#333d9e',
          900: '#2a3279',
          950: '#1d2357',
        },
        // Токены — единый источник: CSS-переменные в src/index.css
        gd: {
          bg:       'var(--gd-bg)',
          surface:  'var(--gd-surface)',
          card:     'var(--gd-card)',
          glass:    'var(--gd-glass)',
          fill:     'var(--gd-fill)',
          'fill-2': 'var(--gd-fill-2)',
          accent:   'var(--gd-accent)',
          'accent-dark':  'var(--gd-accent-dark)',
          'accent-light': 'var(--gd-accent-light)',
          text:     'var(--gd-text)',
          muted:    'var(--gd-muted)',
          faint:    'var(--gd-faint)',
          border:   'var(--gd-border)',
          'border-accent': 'var(--gd-border-accent)',
          success:  'var(--gd-success)',
          red:      'var(--gd-red)',
          warn:     'var(--gd-orange)',
        },
      },
      fontFamily: {
        sans: ['Geist Variable', 'Geist', '-apple-system', 'system-ui', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono Variable', 'Geist Mono', 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        // Стекло: внутренний блик сверху + мягкая индиго-тень
        '2xs':        '0 0 0 0 transparent',
        'xs':         '0 1px 2px rgba(40, 48, 110, 0.05)',
        'sm':         '0 2px 8px rgba(40, 48, 110, 0.06)',
        'md':         '0 6px 18px rgba(40, 48, 110, 0.10)',
        'lg':         '0 12px 32px rgba(40, 48, 110, 0.14)',
        'xl':         '0 18px 44px rgba(30, 36, 90, 0.18)',
        '2xl':        '0 24px 60px rgba(30, 36, 90, 0.22)',
        'gd-accent':  '0 6px 18px rgba(79, 91, 213, 0.35)',
        'gd-float':   '0 12px 34px rgba(30, 36, 90, 0.18), 0 0 0 0.5px rgba(27, 31, 59, 0.06)',
        'gd-header':  '0 0.5px 0 var(--gd-border)',
        'glass':      'inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 10px 30px rgba(40, 48, 110, 0.08)',
      },
      // fade-in / slide-up / slide-down и keyframes icon* определены в src/index.css
      animation: {
        'toast-in':   'toastIn 0.55s cubic-bezier(0.34, 1.36, 0.64, 1) both',
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
          '0%':   { opacity: '0', transform: 'translateY(-120%) scale(0.9)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
