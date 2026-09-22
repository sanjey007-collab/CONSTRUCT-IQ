/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        construct: {
          dark: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
          amber: "#F59E0B",
          amberHover: "#D97706",
          blue: "#2563EB",
          steel: "#64748B",
          success: "#10B981",
          danger: "#EF4444",
          warning: "#F59E0B",
        }
      }
    },
  },
  plugins: [],
}
