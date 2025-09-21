/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Existing gold shades (keep them)
        gold: {
          400: "#facc15",
          500: "#eab308",
        },
        // New luxury palette
        goldLuxury: "#D4AF37", // Rich gold
        goldLight: "#FFD700", // Bright gold
        dark: "#0D0D0D", // Deep black
      },
    },
  },
  plugins: [],
};
