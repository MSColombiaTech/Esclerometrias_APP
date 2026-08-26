/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#38a5f6',
          500: '#0e87eb',
          600: '#026bc9',
          700: '#0355a3',
          800: '#074885',
          900: '#0b3d6f',
          950: '#07264a',
        },
        concrete: {
          50: '#f7f8f9',
          100: '#eeeff2',
          200: '#dadee3',
          300: '#bcc3cb',
          400: '#9aa5b1',
          500: '#7e8a97',
          600: '#64707e',
          700: '#515a66',
          800: '#444b54',
          900: '#3a3f46',
        }
      }
    },
  },
  plugins: [],
}
