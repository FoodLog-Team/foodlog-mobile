/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Brand colors from the Foodlog web app (foodlog-frontend/src/index.css).
      colors: {
        background: { DEFAULT: "#f7f6f3", dark: "#121217" },
        heading: { DEFAULT: "#08060d", dark: "#f3f4f6" },
        muted: { DEFAULT: "#7a7385", dark: "#8d889a" },
        accent: { DEFAULT: "#8a2be2", dark: "#c084fc" },
      },
    },
  },
  plugins: [],
};
