/**
 * FoodLog color tokens — the single source of truth for brand colors.
 *
 * Values come from the FoodLog web app (foodlog-frontend/src/index.css) so both
 * clients share one palette. They will be reconciled with the Figma design when
 * screens are implemented.
 *
 * Used by:
 * - tailwind.config.js → NativeWind classes such as `bg-background` and
 *   `dark:bg-background-dark`.
 * - TypeScript code that needs raw values (navigation background, status bar,
 *   ActivityIndicator) via `import { palette } from "@/shared/theme/colors"`.
 *
 * This file is CommonJS because tailwind.config.js loads it with require().
 */
const palette = {
  light: {
    background: "#f7f6f3",
    surface: "#ffffff",
    border: "#e5e4e7",
    borderStrong: "#cfcbd6",
    heading: "#08060d",
    body: "#5b5566",
    muted: "#7a7385",
    accent: "#8a2be2",
    accentHover: "#7420c4",
    onAccent: "#ffffff",
    success: "#1f7a4d",
    danger: "#b42318",
    info: "#33527a",
  },
  dark: {
    background: "#121217",
    surface: "#1b1b22",
    border: "#2e2e38",
    borderStrong: "#44434f",
    heading: "#f3f4f6",
    body: "#b4b0bd",
    muted: "#8d889a",
    accent: "#c084fc",
    accentHover: "#d3a6fd",
    onAccent: "#1a0b2a",
    success: "#5fd39a",
    danger: "#ff8a80",
    info: "#9ec1ef",
  },
};

module.exports = { palette };
