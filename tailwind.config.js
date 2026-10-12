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
        // Нейтральная шкала = системные серые iOS (строгая монохромная база).
        // Все slate-* классы проекта автоматически получают iOS-тон.
        slate: {
          50:  '#f7f7f9',
          100: '#efeff4',
          200: '#e3e3e8',
          300: '#d1d1d6',
          400: '#aeaeb2',
          500: '#8e8e93',
          600: '#636366',
          700: '#48484a',
          800: '#2c2c2e',
          900: '#1c1c1e',
          950: '#0f0f10',
        },
        // Палитра GreenData — единый источник: CSS-переменные в src/index.css
        gd: {
          bg:       'var(--gd-bg)',
          surface:  'var(--gd-surface)',
          card:     'var(--gd-card)',
          sidebar:  'var(--gd-sidebar)',
          fill:     'var(--gd-fill)',
          'fill-2': 'var(--gd-fill-2)',
          green:    'var(--gd-green)',
          'green-dark':  'var(--gd-green-dark)',
          'green-light': 'var(--gd-green-light)',
          'green-mid':   '#6ee7b7',
          text:     'var(--gd-text)',
          muted:    'var(--gd-muted)',
          faint:    'var(--gd-faint)',
          border:   'var(--gd-border)',
          'border-green': 'var(--gd-border-green)',
          red:      'var(--gd-red)',
          warn:     'var(--gd-orange)',
          error:    'var(--gd-red)',
          info:     '#007aff',
        },
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', '-apple-system', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        // Строгие тени iOS: карточки почти плоские, «парят» только шторки, меню и тосты
        '2xs':       '0 0 0 0 transparent',
        'xs':        '0 1px 1px rgba(0, 0, 0, 0.03)',
        'sm':        '0 1px 2px rgba(0, 0, 0, 0.04)',
        'md':        '0 4px 14px rgba(0, 0, 0, 0.08)',
        'lg':        '0 10px 30px rgba(0, 0, 0, 0.12)',
        'xl':        '0 16px 40px rgba(0, 0, 0, 0.16)',
        '2xl':       '0 24px 60px rgba(0, 0, 0, 0.22)',
        'gd':        '0 1px 2px rgba(0, 0, 0, 0.04)',
        'gd-green':  '0 6px 16px rgba(5, 150, 105, 0.28)',
        'gd-card':   '0 1px 2px rgba(0, 0, 0, 0.04)',
        'gd-header': '0 0.5px 0 var(--gd-border)',
        'gd-float':  '0 8px 30px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.05)',
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
