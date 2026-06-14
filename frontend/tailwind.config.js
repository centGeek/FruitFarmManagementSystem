/** @type {import('tailwindcss').Config} */
export default {
  // Class-based dark mode: the `dark` class is toggled on <html> by src/utils/theme.ts.
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      },
    },
  },
  plugins: [],
}