/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        ink: "#1a1a1a",
        paper: "#fafaf7",
        rule: "#e5e5e0",
        muted: "#6b6b66",
      },
    },
  },
  plugins: [],
};
