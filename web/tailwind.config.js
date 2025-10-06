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
          300: '#d1d5db',  // gray-300
          400: '#9ca3af',  // gray-400
          500: '#6b7280',  // gray-500
          600: '#4b5563',  // gray-600
          700: '#374151',  // gray-700
          800: '#1f2937',  // gray-800
          900: '#111827',  // gray-900 - text primary
        },
        teal: {
          50: '#f0fdfa',   // teal-50 - lightest teal
          100: '#ccfbf1',  // teal-100
          200: '#99f6e4',  // teal-200
          300: '#5eead4',  // teal-300
          400: '#2dd4bf',  // teal-400
          500: '#14b8a6',  // teal-500
          600: '#0d9488',  // teal-600 - primary teal
          700: '#0f766e',  // teal-700
          800: '#115e59',  // teal-800
          900: '#134e4a',  // teal-900
        },
        amber: {
          50: '#fffbeb',   // amber-50
          100: '#fef3c7',  // amber-100
          200: '#fde68a',  // amber-200
          600: '#d97706',  // amber-600
          700: '#b45309',  // amber-700
          800: '#92400e',  // amber-800
          900: '#78350f',  // amber-900
        }
      }
    },
  },
  plugins: [],
}
