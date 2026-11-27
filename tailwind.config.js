const { palette } = require("./src/shared/theme/colors");

const toKebabCase = (name) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

// Every token becomes a light class plus a `-dark` variant, e.g.
// `bg-background dark:bg-background-dark`, `text-on-accent dark:text-on-accent-dark`.
const colors = Object.fromEntries(
  Object.keys(palette.light).map((name) => [
    toKebabCase(name),
    { DEFAULT: palette.light[name], dark: palette.dark[name] },
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
    },
  },
  plugins: [],
};
