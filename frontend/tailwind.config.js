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
          light: '#FFFFFF',
          gray: '#F9FAFB',
          border: '#E5E7EB',
          dark: '#111827',
          muted: '#6B7280',
          primary: '#D67026',
        }
      }
    },
  },
  plugins: [],
}