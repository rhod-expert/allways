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
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'spotlight': 'spotlight 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        spotlight: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
      },
      boxShadow: {
        'gold': '0 0 20px rgba(212, 168, 67, 0.3)',
        'gold-lg': '0 0 40px rgba(212, 168, 67, 0.4), 0 0 80px rgba(212, 168, 67, 0.1)',
        'gold-xl': '0 0 60px rgba(212, 168, 67, 0.5), 0 0 120px rgba(212, 168, 67, 0.15)',
        'inner-gold': 'inset 0 0 30px rgba(212, 168, 67, 0.1)',
      },
    }
  },
  plugins: []
}
