/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        allways: {
          dark: '#0A1628',
          navy: '#1A3A5C',
          blue: '#2563EB',
          cyan: '#4DB8FF',
          gold: '#D4A843',
          'gold-light': '#F0D78C',
          green: '#2D7A3A',
          'gray-light': '#E8EDF2',
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'sans-serif'],
      }
    }
  },
  plugins: []
}
