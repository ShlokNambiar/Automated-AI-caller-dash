/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: "#18181b",
        border: "#27272a",
        primary: "#6366f1",
        secondary: "#a855f7",
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
        text: "#fafafa",
        muted: "#a1a1aa"
      }
    },
  },
  plugins: [],
}
