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
          50: '#f8fafc',   // slate-50
          100: '#f1f5f9',  // slate-100
          200: '#e2e8f0',  // slate-200
          300: '#cbd5e1',  // slate-300
          600: '#2563eb',  // blue-600
          700: '#334155',  // slate-700
          800: '#1e293b',  // slate-800
          900: '#0f172a',  // slate-900
        },
        accent: {
          600: '#2563eb',  // blue-600
          700: '#1d4ed8',  // blue-700
        }
      }
    },
  },
  plugins: [],
}
