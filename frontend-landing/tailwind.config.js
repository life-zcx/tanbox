/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0088B6',
          hover: '#00739B',
          light: '#E6F4F9',
          border: '#0088B6',
        },
        brand: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          black: '#000000',
          blue: '#0088B6',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'Manrope', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'Manrope', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
