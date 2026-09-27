/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f4dab0',
          300: '#ecc07e',
          400: '#e3a04a',
          500: '#d4822a',  // primary warm gold
          600: '#b8691f',
          700: '#95521b',
          800: '#78421d',
          900: '#63381b',
          950: '#341b0b',
        },
        neutral: {
          850: '#1f1f1f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.14)',
      }
    },
  },
  plugins: [],
}
