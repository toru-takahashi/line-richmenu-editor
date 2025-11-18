/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TD Primary Colors
        'td-blue': {
          50: '#e6f2ff',
          100: '#cce5ff',
          200: '#99ccff',
          300: '#66b2ff',
          400: '#3399ff',
          500: '#0080ff', // TD Primary Blue
          600: '#0066cc', // TD Brand Blue
          700: '#004d99',
          800: '#003366',
          900: '#001a33',
        },
        'td-purple': {
          50: '#f3e6ff',
          100: '#e6ccff',
          200: '#cc99ff',
          300: '#b366ff',
          400: '#9933ff',
          500: '#8000ff',
          600: '#6600cc',
          700: '#4d0099',
          800: '#330066',
          900: '#1a0033',
        },
        // Neutral Grays
        neutral: {
          0: '#ffffff',
          1: '#f9fbff',
          2: '#eff2f8',
          3: '#e8ecf3',
          4: '#dce1ea',
          5: '#c9cfd9',
          6: '#b5bcc8',
          7: '#9ba2af',
          8: '#828996',
          9: '#636a77',
          10: '#454a54',
          11: '#212327',
        },
        // Semantic Colors
        success: {
          DEFAULT: '#10b981',
          dark: '#059669',
          light: '#d1fae5',
        },
        warning: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          light: '#fef3c7',
        },
        error: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
          light: '#fee2e2',
        },
        info: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#dbeafe',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      boxShadow: {
        'td-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'td': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'td-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'td-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'td-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'td-sm': '0.375rem',
        'td': '0.5rem',
        'td-md': '0.625rem',
        'td-lg': '0.75rem',
        'td-xl': '1rem',
      },
    },
  },
  plugins: [],
}
