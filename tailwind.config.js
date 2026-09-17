/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./sidepanel.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        gd: {
          // Backgrounds — светлые
          bg:       '#f0f4f0',
          surface:  '#ffffff',
          card:     '#ffffff',
          sidebar:  '#f5f8f5',
          // Greens
          green:    '#22c55e',
          'green-dark':  '#16a34a',
          'green-light': '#dcfce7',
          'green-mid':   '#86efac',
          // Text
          text:     '#111827',
          muted:    '#6b7280',
          faint:    '#d1d5db',
          // Borders
          border:   '#e2e8e2',
          'border-green': 'rgba(34,197,94,0.35)',
          // Status
          warn:     '#f59e0b',
          error:    '#ef4444',
          info:     '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'gd':        '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        'gd-green':  '0 0 0 2px rgba(34,197,94,0.25), 0 2px 8px rgba(34,197,94,0.15)',
        'gd-card':   '0 2px 12px rgba(0,0,0,0.06)',
        'gd-header': '0 1px 0 #e2e8e2, 0 2px 8px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in':    'fadeIn 0.18s ease-out forwards',
        'slide-up':   'slideUp 0.22s ease-out forwards',
        'slide-down': 'slideDown 0.2s ease-out forwards',
        'toast-in':   'toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'icon-pop':   'iconPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'icon-spin':  'iconSpin 0.4s ease-in-out both',
        'icon-shake': 'iconShake 0.4s ease both',
        'icon-bounce':'iconBounce 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
      },
      keyframes: {
        toastIn: {
          '0%':   { opacity: '0', transform: 'translateY(-14px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        iconPop: {
          '0%':   { transform: 'scale(1)' },
          '60%':  { transform: 'scale(1.22)' },
          '100%': { transform: 'scale(1.12)' },
        },
        iconSpin: {
          '0%':   { transform: 'rotate(0deg) scale(1)' },
          '50%':  { transform: 'rotate(20deg) scale(1.12)' },
          '100%': { transform: 'rotate(0deg) scale(1)' },
        },
        iconShake: {
          '0%,100%': { transform: 'rotate(0deg)' },
          '20%':     { transform: 'rotate(-12deg)' },
          '40%':     { transform: 'rotate(12deg)' },
          '60%':     { transform: 'rotate(-8deg)' },
          '80%':     { transform: 'rotate(8deg)' },
        },
        iconBounce: {
          '0%':   { transform: 'scale(1) translateY(0)' },
          '40%':  { transform: 'scale(1.18) translateY(-3px)' },
          '70%':  { transform: 'scale(0.96) translateY(0)' },
          '100%': { transform: 'scale(1) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
