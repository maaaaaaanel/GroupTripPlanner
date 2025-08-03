/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // This is the most important line!
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Make sure this path matches your project structure
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}