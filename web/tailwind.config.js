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
          50: '#f0fdfa',   // teal-50
          100: '#ccfbf1',  // teal-100
          200: '#99f6e4',  // teal-200
          300: '#5eead4',  // teal-300
          600: '#0d9488',  // teal-600
          700: '#0f766e',  // teal-700
          800: '#115e59',  // teal-800
          900: '#134e4a',  // teal-900
        },
        accent: {
          600: '#d97706',  // amber-600
          700: '#b45309',  // amber-700
        }
      }
    },
  },
  plugins: [],
}
