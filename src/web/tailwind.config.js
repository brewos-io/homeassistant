/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#e8e0d5',
          300: '#d4c8b8',
          400: '#b5a08a',
          500: '#9b7a68',
          600: '#7c5a47',
          700: '#5c3d2e',
          800: '#391f12',
          900: '#1a0f0a',
        },
        cream: {
          100: '#faf8f5',
          200: '#f5f0e8',
          300: '#e8e0d5',
          400: '#d4c8b8',
        },
        accent: {
          DEFAULT: '#c4703c',
          light: '#e8a066',
          glow: 'rgba(196, 112, 60, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(26, 15, 10, 0.08)',
        'card': '0 2px 12px rgba(26, 15, 10, 0.06)',
        'glow': '0 0 20px rgba(196, 112, 60, 0.3)',
      },
    },
  },
  plugins: [],
}

