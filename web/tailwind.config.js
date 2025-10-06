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
          50: '#eff6ff',   // blue-50 - light background
          100: '#dbeafe',  // blue-100
          200: '#bfdbfe',  // blue-200
          300: '#93c5fd',  // blue-300
          500: '#3b82f6',  // blue-500
          600: '#2563eb',  // blue-600 - primary (Neutral Corporate)
          700: '#1d4ed8',  // blue-700 - darker blue
          800: '#1e40af',  // blue-800 - navy
          900: '#1e3a8a',  // blue-900
        },
        accent: {
          500: '#64748b',  // slate-500 - steel
          600: '#0ea5e9',  // sky-600 - accent cyan
          700: '#0284c7',  // sky-700
        },
        neutral: {
          50: '#f9fafb',   // gray-50
          100: '#f3f4f6',  // gray-100 - surface background
          200: '#e5e7eb',  // gray-200
          800: '#1f2937',  // gray-800
          900: '#111827',  // gray-900 - text primary
        }
      }
    },
  },
  plugins: [],
}
