/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0f172a", // Slate 900
        surface: "#1e293b",    // Slate 800
        primary: "#50C878",    // Emerald Green
        secondary: "#10b981",  // Emerald 500
        accent: "#f43f5e",     // Rose 500
      },
    },
  },
  plugins: [],
}
