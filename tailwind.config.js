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
      colors: {
        // GreenData console palette
        gd: {
          // Backgrounds
          bg:     '#080d08',
          surface:'#0d150d',
          card:   '#111a11',
          'card-hover': '#152015',
          border: '#1a2e1a',
          'border-active': '#22c55e',
          // Greens (brand)
          green:  '#22c55e',
          'green-dim': '#16a34a',
          'green-glow': 'rgba(34,197,94,0.18)',
          'green-subtle': 'rgba(34,197,94,0.08)',
          // Text
          text:   '#d4edda',
          muted:  '#6b9a6b',
          faint:  '#3d5c3d',
          // Status
          warn:   '#eab308',
          error:  '#ef4444',
          info:   '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'gd-glow':   '0 0 0 1px rgba(34,197,94,0.2), 0 4px 24px rgba(34,197,94,0.08)',
        'gd-strong': '0 0 0 1px rgba(34,197,94,0.35), 0 8px 32px rgba(34,197,94,0.18)',
        'gd-inner':  'inset 0 1px 0 rgba(34,197,94,0.08)',
      },
      animation: {
        'fade-in':       'fadeIn 0.18s ease-out forwards',
        'slide-up':      'slideUp 0.22s ease-out forwards',
        'slide-down':    'slideDown 0.2s ease-out forwards',
        'glow-pulse':    'glowPulse 2.4s ease-in-out infinite',
        'icon-bounce':   'iconBounce 0.4s ease-out',
        'scan-line':     'scanLine 6s linear infinite',
        'blink-cursor':  'blinkCursor 1.1s step-end infinite',
        'spin-slow':     'spin 2.5s linear infinite',
      },
      keyframes: {
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
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(34,197,94,0.15), 0 0 12px rgba(34,197,94,0.06)' },
          '50%':      { boxShadow: '0 0 0 1px rgba(34,197,94,0.3),  0 0 24px rgba(34,197,94,0.15)' },
        },
        iconBounce: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.18)' },
          '70%':  { transform: 'scale(0.94)' },
          '100%': { transform: 'scale(1)' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        blinkCursor: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
