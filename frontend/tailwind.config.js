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
          50: '#f0f4ff',
          100: '#e0e9fe',
          200: '#c1d3fe',
          300: '#92b3fd',
          400: '#5c8afc',
          500: '#335ef7',
          600: '#2141ec',
          700: '#1930d8',
          800: '#1a29af',
          900: '#1b288b',
          950: '#111755',
        }
      }
    },
  },
  plugins: [],
}
