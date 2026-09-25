/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        secondary: '#2c3e50',
        accent: '#3498db',
        success: '#27ae60',
        danger: '#e74c3c',
        warning: '#f39c12',
      },
    },
  },
  plugins: [],
};
