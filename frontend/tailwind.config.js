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
          dark: '#1A1816',
          panel: '#2B2522',
          card: '#3A322D',
          border: '#51433A',
          primary: '#D67026',
          text: '#F5EFE6',
          muted: '#B8B0A3'
        }
      }
    },
  },
  plugins: [],
}