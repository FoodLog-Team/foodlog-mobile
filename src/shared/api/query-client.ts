import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./errors";

const MAX_QUERY_RETRIES = 2;

/**
 * Retry only failures that a retry can fix: network problems, timeouts and 5xx.
 * Client errors (4xx) and cancellations fail immediately.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.kind === "aborted") {
      return false;
    }
    if (error.kind === "http" && error.status !== null && error.status < 500) {
      return false;
    }
  }
  return failureCount < MAX_QUERY_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetryQuery,
      },
      mutations: {
        // Mutations (saving or deleting a meal) are not idempotent; never retry them silently.
        retry: false,
      },
    },
  });
}
