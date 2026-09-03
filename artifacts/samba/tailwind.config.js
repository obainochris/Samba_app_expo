/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './context/**/*.{js,jsx,ts,tsx}', './data/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#FFFFFF',
        cream: '#F4F7FB',
        ink: '#16253F',
        banner: '#2D6CDF',
        terracotta: '#2D6CDF',
        peach: '#BED7FF',
        blush: '#EEF5FF',
        gold: '#BC8A4A',
        sage: '#8EA798',
        smoke: '#68758A',
        line: '#E2E9F3',
      },
    },
  },
  plugins: [],
};