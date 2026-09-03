/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './context/**/*.{js,jsx,ts,tsx}', './data/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#FAF7F2',
        cream: '#F5EFE8',
        ink: '#27221F',
        terracotta: '#D86D55',
        peach: '#F5C6B7',
        blush: '#FBE8E1',
        gold: '#BC8A4A',
        sage: '#8EA798',
        smoke: '#8B8581',
        line: '#E7DED4',
      },
    },
  },
  plugins: [],
};