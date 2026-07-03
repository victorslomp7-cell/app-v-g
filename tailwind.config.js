/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        sage: {
          50: '#f2f5ef',
          100: '#e2e9db',
          200: '#c7d5ba',
          300: '#a6bd91',
          400: '#87a672',
          500: '#6b8c56',
          600: '#546f43',
          700: '#425737',
          800: '#37462f',
          900: '#2f3c2a',
          950: '#171f14',
        },
        clay: {
          50: '#fbf3ee',
          100: '#f6e2d5',
          200: '#eec3ab',
          300: '#e39d78',
          400: '#d97b4f',
          500: '#c85f36',
          600: '#ac4a2a',
          700: '#8c3a25',
          800: '#713124',
          900: '#5d2a21',
          950: '#32130e',
        },
        ink: {
          50: '#f4f5f4',
          100: '#e4e6e3',
          200: '#c9cdc7',
          300: '#a5aba3',
          400: '#7e867c',
          500: '#636b61',
          600: '#4d544c',
          700: '#3f453e',
          800: '#2c302b',
          900: '#1c1f1b',
          950: '#101210',
        },
        linen: '#f6f1e9',
        umber: '#8a5a3b',
        ochre: {
          400: '#d1a441',
          500: '#b9862a',
          600: '#976b21',
        },
      },
      boxShadow: {
        soft: '0 2px 20px -4px rgba(28, 31, 27, 0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
