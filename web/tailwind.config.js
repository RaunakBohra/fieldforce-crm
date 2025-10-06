/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4f46e5',   // main CTA hover
          600: '#3730a3',   // main CTA default
          700: '#312e81',
          800: '#1e3a8a',   // navbar/backgrounds
          900: '#1e1b4b',
        },
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',   // pill buttons/badges
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        focus: {
          500: '#6366f1',
          600: '#4f46e5'
        },
        warn: {
          500: '#f97316',
          600: '#ea580c'
        },
        success: {
          500: '#10b981',
          600: '#059669'
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626'
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      }
    },
  },
  plugins: [],
}
