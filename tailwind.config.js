/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safar: {
          dark: "#234b4c",
          darker: "#1a3839",
          terracotta: "#d36b3d",
          amber: "#bc633a",
          sage: "#557b72",
          moss: "#74a181",
          sand: "#f5f6f1",
          card: "#fbfcf8",
          sidebar: "#eaf0e9",
          border: "#dce5dc"
        }
      },
      fontFamily: {
        sans: ["'Avenir Next'", "'Segoe UI'", "system-ui", "-apple-system", "sans-serif"]
      }
    },
  },
  plugins: [],
}
