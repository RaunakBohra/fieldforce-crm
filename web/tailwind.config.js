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
          50: '#f0f9ff',   // sky-50 - light blue background
          100: '#e0f2fe',  // sky-100
          200: '#bae6fd',  // sky-200
          300: '#7dd3fc',  // sky-300
          600: '#0284c7',  // sky-600 - primary blue
          700: '#0369a1',  // sky-700 - darker blue
          800: '#075985',  // sky-800 - navy blue
          900: '#0c4a6e',  // sky-900
        },
        accent: {
          600: '#475569',  // slate-600 - silver accent
          700: '#334155',  // slate-700
        }
      }
    },
  },
  plugins: [],
}
