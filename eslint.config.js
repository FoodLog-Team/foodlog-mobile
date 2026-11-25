// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier/flat");

module.exports = defineConfig([
  expoConfig,
  // Formatting is Prettier's job; turn off ESLint rules that conflict with it.
  prettierConfig,
  {
    ignores: ["dist/*", ".expo/*", "coverage/*", "expo-env.d.ts"],
  },
  {
    // Architecture boundary: shared code must not depend on features or routes.
    files: ["src/shared/**/*.{ts,tsx,js}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/app/*"],
              message: "src/shared must not import from features or routes.",
            },
          ],
        },
      ],
    },
  },
]);
