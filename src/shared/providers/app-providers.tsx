import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { createQueryClient } from "@/shared/api/query-client";

/** App-wide providers. Rendered once by the root layout. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useRefetchOnAppForeground();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * React Native has no window focus events. Tell TanStack Query when the app returns
 * to the foreground so stale data (e.g. today's dashboard) refetches.
 */
function useRefetchOnAppForeground() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });
    return () => subscription.remove();
  }, []);
}
