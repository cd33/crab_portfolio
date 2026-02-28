/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      // Tunic-inspired color palette
      colors: {
        tunic: {
          green: '#8BC34A',
          'dark-green': '#4A7C4E',
          forest: '#4A7C4E',
          beige: '#E8DCC4',
          'dark-beige': '#D4C5A8',
          sand: '#D4C5A8',
          blue: '#64B5F6',
          steel: '#90A4AE',
          'dark-steel': '#607D8B',
          pink: '#F48FB1',
          gold: '#FFD54F',
          purple: '#9575CD',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


