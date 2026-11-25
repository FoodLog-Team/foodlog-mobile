/**
 * Public runtime configuration.
 *
 * Values come from `EXPO_PUBLIC_*` variables in `.env` / `.env.local`, which Expo
 * inlines into the JavaScript bundle at build time. They are readable by anyone
 * who has the app, so never put secrets here.
 *
 * Expo only inlines variables accessed with static dot notation
 * (`process.env.EXPO_PUBLIC_X`). Destructuring or `process.env["..."]` does not work.
 */

export class ConfigError extends Error {
  override name = "ConfigError";
}

/** Base URL of the FoodLog REST API, including the `/api` context path, without a trailing slash. */
export function getApiBaseUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new ConfigError(
      "EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env.local, set the backend URL and restart the dev server.",
    );
  }

  return apiUrl.replace(/\/+$/, "");
}
