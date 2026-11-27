import "../../global.css";

import { Stack, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

import { getErrorMessage } from "@/shared/api/errors";
import { AppProviders } from "@/shared/providers/app-providers";
import { palette } from "@/shared/theme/colors";
import { ErrorView } from "@/shared/ui/error-view";

export default function RootLayout() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";

  return (
    <AppProviders>
      <Stack
        screenOptions={{
          headerShown: false,
          // Matches the screen background so transitions never flash white in dark mode.
          contentStyle: { backgroundColor: palette[colorScheme].background },
        }}
      />
      <StatusBar style="auto" />
    </AppProviders>
  );
}

/** Shown by Expo Router when a screen throws during render. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ErrorView message={__DEV__ ? error.message : getErrorMessage(error)} onRetry={retry} />;
}
